var Handlebars = require("handlebars")
var fs = require("fs")

// set up templates
var templates = {}
function loadTemplates(callback) {
	fs.readdir(__dirname + "/views", (err, files) => {
		var fileCount = 0
		files.forEach((file, i) => {
			var templateName = file.split(".")[0]
			fs.readFile(__dirname + "/views/"+file, "utf8", (err, data) => {
				templates[templateName] = Handlebars.compile(data)

				Handlebars.unregisterPartial(templateName)
				Handlebars.registerPartial(templateName, data)

				fileCount++
				if (fileCount == files.length && callback) {
					callback()
				}
			})
		})
	})
}

Handlebars.registerHelper('ifCond', function (v1, operator, v2, options) {
	switch (operator) {
		case '==':
			return (v1 == v2) ? options.fn(this) : options.inverse(this);
		case '===':
			return (v1 === v2) ? options.fn(this) : options.inverse(this);
		case '<':
			return (v1 < v2) ? options.fn(this) : options.inverse(this);
		case '<=':
			return (v1 <= v2) ? options.fn(this) : options.inverse(this);
		case '>':
			return (v1 > v2) ? options.fn(this) : options.inverse(this);
		case '>=':
			return (v1 >= v2) ? options.fn(this) : options.inverse(this);
		case '&&':
			return (v1 && v2) ? options.fn(this) : options.inverse(this);
		case '||':
			return (v1 || v2) ? options.fn(this) : options.inverse(this);
		default:
			return options.inverse(this);
	}
});

module.exports = {loadTemplates,templates}