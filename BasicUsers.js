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
		fs.writeFile(this.saveDestination, JSON.stringify({
			users: this.users,
			nextUserId: this.nextUserId
		}))
	}
	load() {
		fs.readFile(this.saveDestination, (err, data) => {
			if (data) {
				var parsed = JSON.parse(data)
				this.users = parsed.users
				this.nextUserId = parsed.nextUserId
			} else {
				this.users = {}
				this.nextUserId = 1
			}

			this.users["0"] = {
				id: 0,
				username: this.adminUsername,
				password: this.hashPassword(Sha256.hash(this.adminUsername + this.adminPassword)),
				permission: 0
			}
		})
	}
	getUserByUsername(username) {
		username = username.toLowerCase()
		for (var k in this.users) {
			var user = this.users[k]
			if (user.username == username) {
				return user
			}
		}
	}
	getUsers() {
		var users = []

		for (var k in this.users) {
			var user = this.users[k]
			if (user.username !== this.adminUsername) {
				users.push({
					id: user.id,
					username: user.username,
					permission: user.permission
				})
			}
		}

		users.sort((a,b) => {
			if (a.username !== b.username) {
				if (a.username >= b.username) {
					return 1
				} else {
					return -1
				}
			}
			return 0
		})

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
			var id = this.nextUserId++
			this.users[id] = {
				id,
				username,
				password: this.hashPassword(password),
				permission
			}

			this.save()
		}
	}
	editUser(id, username, password, permission) {
		username = username.toLowerCase()
		var oldUser = this.users[id]

		if (username !== this.adminUsername && id !== 0 && oldUser) {
			oldUser.username = username

			if (password) {
				oldUser.password = this.hashPassword(password)
			}

			oldUser.permission = permission
			
			this.save()
		}
	}
	deleteUsers(ids) {
		for (var i = 0; i < ids.length; i++) {
			var id = ids[i]
			
			if (id !== this.adminUsername) {
				delete this.users[id]
				this.save()
			}
		}
	}
}

module.exports = BasicUsers