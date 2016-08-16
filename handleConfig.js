var sass = require('node-sass')
var _ = require("underscore")
var fs = require("fs")
var appRoot = require("app-root-path")

// load up config
var defaultConfig = require("./default.config")
var config = {}

try {
	config = require(appRoot + "/expressdrive.config")
} catch (ex) {
    console.warn("expressdrive - no user config")
}

for (var k in defaultConfig) {
	if (config[k] === undefined) {
		config[k] = defaultConfig[k]
	}
}

var branding = {
	titlePrefix: config.titlePrefix,
	companyName: config.companyName,
	logo: config.logo
}

var sassGenerator = {
	sassVariables, sassImport
}

var sassOptionsDefaults = {
  // includePaths: [
  //   'some/include/path'
  // ],
  outputStyle:  'compressed'
};

function dynamicSass(scssEntry, variables, handleSuccess, handleError) {
	var dataString =
		sassGenerator.sassVariables(variables) +
		sassGenerator.sassImport(scssEntry);
	var sassOptions = _.assign({}, sassOptionsDefaults, {
		data: dataString
	});

	sass.render(sassOptions, function (err, result) {
		return (err)
			? handleError(err)
			: handleSuccess(result.css.toString());
	});
}

dynamicSass(appRoot + "/preprocessed/style.scss", {
	primaryColor: "hsl("+config.primaryColor.h+","+config.primaryColor.s+"%,"+config.primaryColor.l+"%)",
	primaryColorBright: "hsl("+config.primaryColor.h+","+config.primaryColor.s+"%,"+(config.primaryColor.l + 30)+"%)",
	primaryColorDark: "hsl("+config.primaryColor.h+","+config.primaryColor.s+"%,"+(config.primaryColor.l - 5)+"%)"
}, function(data) {
	fs.writeFile(appRoot + "/public/processed/output.css", data)
}, function(e) {
	console.log("sass error - ", e)
});

function sassVariable(name, value) {
	return "$" + name + ": " + value + ";";
}

function sassVariables(variablesObj) {
	return Object.keys(variablesObj).map(function (name) {
		return sassVariable(name, variablesObj[name]);
	}).join('\n')
}

function sassImport(path) {
	return "@import '" + path + "';";
}

module.exports = { config, branding }