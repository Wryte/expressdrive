"use strict";

var express = require("express")
var session = require("express-session")
var bodyParser = require("body-parser")
var fs = require("fs")
var path = require("path")
var Handlebars = require("handlebars")
var templateLoader = require("./templateLoader")
var loadTemplates = templateLoader.loadTemplates
var templates = templateLoader.templates
var passport = require("passport")
var LocalStrategy = require("passport-local").Strategy
var appRoot = require("app-root-path")
var Sha256 = require("./public/Sha256")
var FileMap = require("./FileMap")
var BasicUsers = require("./BasicUsers")
var multer = require("multer")
var mkdirp = require("mkdirp")

// ensure some folders
mkdirp(appRoot + "/expressdrive/uploads")

// load up config
var defaultConfig = require("./default.config")
var config = {}

try {
	config = require(appRoot + "/expressdrive.config")
} catch (ex) {
    console.warn("expressdrive - no user config")
}

for (var k in defaultConfig) {
	if (config[k] === undefined) {
		config[k] = defaultConfig[k]
	}
}

var branding = {
	titlePrefix: config.titlePrefix,
	companyName: config.companyName,
	logo: config.logo
}

var basicUsers = new BasicUsers({
	saveDestination: appRoot + "/expressdrive/users.json",
	adminUsername: config.adminUsername,
	adminPassword: config.adminPassword,
	secret: config.secret
})


// setup passport
passport.use(new LocalStrategy(
	{
		passReqToCallback: true
	},
	(req, username, password, done) => {
		var user = basicUsers.getUserByUsername(username)
		if (!user) {
			req.session.loginMessage = "Invalid username"
			return done(null, false)
		} else if (!basicUsers.checkPassword(user, password)) {
			req.session.loginMessage = "Invalid password"
			return done(null, false)
		}
		done(null, {
			id: user.id,
			username: user.username,
			permission: user.permission
		})
	}
))

passport.serializeUser((user, done) => {
	done(null, user.id);
})

passport.deserializeUser((id, done) => {
	done(null, basicUsers.users[id])
})

class ExpressDrive {
	constructor(app, passedConfig) {
		this.app = app
		this.restrictedPaths = {
			f: true,
			fileTable: true,
			// edit
			upload: true,
			createFolder: true,
			editFile: true,
			moveFiles: true,
			getFolders: true,
			deleteFiles: true,
			// admin
			admin: true,
			createUser: true,
			editUser: true,
			deleteUser: true,
			userTable: true,
			getPermissions: true,
			setPermissions: true
		}
		this.fileMap = new FileMap({ saveDestination: appRoot + "/expressdrive/files.json" })

		this.init()
	}

	init() {
		// upload setup
		this.storage = multer.diskStorage({
			destination: function (req, file, cb) {
				cb(null, appRoot + "/expressdrive/uploads")
			},
			filename: function (req, file, cb) {
				var fileSplit = file.originalname.split(".")
				var extension = fileSplit[fileSplit.length - 1]
				cb(null, Sha256.hash(file.originalname + Date.now()) + "." + extension)
			}
		})
		this.upload = multer({ storage: this.storage })

		this.app.use(bodyParser.urlencoded({ extended: false }))
		this.app.use(bodyParser.json())
		this.app.use(session({
			secret: config.secret,
			resave: false,
			saveUninitialized: true,
			httpOnly: true,
			secure: false
		}));
		this.app.use("/expressdrive", express.static(__dirname + "/public"));
		this.app.use(passport.initialize())
		this.app.use(passport.session())

		// middleware to validate the user is logged in before viewing certain pages
		this.app.use("*",
			(req, res, next) => {
				if (req.originalUrl.substring(0,config.path.length) == config.path) {
					// reload templates with each request (TODO dev only)
					loadTemplates(() => {
						var urlComponents = req.originalUrl.substring(config.path.length).split("/")
						var userRestriced = this.restrictedPaths[urlComponents[1]]
						
						if (!req.user && userRestriced) {
							return res.redirect(config.path + "/login?oreq=" + req.originalUrl)
						}
						next()
					})
				}
			}
		)

		// login screen
		this.app.get(config.path + "/login",
			(req, res) => {
				if (req.user) { return res.redirect(config.path) }

				var message = req.session.loginMessage
				delete req.session.loginMessage
				res.setHeader('Cache-Control', 'no-cache, no-store')
				res.send(templates.main({ branding, page: "login", path: config.path, message }))
			}
		)

		// login post
		this.app.post(config.path + "/login",
			(req, res, next) => {
				passport.authenticate('local', (err, user, info) => {
					if (err) { return next(err); }
					if (!user) { return res.redirect(config.path + '/login'); }
					req.logIn(user, (err) => {
						if (err) { return next(err); }
						return res.redirect(req.body.oreq == "" ? config.path : req.body.oreq);
					});
				})(req, res, next);
			}
		)

		// logout
		this.app.get(config.path + "/logout",
			(req, res) => {
				if (req.user) {
					req.logout()
				}
				res.redirect(config.path + "/login")
			}
		)

		// fileView page when accessing from URL
		this.app.get([config.path, config.path + "/f", config.path + "/f/*"],
			(req, res) => {
				if (!req.user) { return res.redirect(config.path + "/login") }
				if (req.originalUrl == config.path) { req.originalUrl = config.path + "/f" }

				var cleanPath = req.originalUrl.substring(config.path.length + "/f".length)
				var fileData = this.fileMap.getFileFromPath(cleanPath, req.user)
				var file = fileData.file

				if (file == undefined) {
					return res.send(templates.main({
						branding,
						page: "loggedIn",
						view: "fileView",
						path: config.path,
						badRequest: true,
						user: req.user
					}))
				}

				if (file.type == "folder") {
					var folderData = this.fileMap.getFolderData(fileData, req.user, cleanPath)
					
					var folderPermission = fileData.permission
					if (req.user.permission === 0) {
						folderPermission = 0
					}

					res.setHeader('Cache-Control', 'no-cache, no-store')
					res.setHeader('Content-Type', 'text/html')
					res.send(templates.main({
						branding,
						page: "loggedIn",
						view: "fileView",
						path: config.path,
						user: req.user,
						folderPermission,
						files: folderData.files,
						stats: folderData.stats,
						breadcrumbs: folderData.breadcrumbs
					}))
				} else {
					res.sendFile(path.join(appRoot.path, 'expressdrive', 'uploads', file.nameOnDisk))
				}
			}
		)

		// endpoint for AJAX fileTable
		this.app.get([config.path + "/fileTable", config.path + "/fileTable/*"],
			(req, res) => {
				var cleanPath = req.originalUrl.substring(config.path.length + "/fileTable".length)
				var folderData = this.fileMap.getFolderData(cleanPath, req.user)

				var folderPermission = folderData.folderPermission
				if (req.user.permission === 0) {
					folderPermission = 0
				}

				res.send(templates.fileTable({
					path: config.path,
					user: req.user,
					files: folderData.files,
					stats: folderData.stats,
					folderPermission
				}))
			}
		)

		this.app.post(config.path + "/upload",
			this.upload.single("file"),
			(req, res) => {
				this.fileMap.addFile(req.file, req.query.target, req.user)
				res.sendStatus(200)
			}
		)

		this.app.post(config.path + "/createFolder",
			(req, res) => {
				this.fileMap.createFolder(req.body.name, req.body.target, req.user)
				res.sendStatus(200)
			}
		)

		this.app.post(config.path + "/editFile",
			(req, res) => {
				this.fileMap.editFile(req.body.name, req.body.filePath, req.user)
				res.sendStatus(200)
			}
		)

		this.app.post(config.path + "/moveFiles",
			(req, res) => {
				this.fileMap.moveFiles(req.body.files, req.body.target, req.body.keepOriginal, req.user)
				res.sendStatus(200)
			}
		)

		this.app.post(config.path + "/deleteFiles",
			(req, res) => {
				var deletedFiles = this.fileMap.deleteFiles(req.body.files, req.user)

				for (var i = 0; i < deletedFiles.length; i++) {
					fs.unlink(path.join(appRoot.path, 'expressdrive', 'uploads', deletedFiles[i].nameOnDisk))
				}

				res.sendStatus(200)
			}
		)

		this.app.get(config.path + "/getFolders",
			(req, res) => {
				res.send(this.fileMap.getFolders(req.user))
			}
		)

		this.app.post(config.path + "/getPermissions",
			(req, res) => {
				if (req.user.permission === 0) {
					var permissions = this.fileMap.getPermissions(req.body.path, req.user)
					var inheritPermissions
					var users = basicUsers.getUsers()
					users.unshift({ username: "All Users", id: "_all" })

					if (permissions == undefined) {
						inheritPermissions = true
						permissions = {}
					}

					var currentPermissions = []
					
					for (var i = 0; i < users.length; i++) {
						var user = users[i]
						var permItem = { name: user.username, id: user.id }
						var perm = permissions[user.id]

						if (perm === 1) {
							permItem.edit = true
						} else if (perm === 2) {
							permItem.read = true
						}

						currentPermissions.push(permItem)
					}

					res.send(templates.permissionsTable({
						inheritPermissions,
						permissions: currentPermissions,
						showInherit: req.body.path !== "" // check if it's the home folder
					}))
				} else {
					res.sendStatus(403)
				}
			}
		)

		this.app.post(config.path + "/setPermissions",
			(req, res) => {
				if (req.user.permission === 0) {
					this.fileMap.setPermissions(req.body.path, req.body.permissions, req.body.inheritPermissions, req.user)
					res.sendStatus(200)
				} else {
					res.sendStatus(403)
				}
			}
		)

		// administration
		this.app.get(config.path + "/admin",
			(req, res) => {
				res.send(templates.main({
					branding,
					page: "loggedIn",
					view: "adminView",
					user: req.user,
					users: basicUsers.getUsers(),
					path: config.path
				}))
			}
		)

		this.app.get(config.path + "/userTable",
			(req, res) => {
				res.send(templates.usersTable({
					user: req.user,
					users: basicUsers.getUsers(),
					path: config.path
				}))
			}
		)

		this.app.post(config.path + "/createUser",
			(req, res) => {
				basicUsers.createUser(req.body.username, req.body.password, req.body.permission)
				res.sendStatus(200)
			}
		)

		this.app.post(config.path + "/editUser",
			(req, res) => {
				basicUsers.editUser(req.body.id, req.body.username, req.body.password, req.body.permission)
				res.sendStatus(200)
			}
		)

		this.app.post(config.path + "/deleteUsers",
			(req, res) => {
				basicUsers.deleteUsers(req.body.ids)
				res.sendStatus(200)
			}
		)

		// error handling middleware
		this.app.use([config.path, config.path + "/*"],
			(err, req, res, next) => {
				console.error(err.stack);
				res.status(500).send('Something broke!');
			}
		)
	}
}

module.exports = ExpressDrive