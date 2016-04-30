module.exports = function(app, redisClient, mongoose, passport, callback) {
    var Server = require("../game/server");
    var argv = require('optimist').argv;
    var roomServer = new Server(argv.room, app, redisClient);
    roomServer.start(callback);
};
