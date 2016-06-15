"use strict"

var Sha256 = require("./public/Sha256")
var fs = require("fs")

class BasicUsers {
	constructor(props) {
		this.saveDestination = props.saveDestination
		this.adminUsername = props.adminUsername.toLowerCase()
		this.adminPassword = props.adminPassword
		this.secret = props.secret
		this.load()
	}
	save() {
		fs.writeFile(this.saveDestination, JSON.stringify(this.users))
	}
	load() {
		fs.readFile(this.saveDestination, (err, data) => {
			if (data) {
				this.users = JSON.parse(data)
			} else {
				this.users = {}
			}

			this.users[this.adminUsername] = {
				username: this.adminUsername,
				password: this.hashPassword(Sha256.hash(this.adminUsername + this.adminPassword)),
				permission: "admin"
			}
		})
	}
	getUsers() {
		var users = []

		for (var k in this.users) {
			var user = this.users[k]
			if (user.username !== this.adminUsername) {
				users.push({
					username: user.username,
					permission: user.permission
				})
			}
		}

		return users
	}
	hashPassword(password) {
		return Sha256.hash(password + this.secret)
	}
	checkPassword(user, password) {
		return user.password === Sha256.hash(password + this.secret)
	}
	createUser(username, password, permission) {
		username = username.toLowerCase()

		if (username !== this.adminUsername) {
			this.users[username] = {
				username,
				password: this.hashPassword(password),
				permission
			}

			this.save()
		}
	}
	editUser(oldUsername, username, password, permission) {
		username = username.toLowerCase()
		var oldUser = this.users[oldUsername]

		if (username !== this.adminUsername && oldUsername !== this.adminUsername && oldUser) {
			if (oldUsername !== username) {
				delete this.users[oldUsername]
				this.users[username] = oldUser
				oldUser.username = username
			}

			if (password) {
				oldUser.password = this.hashPassword(password)
			}

			oldUser.permission = permission
			
			this.save()
		}
	}
	deleteUser(username) {
		if (username !== this.adminUsername) {
			delete this.users[username]
			this.save()
		}
	}
}

module.exports = BasicUsers