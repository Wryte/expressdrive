document.addEventListener("DOMContentLoaded", function() {
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
	var editExtensionSpan = document.getElementById("editExtensionSpan")
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
				reloadFileTable()
			}
		}

		xhr.send(JSON.stringify({ files: deleteFiles }))
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
					reloadFileTable()
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

	// file selection
	function updateSelection(selected) {
		var selected = selectTable.getSelected()

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
	}

	var selectTable = new SelectTable({
		id: "fileTable",
		updateSelection: updateSelection,
	})
})