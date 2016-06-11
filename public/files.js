document.addEventListener("DOMContentLoaded", function() {
	// setup popups
	var shade = document.getElementById("shade")

	var uploadButton = document.getElementById("uploadButton")
	var uploadPopup = document.getElementById("uploadPopup")
	var	uploadInput = document.getElementById("uploadInput")
	var	uploadItemsContainer = document.getElementById("uploadItemsContainer")

	var createFolderPopupButton = document.getElementById("createFolderPopupButton")
	var createFolderPopup = document.getElementById("createFolderPopup")
	var folderNameInput = document.getElementById("folderNameInput")
	var createFolderButton = document.getElementById("createFolderButton")

	var editPopupButton = document.getElementById("editPopupButton")
	var editPopup = document.getElementById("editPopup")
	var filenameInput = document.getElementById("filenameInput")
	var editButton = document.getElementById("editButton")

	var deletePopupButton = document.getElementById("deletePopupButton")
	var deletePopup = document.getElementById("deletePopup")
	var deleteButton = document.getElementById("deleteButton")

	var closeShade

	// bind buttons in tray
	uploadButton.onclick = function() {
		setFolderName()
		closeShade = generatePopupTL(uploadPopup, shade)
	}

	createFolderPopupButton.onclick = function() {
		setFolderName()
		closeShade = generatePopupTL(createFolderPopup, shade)
	}

	deletePopupButton.onclick = function() {
		setFolderName()
		var selected = getSelected()
		if (selected.length > 0) {
			document.getElementById("deleteHeaderSpan").innerText = selected.length + " item" + (selected.length > 1 ? "s" : "")
			document.getElementById("deleteBodySpan").innerText = selected.length > 1 ? "these items" : "this item"
			closeShade = generatePopupTL(deletePopup, shade)
		}
	}

	editPopupButton.onclick = function() {
		var selected = getSelected()
		if (selected.length == 1) {
			document.getElementById("editHeaderSpan").innerText = selected[0].dataset.filename
			filenameInput.value = selected[0].dataset.filename
			closeShade = generatePopupTL(editPopup, shade)
		}
	}

	// upload popup events
	uploadInput.onchange = function(e) {
		for (var i = 0; i < uploadInput.files.length; i++) {
			uploadFile(uploadInput.files[i], uploadItemsContainer)
		}
	}

	// create folder popup events
	folderNameInput.onkeyup = function(e) {
		if (e.keyCode == 13) { createFolder() }
		var sanitizedName = sanitizeFileName(this.value)
		if (this.value !== sanitizedName) {
			this.value = sanitizeFileName(this.value)
		}
	}

	createFolderButton.onclick = createFolder

	function createFolder() {
		var folderName = folderNameInput.value

		if (folderName !== "") {
			var xhr = new XMLHttpRequest()

			xhr.open("POST", __path + "/createFolder")
			xhr.setRequestHeader("Content-type", "application/json");

			xhr.onload = function(e) {
				if (xhr.status == 200) {
					setTimeout(function() { folderNameInput.value = "New Folder" }, 1000)
					if (closeShade) { closeShade() }
					reloadFileTable()
				}
			}

			xhr.send(JSON.stringify({ name: folderName, target: getCurrentPath() }))
		}
	}

	// delete popup events
	deleteButton.onclick = deleteFiles

	function deleteFiles() {
		var selected = getSelected()
		var deleteFiles = []

		for (var i = 0; i < selected.length; i++) {
			deleteFiles.push(selected[i].dataset.uri)
		}

		var xhr = new XMLHttpRequest()

		xhr.open("POST", __path + "/deleteFiles")
		xhr.setRequestHeader("Content-type", "application/json");

		xhr.onload = function(e) {
			if (xhr.status == 200) {
				if (closeShade) { closeShade() }
				reloadFileTable()
			}
		}

		xhr.send(JSON.stringify({ files: deleteFiles }))
	}

	// edit popup events
	editButton.onclick = editFile
	filenameInput.onkeyup = function(e) {
		if (e.keyCode == 13) { editFile() }
		var sanitizedName = sanitizeFileName(this.value)
		if (this.value !== sanitizedName) {
			this.value = sanitizeFileName(this.value)
		}
	}

	function editFile() {
		var selected = getSelected()
		var filename = filenameInput.value

		if (filename !== "") {
			var xhr = new XMLHttpRequest()

			xhr.open("POST", __path + "/editFile")
			xhr.setRequestHeader("Content-type", "application/json");

			xhr.onload = function(e) {
				if (xhr.status == 200) {
					if (closeShade) { closeShade() }
					reloadFileTable()
				}
			}

			xhr.send(JSON.stringify({ name: filename, filePath: selected[0].dataset.uri }))
		}
	}

	// file selection
	function getSelected() {
		return document.querySelectorAll(".file-table .file-element.selected")
	}

	function selectOnTL(icon) {
		var tl = new TimelineMax()
		
		tl.to(icon, 0.1, { scale: 0.6, color: "#75B37A" })
		tl.add(TweenMax.delayedCall(0, function() {
			removeClass(icon, "fa-circle-o")
			addClass(icon, "fa-check-circle-o")
		}))
		tl.to(icon, 0.1, { scale: 1 })

		return tl
	}

	function selectOffTL(icon) {
		var tl = new TimelineMax()
		
		tl.to(icon, 0.1, { scale: 0.6, color: "#333" })
		tl.add(TweenMax.delayedCall(0, function() {
			removeClass(icon, "fa-check-circle-o")
			addClass(icon, "fa-circle-o")
		}))
		tl.to(icon, 0.1, { scale: 1 })

		return tl
	}

	bindOn("click", ".select-td", function(e) {
		var parentTR = this.parentElement
		var icon = this.querySelector(".fa")

		if (hasClass(parentTR, "selected")) {
			removeClass(parentTR, "selected")
			selectOffTL(icon)
		} else {
			addClass(parentTR, "selected")
			selectOnTL(icon)
		}

		updateSelection()
	})

	bindOn("click", ".select-all-td", function(e) {
		var selected = getSelected()
		var fileElements = document.querySelectorAll(".file-element")
		var selectAllIcon = this.querySelector("i")
		var tl = new TimelineMax()
		
		if (selected.length == 0) {
			addClass(selectAllIcon, "selected")
			tl.add(selectOnTL(selectAllIcon))

			for (var i = 0; i < fileElements.length; i++) {
				var fileElement = fileElements[i]
				addClass(fileElement, "selected")
				tl.add(selectOnTL(fileElement.querySelector(".select-td i")), i == 0 ? "a" : "a+=" + (0.05 * i))
			}

		} else {
			if (fileElements.length == selected.length) {
				removeClass(selectAllIcon, "selected")
				tl.add(selectOffTL(selectAllIcon))
			}

			for (var i = 0; i < selected.length; i++) {
				var fileElement = selected[i]
				removeClass(fileElement, "selected")
				tl.add(selectOffTL(fileElement.querySelector(".select-td i")), i == 0 ? "a" : "a+=" + (0.05 * i))
			}
		}

		tl.add(TweenMax.delayedCall(0, updateSelection))
	})

	function updateSelection() {
		var selected = getSelected()
		var fileElements = document.querySelectorAll(".file-element")
		var selectAllIcon = document.querySelector(".select-all-td i")

		if (selected.length == 0) {
			addClass(editPopupButton, "disabled")
			addClass(deletePopupButton, "disabled")
		}
		if (selected.length >= 1) {
			removeClass(deletePopupButton, "disabled")
			removeClass(editPopupButton, "disabled")
		}
		if (selected.length > 1) {
			addClass(editPopupButton, "disabled")
		}

		if (selected.length == fileElements.length) {
			if (!hasClass(selectAllIcon, "selected")) {
				addClass(selectAllIcon, "selected")
				selectOnTL(selectAllIcon)
			}
		} else if (hasClass(selectAllIcon, "selected")) {
			removeClass(selectAllIcon, "selected")
			selectOffTL(selectAllIcon)
		}
	}
})