var express = require("express");
var ExpressDrive = require("./index");
var app = express();
var expressDrive = new ExpressDrive(app);

app.get("/", function (req, res) {
	res.send("Hello World!");
});

app.listen(3000, function () {
	console.log("Example app listening on port 3000!");
});