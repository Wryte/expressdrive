"use strict"

var moment = require("moment")
var fs = require("fs")

class FileMap {
	constructor(props) {
		this.saveDestination = props.saveDestination

		this.load()
	}
	save() {
		fs.writeFile(this.saveDestination, JSON.stringify(this.homeFolder))
	}
	load() {
		fs.readFile(this.saveDestination, (err, data) => {
			if (data) {
				this.homeFolder = JSON.parse(data)
			} else {
				this.homeFolder = {
					type: "folder",
					files: {}
				}
			}
		})
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
		var pathSplit = decodeURI(path).split("/")
		var first = pathSplit[0]
		while (first === "") {
			pathSplit.shift()
			first = pathSplit[0]
		}

		return this.navigateToFile(this.homeFolder, pathSplit)
	}
	getFolderData(folder, path) {
		if (typeof folder == "string") {
			path = folder
			folder = this.getFileFromPath(path)
		}
		
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
				uri: path + "/" + encodeURI(file.filename),
				extension: file.extension
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

		// generate the breadcrumbs
		var breadcrumbs = []
		var pathSplit = decodeURI(path).split("/")
		var breadcrumbStack = []

		for (var i = 0; i < pathSplit.length; i++) {
			var crumb = pathSplit[i]
			breadcrumbStack.push(crumb)
			breadcrumbs.push({ name: crumb == "" ? "Home" : crumb, path: encodeURI(breadcrumbStack.join("/")) })
		}
		breadcrumbs[breadcrumbs.length - 1].last = true

		return { files, stats, breadcrumbs }
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
		file.originalname = this.sanitizeFilename(file.originalname)

		if (file.originalname in folder.files) {
			file.originalname = this.getNewFileName(folder, file.originalname, 2)
		}

		var extensionSplit = file.originalname.split(".")
		var extension = extensionSplit[extensionSplit.length - 1]

		folder.files[file.originalname] = {
			type: "file",
			nameOnDisk: file.filename,
			filename: file.originalname,
			created_by: user.username,
			extension,
			date_created: (new Date()).getTime()
		}

		this.save()
	}
	createFolder(name, path, user) {
		var folder = this.getFileFromPath(path)
		name = this.sanitizeFilename(name)

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

		this.save()
	}
	deleteFiles(filePaths) {
		var deletedFiles = []

		for (var i = 0; i < filePaths.length; i++) {
			var path = decodeURI(filePaths[i])
			var pathSplit = path.split("/")
			var filename = pathSplit[pathSplit.length - 1]
			var folderPath = path.substring(0, path.length - filename.length - 1)
			var folder = this.getFileFromPath(folderPath)

			if (folder && filename in folder.files) {
				var file = folder.files[filename]
				if (file.type == "folder") {
					deletedFiles = deletedFiles.concat(this.getFilesInFolder(file))
				} else {
					deletedFiles.push(file)
				}
				delete folder.files[filename]
			}
		}

		this.save()

		return deletedFiles
	}
	getFilesInFolder(folder) {
		var files = []

		for (var k in folder.files) {
			var file = folder.files[k]
			if (file.type == "folder") {
				files = files.concat(this.getFilesInFolder(file))
			} else {
				files.push(file)
			}
		}

		return files
	}
	sanitizeFilename(name) {
		return name.replace(/[^.a-zA-Z0-9 _-]/g, "")
	}
	editFile(name, path) {
		name = this.sanitizeFilename(name)
		path = decodeURI(path)
		var pathSplit = path.split("/")
		var oldFilename = pathSplit[pathSplit.length - 1]
		var folderPath = path.substring(0, path.length - oldFilename.length - 1)
		var folder = this.getFileFromPath(folderPath)
		var file = this.getFileFromPath(path)

		if (folder && file) {
			delete folder.files[oldFilename]

			if (name in folder.files) {
				name = this.getNewFileName(folder, name, 2)
			}
			
			folder.files[name] = file
			file.filename = name
		}

		this.save()
	}
	moveFiles(files, target, keepOriginal) {
		var targetFolder = this.getFileFromPath(target)

		if (targetFolder) {
			for (var i = 0; i < files.length; i++) {
				var path = decodeURI(files[i])
				var pathSplit = path.split("/")
				var filename = pathSplit[pathSplit.length - 1]
				var folderPath = path.substring(0, path.length - filename.length - 1)
				var folder = this.getFileFromPath(folderPath)
				var file = this.getFileFromPath(path)

				// prevent putting a folder inside itself
				if (file.type == "folder" && (target.startsWith(path + "/") || target == path)) {
					continue
				}

				if (folder && file) {
					if (!keepOriginal) {
						delete folder.files[filename]
					}

					if (filename in targetFolder.files) {
						filename = this.getNewFileName(targetFolder, filename, 2)
					}

					targetFolder.files[filename] = file
					file.filename = filename
				}
			}

			this.save()
		}
	}
	getFolders(current, folder, path) {
		if (folder == undefined) { folder = this.homeFolder }
		if (current == undefined) { current = { folders:[], filename:"Home", path: "/" } }
		if (path == undefined) { path = "" }

		for (var k in folder.files) {
			var file = folder.files[k]
			if (file.type == "folder") {
				var innerPath = path + "/" + file.filename
				var innerFolder = {
					folders: [],
					filename: file.filename,
					path: innerPath
				}
				this.getFolders(innerFolder, file, innerPath)
				current.folders.push(innerFolder)
			}
		}

		current.folders.sort((a,b) => {
			if (a.filename !== b.filename) {
				if (a.filename >= b.filename) {
					return 1
				} else {
					return -1
				}
			}
			return 0
		})

		return current
	}
}

module.exports = FileMap