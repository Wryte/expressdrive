document.addEventListener("DOMContentLoaded", function() {
	__templates = {}
	var templateScripts = document.querySelectorAll("script[type='text/x-handlebars-template']")

	for (var i = 0; i < templateScripts.length; i++) {
		var template = templateScripts[i]
		__templates[template.id] = Handlebars.compile(template.innerHTML.trim())
	}
})

function getNode(html, parent) {
	var div = document.createElement(parent || "div")
	div.innerHTML = html
	return div.firstChild
}

function getCurrentPath() {
	var path = window.location.pathname
	if (path == __path) { path = path + "/f" }
	path = path.substring(__path.length + "/f".length)
	return path
}

function getCurrentFolder() {
	var pathSplit = decodeURI(getCurrentPath()).split("/")
	var folder = pathSplit[pathSplit.length - 1]

	if (folder == "") {
		folder = "Home"
	}

	return folder
}

function setFolderName() {
	var folderName = getCurrentFolder()
	var spans = document.querySelectorAll(".folder-name")
	for (var i = 0; i < spans.length; i++) {
		spans[i].innerText = folderName
	}
}

function getSearchObj() {
	var search = {}
	var searchString = window.location.search

	if (searchString !== "") {
		searchString = searchString.substring(1) // remove the ?
		var searchArray = searchString.split("&")
		for (var i = 0; i < searchArray.length; i++) {
			var itemSplit = searchArray[i].split("=")
			search[itemSplit[0]] = itemSplit[1]
		}
	}

	return search
}

function templateGetNode(name, props, parent) {
	var div = document.createElement(parent || "div")
	div.innerHTML = __templates[name + "Template"](props)
	return div.firstChild
}

function toMB(size) {
	return (Math.floor(size / (1024 * 1024) * 10) / 10) + "MB"
}

if (!Element.prototype.matches)
{
	var ep = Element.prototype;

	if (ep.webkitMatchesSelector) { ep.matches = ep.webkitMatchesSelector; }
	if (ep.msMatchesSelector) { ep.matches = ep.msMatchesSelector; }
	if (ep.mozMatchesSelector) { ep.matches = ep.mozMatchesSelector; }
}

var __binds = { click: [] }
function bindOn(action, selector, func) {
	__binds[action].push({
		selector: selector,
		func: func
	})
}
function unbindOn(action, func) {
	for (var i = 0; i < __binds[action].length; i++) {
		var item = __binds[action][i]
		if (item.func == func) {
			__binds[actoin].splice(i,1)
			return
		}
	}
}

document.addEventListener("click", function(e) {
	for (var i = 0; i < __binds.click.length; i++) {
		var item = __binds.click[i]
		var found
		var el = e.target

		while (el && !(found = el.matches(item.selector))) {
			el = el.parentElement
		}

		if (found) {
			item.func.call(el, e)
		}
	}
})

function addClass(els, classString) {
	if (!Array.isArray(els)) {
		els = [els]
	}

	for (var j = 0; j < els.length; j++) {
		var el = els[j]
		var splitClass = el.className.split(" ")
		var found = false

		for (var i = 0; i < splitClass.length; i++) {
			if (splitClass[i] == classString) {
				found = true
				break
			}
		}

		if (!found) {
			splitClass.push(classString)
			el.className = splitClass.join(" ")
		}
	}

}

function removeClass(els, classString) {
	if (!Array.isArray(els)) {
		els = [els]
	}

	for (var j = 0; j < els.length; j++) {
		var el = els[j]
		var splitClass = el.className.split(" ")

		for (var i = 0; i < splitClass.length; i++) {
			if (splitClass[i] == classString) {
				splitClass.splice(i, 1)
				el.className = splitClass.join(" ")
				break
			}
		}
	}
}

function hasClass(el, classString) {
	return (" " + el.className + " ").replace(/[\t\r\n\f]/g, " ").indexOf(" " + classString + " ") > -1
}

function sanitizeFileName(name) {
	return name.replace(/[^.a-zA-Z0-9 _-]/g, "")
}

function sanitizeKeyUp(enterFunc) {
	return function(e) {
		if (e.keyCode == 13 && enterFunc) { enterFunc() }
		var sanitizedName = sanitizeFileName(this.value)
		if (this.value !== sanitizedName) {
			this.value = sanitizeFileName(this.value)
		}
	}
}

function uploadFile(file, uploadItemsContainer) {
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

function generatePopupTL(popup, shade) {
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

	return closeShade
}

function reloadFileTable(callback) {
	var fileTableContainer = document.getElementById("fileTableContainer")
	var xhr = new XMLHttpRequest()
	xhr.open("GET", __path + "/fileTable" + getCurrentPath())

	xhr.onload = function(data) {
		if (xhr.status == 200) {
			fileTableContainer.innerHTML = xhr.responseText
			if (callback) { callback() }
		}
	}

	xhr.send()
}