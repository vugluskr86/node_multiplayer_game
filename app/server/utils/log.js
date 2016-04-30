var log4js = require('log4js'),
    argv = require('optimist').argv,
    path = require('path');

var config = {
    "appenders": [
        {
            "type": "file",
            "maxLogSize": 20480,
            "backups": 3,
            "filename": path.resolve("logs/", argv["service"] + ".log")
        }
    ]
};

log4js.configure(config);

module.exports = log4js;

