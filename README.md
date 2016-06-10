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
   "adminPassword": "test"
}
```