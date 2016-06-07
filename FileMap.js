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
		var fileArray = []

		var folder = this.files

		for (var k in folder) {
			var file = folder[k]
			fileArray.push({
				filename: file.filename,
				type: file.type,
				created_by: file.created_by,
				time: moment(file.date_created).fromNow()
			})
		}

		fileArray.sort((a,b) => {
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

		return fileArray
	}
	getNewFileName(filename, number) {
		var fileSplit = filename.split(".")
		fileSplit[fileSplit.length - 2] = fileSplit[fileSplit.length - 2] + " (" + number + ")"
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
			nameOnDisk: file.filename,
			filename: file.originalname,
			created_by: user.username,
			date_created: (new Date()).getTime(),
			type: "file"
		}
	}
}

module.exports = FileMap