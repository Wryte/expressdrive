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
	var createFolderButton = document.getElementById("createFolderPopupButton")
	var createFolderPopup = document.getElementById("createFolderPopup")
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

	folderNameInput.onkeyup = function(e) { if (e.keyCode == 13) { createFolder() } }
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

	// file selection
	bindOn("click", ".select-td", function(e) {
		var icon = this.querySelector(".fa")

		if (this.dataset.selected) {
			icon.className = "fa fa-circle-o fa-fw"
			TweenMax.to(icon, 0.2, { color: "#333", rotation: 0 })
			delete this.dataset.selected
		} else {
			icon.className = "fa fa-check-circle-o fa-fw"
			TweenMax.to(icon, 0.2, { color: "#75B37A", rotation: 360 })
			this.dataset.selected = true
		}

	})
})