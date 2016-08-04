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
					files: {},
					diskRC: {},
					permissions: {
						_all: 2
					}
				}
			}
		})
	}
	incRefCount(filename) {
		var refCount = this.homeFolder.diskRC[filename]
		if (!refCount) {
			refCount = 0
		}
		refCount++
		this.homeFolder.diskRC[filename] = refCount
	}
	decRefCount(filename) {
		if (--this.homeFolder.diskRC[filename] == 0) {
			delete this.homeFolder.diskRC[filename]
		}
		return this.homeFolder.diskRC[filename]
	}
	getUserPermissions(permissions, userId) {
		var permission = permissions[userId]

		if (permission === undefined) {
			permission = permissions["_all"]
		}

		return permission
	}
	navigateToFile(folderObj, pathArray, userId, currentPermissions) {
		if (pathArray.length == 0) {
			return {
				file: folderObj,
				permission: this.getUserPermissions(currentPermissions, userId)
			}
		}

		var nextFile = folderObj.files[pathArray.shift()]
		
		if (nextFile) {
			if (nextFile.permissions) {
				currentPermissions = nextFile.permissions
			}

			var permission = this.getUserPermissions(currentPermissions, userId)
			if (!permission && userId !== 0) {
				return {}
			}

			if (nextFile.type == "folder") {
				return this.navigateToFile(nextFile, pathArray, userId, currentPermissions)
			} else {
				return { file: nextFile, permission }
			}
		}

		return {}
	}
	getFileFromPath(path, userId) {
		var pathSplit = decodeURI(path).split("/")
		var first = pathSplit[0]
		while (first === "") {
			pathSplit.shift()
			first = pathSplit[0]
		}

		return this.navigateToFile(this.homeFolder, pathSplit, userId, this.homeFolder.permissions)
	}
	getFolderData(folderData, userId, path) {
		if (typeof folderData == "string") {
			path = folderData
			folderData = this.getFileFromPath(path, userId)
		}

		var folder = folderData.file
		var folderPermission = folderData.permission
		
		var files = []

		var fileCount = 0
		var folderCount = 0

		for (var k in folder.files) {
			var file = folder.files[k]
			
			if (!file.permissions || this.getUserPermissions(file.permissions, userId) !== undefined || userId == 0) {
				var fileObj = {
					filename: file.filename,
					type: file.type,
					created_by: file.created_by,
					time: "created on " + moment(file.date_created).format("MMMM D, YYYY"),
					uri: path + "/" + encodeURI(file.filename),
					extension: file.extension
				}
				files.push(fileObj)
				
				file.type == "file" ? fileCount++ : folderCount++
			}
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

		return { files, stats, breadcrumbs, folderPermission }
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
	getPermissions(path, userId) {
		var file = this.getFileFromPath(path, userId).file
		return file.permissions
	}
	setPermissions(path, permissionsData, inheritPermissions, userId) {
		var file = this.getFileFromPath(path, userId).file

		if (file && file.type == "folder") {
			if (inheritPermissions) {
				delete file.permissions
			} else {
				if (file.permissions === undefined) {
					file.permissions = {}
				}

				for (var i = 0; i < permissionsData.length; i++) {
					var item = permissionsData[i]

					if (item.permission === undefined) {
						delete file.permissions[item.id]
					} else {
						file.permissions[item.id] = item.permission
					}
				}
			}
		}

		this.save()
	}
	addFile(file, path, user) {
		var folder = this.getFileFromPath(path, user.id)
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

		this.incRefCount(file.filename)

		this.save()
	}
	createFolder(name, path, user) {
		var folder = this.getFileFromPath(path, user.id)
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
	deleteFiles(filePaths, userId) {
		var deletedFiles = []

		for (var i = 0; i < filePaths.length; i++) {
			var path = decodeURI(filePaths[i])
			var pathSplit = path.split("/")
			var filename = pathSplit[pathSplit.length - 1]
			var folderPath = path.substring(0, path.length - filename.length - 1)
			var folder = this.getFileFromPath(folderPath, userId)

			if (folder && filename in folder.files) {
				var file = folder.files[filename]
				if (file.type == "folder") {
					var folderFiles = this.getFilesInFolder(file)
					for (var j = 0; j < folderFiles.length; j++) {
						var folderFile = folderFiles[j]
						if (this.decRefCount(folderFile.nameOnDisk) == undefined) {
							deletedFiles.push(folderFile)
						}
					}
				} else {
					if (this.decRefCount(file.nameOnDisk) == undefined) {
						deletedFiles.push(file)
					}
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
	editFile(name, path, userId) {
		name = this.sanitizeFilename(name)
		path = decodeURI(path)
		var pathSplit = path.split("/")
		var oldFilename = pathSplit[pathSplit.length - 1]
		var folderPath = path.substring(0, path.length - oldFilename.length - 1)
		var folder = this.getFileFromPath(folderPath, userId)
		var file = this.getFileFromPath(path, userId)

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
	moveFiles(files, target, keepOriginal, userId) {
		var targetFolder = this.getFileFromPath(target, userId)

		if (targetFolder) {
			for (var i = 0; i < files.length; i++) {
				var path = decodeURI(files[i])
				var pathSplit = path.split("/")
				var filename = pathSplit[pathSplit.length - 1]
				var folderPath = path.substring(0, path.length - filename.length - 1)
				var folder = this.getFileFromPath(folderPath, userId)
				var file = this.getFileFromPath(path, userId)

				// prevent putting a folder inside itself
				if (!keepOriginal && file.type == "folder" && (target.startsWith(path + "/") || target == path)) {
					continue
				}

				if (folder && file) {
					if (!keepOriginal) {
						delete folder.files[filename]
					} else {
						this.incRefCount(file.nameOnDisk)
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