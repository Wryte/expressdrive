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

function addClass(el, classString) {
	var splitClass = el.className.split(" ")

	for (var i = 0; i < splitClass.length; i++) {
		if (splitClass[i] == classString) {
			return
		}
	}

	splitClass.push(classString)
	el.className = splitClass.join(" ")
}

function removeClass(el, classString) {
	var splitClass = el.className.split(" ")

	for (var i = 0; i < splitClass.length; i++) {
		if (splitClass[i] == classString) {
			splitClass.splice(i, 1)
			el.className = splitClass.join(" ")
			return
		}
	}
}

function hasClass(el, classString) {
	return (" " + el.className + " ").replace(/[\t\r\n\f]/g, " ").indexOf(" " + classString + " ") > -1
}