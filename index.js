var defaultConfig = require("./default.config")
var config = {}
try {
	config = require("./../../expressdrive.config")
} catch (ex) {
    console.warn("expressdrive - no user config")
}

for (var k in defaultConfig) {
	if (config[k] === undefined) {
		config[k] = defaultConfig[k]
	}
}

function ExpressDrive(app) {
	console.log("got the app")
}

module.exports = ExpressDrive