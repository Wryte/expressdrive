document.addEventListener("DOMContentLoaded", function() {
	__templates = {}
	var templateScripts = document.querySelectorAll("script[type='text/x-handlebars-template']")

	templateScripts.forEach(function(template) {
		__templates[template.id] = Handlebars.compile(template.innerHTML.trim())
	})
})

function getNode(name, props, parent) {
	var div = document.createElement(parent || "div")
	div.innerHTML = __templates[name + "Template"](props)
	return div.firstChild
}

function toMB(size) {
	return (Math.floor(size / (1024 * 1024) * 10) / 10) + "MB"
}