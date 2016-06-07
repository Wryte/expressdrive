"use strict";

var express = require("express")
var session = require("express-session")
var bodyParser = require("body-parser")
var fs = require("fs")
var Handlebars = require("handlebars")
var templateLoader = require("./templateLoader")
var loadTemplates = templateLoader.loadTemplates
var templates = templateLoader.templates
var passport = require("passport")
var LocalStrategy = require("passport-local").Strategy
var appRoot = require("app-root-path")
var Sha256 = require("./public/Sha256")
var FileMap = require("./FileMap")
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

var secret = "M^Secr3tIsB3tter"

var users = {
	[config.adminUserName]: {
		admin: true,
		username: config.adminUserName,
		password: Sha256.hash(Sha256.hash(config.adminUserName + config.adminPassword) + secret)
	}
}

// setup passport
passport.use(new LocalStrategy(
	{
		passReqToCallback: true
	},
	(req, username, password, done) => {
		var user = users[username.toLowerCase()]
		if (!user) {
			req.session.loginMessage = "Invalid username"
			return done(null, false)
		} else if (Sha256.hash(password + secret) !== user.password) {
			req.session.loginMessage = "Invalid password"
			return done(null, false)
		}
		done(null, {
			admin: user.admin,
			username: user.username
		})
	}
))

passport.serializeUser((user, done) => {
	done(null, user.username);
})

passport.deserializeUser((id, done) => {
	done(null, users[id])
})

class ExpressDrive {
	constructor(app, passedConfig) {
		this.app = app
		this.restrictedPaths = {
			f: true,
			upload: true,
			createFolder: true,
			fileTable: true
		}
		this.fileMap = new FileMap()

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
			secret,
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
						if (!req.user && this.restrictedPaths[urlComponents[1]]) {
							return res.redirect(config.path + "/login?oreq=" + req.originalUrl)
						}
						next()
					})
				}
			}
		)

		// fileView page when accessing from URL
		this.app.get([config.path, config.path + "/f", config.path + "/f/*"],
			(req, res) => {
				if (!req.user) { return res.redirect(config.path + "/login") }

				var fileStats = this.fileMap.getFiles(req.originalUrl)

				res.send(templates.main({
					page: "fileView",
					path: config.path,
					pwd: "/",
					user: req.user,
					files: fileStats.files,
					stats: fileStats.stats
				}))
			}
		)

		// endpoint for AJAX fileTable
		this.app.get([config.path + "/fileTable", config.path + "/fileTable/*"],
			(req, res) => {
				var fileStats = this.fileMap.getFiles(req.originalUrl)

				res.send(templates.fileTable({
					path: config.path,
					pwd: "/",
					user: req.user,
					files: fileStats.files,
					stats: fileStats.stats
				}))
			}
		)

		this.app.get(config.path + "/login",
			(req, res) => {
				if (req.user) { return res.redirect(config.path) }

				var message = req.session.loginMessage
				delete req.session.loginMessage
				res.send(templates.main({ page: "login", path: config.path, message: message }))
			}
		)

		this.app.post(config.path + "/login",
			passport.authenticate("local", {
				failureRedirect: config.path + "/login",
				successRedirect: config.path
			})
		)

		this.app.get(config.path + "/logout",
			(req, res) => {
				if (req.user) {
					req.logout()
				}
				res.redirect(config.path + "/login")
			}
		)

		this.app.post(config.path + "/upload",
			this.upload.single("file"),
			(req, res) => {
				this.fileMap.addFile(req.file, "/", req.user)
				res.sendStatus(200)
			}
		)

		this.app.post(config.path + "/createFolder",
			(req, res) => {
				this.fileMap.createFolder(req.body.name, "/", req.user)
				res.sendStatus(200)
			}
		)
	}
}

module.exports = ExpressDrive