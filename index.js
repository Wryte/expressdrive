"use strict";

var express = require("express")
var fs = require("fs")
var Handlebars = require("handlebars")
var passport = require("passport")
var LocalStrategy = require("passport-local").Strategy
var appRoot = require("app-root-path")

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

var users = {
	[config.adminUser]: { _id: 0, admin: true, userName: "admin", password: config.adminPassword }
}

// setup passport
passport.use(new LocalStrategy(
	(userName, password, done) => {
		var user = users[userName.toLowerCase()]
		if (!user) {
			done(null, false, { message: "invalid username" })
		} else if (password !== user.password) {
			done(null, false, { message: "invalid password" })
		}
		done(null, user)
	}
))

passport.serializeUser((user, done) => {
	done(null, user._id);
})

passport.deserializeUser((id, done) => {
	done(null, users[id])
})

// set up templates
var templates = {}
fs.readdir(__dirname + "/views", (err, files) => {
	files.forEach((file, i) => {
		var templateName = file.split(".")[0]
		fs.readFile(__dirname + "/views/"+file, "utf8", (err, data) => {
			templates[templateName] = Handlebars.compile(data)
			Handlebars.registerPartial(templateName, data)
		})
	})
})

class ExpressDrive {
	constructor(app, passedConfig) {
		this.app = app
		this.passportRedirectObj = {
			successRedirect: config.path,
			failureRedirect: config.path + '/login',
			failureFlash: true
		}

		this.init()
	}

	init() {
		this.app.use("/expressdrive", express.static(__dirname + "/public"));
		this.app.use(passport.initialize());
		this.app.use(passport.session());

		this.app.get(config.path,
			passport.authenticate("local", this.passportRedirectObj),
			(req, res) => {
				res.send("<h1>Hello from ExpressDrive!</h1>")
			}
		)

		this.app.get(config.path + "/login",
			(req, res) => {
				if (req.user) {
					req.redirect(config.path)
				} else {
					res.send(templates.main({ page: "login" }))
				}
			}
		)

		this.app.post(config.path + "/login",
			passport.authenticate('local', this.passportRedirectObj)
		)
	}
}

module.exports = ExpressDrive