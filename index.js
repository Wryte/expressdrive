"use strict";

var express = require("express")
var session = require("express-session")
var bodyParser = require("body-parser")
var fs = require("fs")
var Handlebars = require("handlebars")
var passport = require("passport")
var LocalStrategy = require("passport-local").Strategy
var appRoot = require("app-root-path")
var Sha256 = require("./public/Sha256")

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
		userName: config.adminUserName,
		password: Sha256.hash(Sha256.hash(config.adminUserName + config.adminPassword) + secret)
	}
}

// setup passport
passport.use(new LocalStrategy(
	{
		passReqToCallback: true
	},
	(req, userName, password, done) => {
		var user = users[userName.toLowerCase()]
		if (!user) {
			req.session.loginMessage = "invalid username"
			return done(null, false)
		} else if (Sha256.hash(password + secret) !== user.password) {
			req.session.loginMessage = "invalid password"
			return done(null, false)
		}
		done(null, {
			admin: user.admin,
			userName: user.userName
		})
	}
))

passport.serializeUser((user, done) => {
	done(null, user.userName);
})

passport.deserializeUser((id, done) => {
	done(null, users[id])
})

// set up templates
var templates = {}
function loadTemplates(callback) {
	fs.readdir(__dirname + "/views", (err, files) => {
		var fileCount = 0
		files.forEach((file, i) => {
			var templateName = file.split(".")[0]
			fs.readFile(__dirname + "/views/"+file, "utf8", (err, data) => {
				templates[templateName] = Handlebars.compile(data)

				Handlebars.unregisterPartial(templateName)
				Handlebars.registerPartial(templateName, data)

				fileCount++
				if (fileCount == files.length && callback) {
					callback()
				}
			})
		})
	})
}

class ExpressDrive {
	constructor(app, passedConfig) {
		this.app = app
		this.restrictedPaths = {
			f: true
		}

		this.init()
	}

	init() {
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

		this.app.use("*",
			(req, res, next) => {
				if (req.originalUrl.substring(0,config.path.length) == config.path) {
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

		this.app.get([config.path, config.path + "/f"],
			(req, res) => {
				if (!req.user) { return res.redirect(config.path + "/login") }
				res.send(templates.main({ page: "fileView", path: config.path, user: req.user }))
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
	}
}

module.exports = ExpressDrive