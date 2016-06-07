"use strict"

var moment = require("moment")

class FileMap {
	constructor() {
		this.files = {}
	}
	splitPath(path) {
		return req.originalUrl.substring(config.path.length).split("/")
	}
	getFiles(path) {
		var files = []

		var folder = this.files
		var fileCount = 0
		var folderCount = 0

		for (var k in folder) {
			var file = folder[k]
			files.push({
				filename: file.filename,
				type: file.type,
				created_by: file.created_by,
				time: "created on " + moment(file.date_created).format("MMMM D, YYYY")
			})
			file.type == "file" ? fileCount++ : folderCount++
		}

		files.sort((a,b) => {
			if (a.type !== b.type) {
				if (a.type == "folder") {
					return -1
				} else {
					return 1
				}
			} else if (a.filename !== b.filename) {
				if (a.filename >= b.filename) {
					return 1
				} else {
					return -1
				}
			}
			return 0
		})

		var stats = []

		if (fileCount > 0) {
			stats.push(fileCount + " file")
			if (fileCount > 1) {
				stats.push("s")
			}

			if (folderCount > 0) {
				stats.push(", ")
			}
		}

		if (folderCount > 0) {
			stats.push(folderCount + " folder")
			if (folderCount > 1) {
				stats.push("s")
			}
		}

		stats = stats.join("")

		return {files, stats}
	}
	getNewFileName(filename, number) {
		var fileSplit = filename.split(".")
		var back = 2
		if (fileSplit.length == 1) { back = 1 }
		fileSplit[fileSplit.length - back] = fileSplit[fileSplit.length - back] + " (" + number + ")"
		var newFilename = fileSplit.join(".")

		if (newFilename in this.files) {
			newFilename = this.getNewFileName(filename, number + 1)
		}

		return newFilename
	}
	addFile(file, path, user) {
		if (file.originalname in this.files) {
			file.originalname = this.getNewFileName(file.originalname, 2)
		}

		this.files[file.originalname] = {
			type: "file",
			nameOnDisk: file.filename,
			filename: file.originalname,
			created_by: user.username,
			date_created: (new Date()).getTime()
		}
	}
	createFolder(name, path, user) {
		if (name in this.files) {
			name = this.getNewFileName(name, 2)
		}

		this.files[name] = {
			type: "folder",
			filename: name,
			created_by: user.username,
			date_created: (new Date()).getTime(),
			files: {}
		}
	}
}

module.exports = FileMap