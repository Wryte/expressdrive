# ExpressDrive

## Installation

```
npm install expressdrive
```

## Usage

``` javascript
var express = require("express");
var ExpressDrive = require("expressdrive");
var app = express();
var expressDrive = new ExpressDrive(app);
```

## Configuration

Configuration for ExpressDrive is in a file called `expressdrive.config.json` in your project's root folder

```json
{
   "path": "/files",
   "adminUserName": "admin",
   "adminPassword": "test",
   "secret": "somethingsecret", 
   "logo": "/path/to/logo.png",
   "primaryColor": { "h": "(0-360)", "s": "(0-100)", "l": "(0-100)" }
}
```
The `secret` is used to generate file names and password hashing on the server. Change it for every instance you have of ExpressDrive