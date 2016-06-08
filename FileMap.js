"use strict"

var moment = require("moment")

class FileMap {
	constructor() {
		this.homeFolder = {
			files: {}
		}
	}
	navigateToFile(folderObj, pathArray) {
		if (pathArray.length == 0) {
			return folderObj
		}

		var nextFile = folderObj.files[pathArray.shift()]

		if (nextFile) {
			if (nextFile.type == "folder") {
				return this.navigateToFile(nextFile, pathArray)
			} else {
				return nextFile
			}
		}

		return
	}
	getFileFromPath(path) {
		var pathSplit = path.split("/")
		var first = pathSplit[0]
		while (first === "") {
			pathSplit.shift()
			first = pathSplit[0]
		}

		return this.navigateToFile(this.homeFolder, pathSplit)
	}
	getFolderData(path) {
		var folder = this.getFileFromPath(path)
		
		var files = []

		var fileCount = 0
		var folderCount = 0

		for (var k in folder.files) {
			var file = folder.files[k]
			files.push({
				filename: file.filename,
				type: file.type,
				created_by: file.created_by,
				time: "created on " + moment(file.date_created).format("MMMM D, YYYY"),
				uri: encodeURI(path + "/" + file.filename)
			})
			file.type == "file" ? fileCount++ : folderCount++
		}

		// sort on type then alphabetical
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

		// make the stats string
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
	getNewFileName(folder, filename, number) {
		var fileSplit = filename.split(".")
		var back = 2
		if (fileSplit.length == 1) { back = 1 }
		fileSplit[fileSplit.length - back] = fileSplit[fileSplit.length - back] + " (" + number + ")"
		var newFilename = fileSplit.join(".")

		if (newFilename in folder.files) {
			newFilename = this.getNewFileName(folder, filename, number + 1)
		}

		return newFilename
	}
	addFile(file, path, user) {
		var folder = this.getFileFromPath(path)

		if (file.originalname in folder.files) {
			file.originalname = this.getNewFileName(folder, file.originalname, 2)
		}

		folder.files[file.originalname] = {
			type: "file",
			nameOnDisk: file.filename,
			filename: file.originalname,
			created_by: user.username,
			date_created: (new Date()).getTime()
		}
	}
	createFolder(name, path, user) {
		var folder = this.getFileFromPath(path)

		if (name in folder.files) {
			name = this.getNewFileName(folder, name, 2)
		}

		folder.files[name] = {
			type: "folder",
			filename: name,
			created_by: user.username,
			date_created: (new Date()).getTime(),
			files: {}
		}
	}
}

module.exports = FileMap