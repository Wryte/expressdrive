document.addEventListener("DOMContentLoaded", function() {
	var shade = document.getElementById("shade")

	var permissionsButton = document.getElementById("permissionsButton")
	var permissionsPopup = document.getElementById("permissionsPopup")
	var permissionsPopupBody = document.getElementById("permissionsPopupBody")

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
	var editExtensionSpan = document.getElementById("editExtensionSpan")
	var editButton = document.getElementById("editButton")

	var deletePopupButton = document.getElementById("deletePopupButton")
	var deletePopup = document.getElementById("deletePopup")
	var deleteButton = document.getElementById("deleteButton")

	var moveItemsPopupButton = document.getElementById("moveItemsPopupButton")
	var moveItemsPopup = document.getElementById("moveItemsPopup")
	var moveItemsHeaderSpan = document.getElementById("moveItemsHeaderSpan")
	var keepOriginalInput = document.getElementById("keepOriginalInput")
	var moveButton = document.getElementById("moveButton")
	var folderViewElement = document.getElementById("folderViewElement")
	var folderView = new FolderView(folderViewElement)

	var closeShade

	// bind buttons in tray
	permissionsButton.onclick = function() {
		setFolderName()

		var xhr = new XMLHttpRequest()

		xhr.open("POST", __path + "/getPermissions")
		xhr.setRequestHeader("Content-type", "application/json")

		xhr.onload = function(e) {
			if (xhr.status == 200) {
				closeShade = generatePopupTL(permissionsPopup, shade)
				permissionsPopupBody.innerHTML = xhr.responseText
			}
		}

		xhr.send(JSON.stringify({ path: getCurrentPath() }))
		closeShade = generatePopupTL(permissionsPopup, shade)

	}

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
		var selected = selectTable.getSelected()
		if (selected.length > 0) {
			document.getElementById("deleteHeaderSpan").innerText = selected.length + " item" + (selected.length > 1 ? "s" : "")
			document.getElementById("deleteBodySpan").innerText = selected.length > 1 ? "these items" : "this item"
			closeShade = generatePopupTL(deletePopup, shade)
		}
	}

	editPopupButton.onclick = function() {
		var selected = selectTable.getSelected()
		if (selected.length == 1) {
			var itemData = selected[0].dataset
			document.getElementById("editHeaderSpan").innerText = itemData.filename

			if (itemData.extension) {
				var filenameSplit = itemData.filename.split(".")
				
				editExtensionSpan.style.display = "block"
				editExtensionSpan.innerText = "." + filenameSplit.pop()
				
				filenameInput.value = filenameSplit.join(".")
			} else {
				editExtensionSpan.style.display = "none"
				filenameInput.value = itemData.filename
			}
			
			closeShade = generatePopupTL(editPopup, shade)
		}
	}

	moveItemsPopupButton.onclick = function() {
		var selected = selectTable.getSelected()

		if (selected.length > 0) {
			moveItemsHeaderSpan.innerText = selected.length > 1 ? selected.length + " Items" : "'" + selected[0].dataset.filename + "'"

			var xhr = new XMLHttpRequest()

			xhr.open("GET", __path + "/getFolders")
			xhr.responseType = "json"

			xhr.onload = function(e) {
				if (xhr.status == 200) {
					var folders = xhr.response
					folderView.setFolders(folders)
					closeShade = generatePopupTL(moveItemsPopup, shade)
				}
			}

			xhr.send()
		}
	}

	// upload popup events
	uploadInput.onchange = function(e) {
		for (var i = 0; i < uploadInput.files.length; i++) {
			uploadFile(uploadInput.files[i], uploadItemsContainer)
		}
	}

	// create folder popup events
	folderNameInput.onkeyup = sanitizeKeyUp(createFolder)
	createFolderButton.onclick = createFolder

	function createFolder() {
		var folderName = folderNameInput.value

		if (folderName !== "") {
			var xhr = new XMLHttpRequest()

			xhr.open("POST", __path + "/createFolder")
			xhr.setRequestHeader("Content-type", "application/json")

			xhr.onload = function(e) {
				if (xhr.status == 200) {
					setTimeout(function() { folderNameInput.value = "New Folder" }, 1000)
					if (closeShade) { closeShade() }
					reloadFileTable(updateSelection)
				}
			}

			xhr.send(JSON.stringify({ name: folderName, target: getCurrentPath() }))
		}
	}

	// edit popup events
	editButton.onclick = editFile
	filenameInput.onkeyup = sanitizeKeyUp(editFile)

	function editFile() {
		var selected = selectTable.getSelected()
		var filename = filenameInput.value

		if (filename !== "") {
			var xhr = new XMLHttpRequest()

			xhr.open("POST", __path + "/editFile")
			xhr.setRequestHeader("Content-type", "application/json");

			xhr.onload = function(e) {
				if (xhr.status == 200) {
					if (closeShade) { closeShade() }
					reloadFileTable(updateSelection)
				}
			}

			var itemData = selected[0].dataset

			if (itemData.extension) {
				filename = filename + "." + itemData.extension
			}

			xhr.send(JSON.stringify({
				name: filename,
				filePath: itemData.uri
			}))
		}
	}

	// moveItems popup events
	moveButton.onclick = function() {
		if (folderView.selectedFolder) {
			var selected = selectTable.getSelected()
			var files = []

			for (var i = 0; i < selected.length; i++) {
				files.push(selected[i].dataset.uri)
			}

			var xhr = new XMLHttpRequest()

			xhr.open("POST", __path + "/moveFiles")
			xhr.setRequestHeader("Content-type", "application/json");

			xhr.onload = function(e) {
				if (xhr.status == 200) {
					if (closeShade) { closeShade() }
					reloadFileTable(updateSelection)
				}
			}

			xhr.send(JSON.stringify({
				files: files,
				target: folderView.selectedFolder.path,
				keepOriginal: keepOriginalInput.checked
			}))
		}
	}

	// delete popup events
	deleteButton.onclick = deleteFiles

	function deleteFiles() {
		var selected = selectTable.getSelected()
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
				reloadFileTable(updateSelection)
			}
		}

		xhr.send(JSON.stringify({ files: deleteFiles }))
	}

	// file selection
	function updateSelection(selected) {
		var selected = selectTable.getSelected()

		if (selected.length == 0) {
			addClass(editPopupButton, "disabled")
			addClass(moveItemsPopupButton, "disabled")
			addClass(deletePopupButton, "disabled")
		}
		if (selected.length >= 1) {
			removeClass(editPopupButton, "disabled")
			removeClass(moveItemsPopupButton, "disabled")
			removeClass(deletePopupButton, "disabled")
		}
		if (selected.length > 1) {
			addClass(editPopupButton, "disabled")
		}
	}

	var selectTable = new SelectTable({
		id: "fileTable",
		updateSelection: updateSelection,
	})
})