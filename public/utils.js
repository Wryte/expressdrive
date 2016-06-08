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

function templateGetNode(name, props, parent) {
	var div = document.createElement(parent || "div")
	div.innerHTML = __templates[name + "Template"](props)
	return div.firstChild
}

function toMB(size) {
	return (Math.floor(size / (1024 * 1024) * 10) / 10) + "MB"
}