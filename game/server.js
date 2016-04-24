var _ = require('underscore'),
    Room = require('./room.js');

function Server(roomName, app, resisClient) {
    console.log("Server", roomName);
    this.resisClient = resisClient;
    this.app = app;
    this.expressWs = require('express-ws')(app);
    this.room = new Room(roomName);
}

Server.prototype.start = function(callback) {
    this.room.load(function(err) {
        if( err ) {
            throw err;
        }
        console.log("init server", this.room.id);

        this.resisClient.subscribe('ch_rooms_update');

        this.resisClient.on('message', function(channel, message){
            var _msg = JSON.parse(message);
            if( channel === 'ch_rooms_update' && _msg.id === this.room.id ) {
                this.room.updateInfo(_msg);
            }
        }.bind(this));

        this.app.ws('/rooms/' + this.room.id, function(clientWs, req) {
            if( !req.isAuthenticated() ) {
                clientWs.close();
                return;
            }

            var client = this.room.addClient(clientWs, req.user);

            client.fillRoom();

            clientWs.on('message', client.message);
            clientWs.on('close', this.room.removeClient.bind(this.room, client));

        }.bind(this));

        return callback(null);
    }.bind(this));
};

module.exports = Server;