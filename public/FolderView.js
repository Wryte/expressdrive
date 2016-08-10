function FolderView(el) {
	this.el = el
	addClass(el, "folder-view")
}

FolderView.prototype.setFolders = function(folders) {
	this.folders = folders
	this.folders.expanded = true
	this.render()
}

FolderView.prototype.render = function() {
	this.el.innerHTML = ""
	this.renderFolder(this.folders, 0)
}

FolderView.prototype.renderFolder = function(folder, depth) {
	var self = this
	var item = templateGetNode("folderItem", {
		filename: folder.filename,
		selected: folder.selected ? "selected" : "",
		arrow: folder.expanded ? "down" : "right",
		disabled: folder.disabled ? "disabled" : "",
		margin: 1.5 * depth
	})
	item.querySelector(".expand-toggle").onclick = function() {
		folder.expanded = !folder.expanded
		self.render()
	}
	item.querySelector(".filename").onclick = function() {
		if (!folder.disabled) {
			self.clearSelected()
			folder.selected = true
			self.selectedFolder = folder
			self.render()
		}
	}
	this.el.appendChild(item)

	if (folder.expanded) {
		for (var i = 0; i < folder.folders.length; i++) {
			this.renderFolder(folder.folders[i], depth + 1)
		}
	}
}

FolderView.prototype.clearSelected = function(folder) {
	if (folder == undefined) { folder = this.folders }
	delete folder.selected

	for (var i = 0; i < folder.folders.length; i++) {
		this.clearSelected(folder.folders[i])
	}
}