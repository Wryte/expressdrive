document.addEventListener("DOMContentLoaded", function() {
	// dynamic loading of the file table
	var fileTableContainer = document.getElementById("fileTableContainer")

	function reloadFileTable() {
		var xhr = new XMLHttpRequest()
		xhr.open("GET", __path + "/fileTable" + getCurrentPath())

		xhr.onload = function(data) {
			if (xhr.status == 200) {
				fileTableContainer.innerHTML = xhr.responseText
			}
		}

		xhr.send()
	}

	// setup popups
	var shade = document.getElementById("shade")

	var uploadButton = document.getElementById("uploadButton")
	var uploadPopup = document.getElementById("uploadPopup")

	var createFolderPopupButton = document.getElementById("createFolderPopupButton")
	var createFolderPopup = document.getElementById("createFolderPopup")

	var editPopupButton = document.getElementById("editPopupButton")

	var deletePopupButton = document.getElementById("deletePopupButton")
	var deletePopup = document.getElementById("deletePopup")

	var closeShade

	function generatePopupTl(popup) {
		var tl = new TimelineMax({
			onStart: function() {
				shade.style.display = "flex"
				popup.style.display = "block"
			},
			onReverseComplete: function() {
				shade.style.display = "none"
				popup.style.display = "none"
				shade.removeEventListener("click", closeShade)
				tl.clear()
			}
		})

		closeShade = function(e) {
			if (e == undefined || (e.target.dataset.closePopup && tl.progress() == 1)) {
				tl.reverse()
				closeShade = undefined
			}
		}

		tl.fromTo(shade, 0.2, { opacity: 0 }, { opacity: 1 })
		tl.fromTo(popup, 0.35, { opacity: 0, y: -75 }, { opacity: 1, y: 0 })

		shade.addEventListener("click", closeShade)
	}

	uploadButton.onclick = function() {
		generatePopupTl(uploadPopup)
	}
	createFolderPopupButton.onclick = function() {
		generatePopupTl(createFolderPopup)
	}
	deletePopupButton.onclick = function() {
		var selected = getSelected()
		if (selected.length > 0) {
			document.getElementById("deleteHeaderSpan").innerText = selected.length + " item" + (selected.length > 1 ? "s" : "")
			document.getElementById("deleteBodySpan").innerText = selected.length > 1 ? "these items" : "this item"
			generatePopupTl(deletePopup)
		}
	}

	// upload popup
	var	uploadInput = document.getElementById("uploadInput")
	var	uploadItemsContainer = document.getElementById("uploadItemsContainer")

	function uploadFile(file) {
		var item = templateGetNode("uploadItem", { name: file.name, size: toMB(file.size) })
		var bar = item.querySelector(".bar")
		var progress = item.querySelector(".progress")
		var check = item.querySelector(".complete")

		uploadItemsContainer.insertBefore(item, uploadItemsContainer.firstChild)
		TweenMax.from(item, 0.2, { opacity: 0, height: 0 })

		var formData = new FormData()
		formData.append('file', file, file.name)

		var xhr = new XMLHttpRequest()
		xhr.open('POST', __path + "/upload?target="+getCurrentPath(), true)

		xhr.upload.addEventListener("progress", function(e) {
			if (e.lengthComputable) {
				TweenMax.to(bar, 0.2, { width: (e.loaded / e.total * 100) + "%" })
			}
		})

		xhr.onload = function () {
			if (xhr.status === 200) {
				var tl = new TimelineMax()
				tl.to(progress, 0.2, { opacity: 0, delay: 0.5 })
				tl.fromTo(check, 0.2, { opacity: 0, x: -20 }, { opacity: 1, x: 0 })
				reloadFileTable()
			} else {
				alert('An error occurred!')
			}
		}

		setTimeout(function() { xhr.send(formData) }, 0.2)
	}

	uploadInput.onchange = function(e) {
		for (var i = 0; i < uploadInput.files.length; i++) {
			uploadFile(uploadInput.files[i])
		}
	}

	// create folder popup
	var folderNameInput = document.getElementById("folderNameInput")
	var createFolderButton = document.getElementById("createFolderButton")

	folderNameInput.onkeyup = function(e) {
		if (e.keyCode == 13) { createFolder() }
		this.value = sanitizeFileName(this.value)
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

	// delete popup
	var deleteButton = document.getElementById("deleteButton")
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
			addClass(selectAllIcon, "selected")
			selectOnTL(selectAllIcon)
		} else if (hasClass(selectAllIcon, "selected")) {
			removeClass(selectAllIcon, "selected")
			selectOffTL(selectAllIcon)
		}
	}
})