var _ = require('underscore'),
    Room = require('./room.js'),
    Client = require('./client.js'),
    log4js = require('../utils/log'),
    log = log4js.getLogger();

var RoomModel = require('../models/room');

function Server(roomId, app, resisClient) {
    log.debug("Server", roomId);

    this.roomId = roomId;

    this.resisClient = resisClient;
    this.app = app;
    this.expressWs = require('express-ws')(this.app);

    this.started = false;

    this._handleWsConnect = function(clientWs, req) {
        if( !this.started ) {
            clientWs.close();
            return;
        }

        if( !req.isAuthenticated() ) {
            clientWs.close();
            return;
        }

        log.debug("_handleWsConnect", req.user._id);

        var client = this.room.addClient(clientWs, req.user);

        client.fillRoom();

        clientWs.on('message', client.message.bind(client));
        clientWs.on('close', this.room.removeClient.bind(this.room, client));
    };

    this._handleInternalUpdates = function(channel, message) {
        var _msg = JSON.parse(message);

        if( this.started && channel === 'ch_rooms_update' && _msg.id.toString() === this.room.id.toString() ) {

            log.debug("updated");

            return RoomModel.findOne({ _id : this.room.id }).exec(function(err, room) {
                if( err ) {
                    log.error(err);
                }

                if( !room ) {
                    log.error("Undefined room");
                }

                this.room.updateOptions(room);
                this.room.broadcast(JSON.stringify({
                    id : "updateRoom"
                }));
            }.bind(this));

        }
    };

    this.run = function() {
        this.started = true;
        this.spawnInterval = setInterval(this.workSpawn.bind(this), this.room.getSpawnTimeout());
    };

    this.workSpawn = function() {
        if( this.room.checkSpawnCondition() ) {
            clearInterval(this.spawnInterval);
            this.spawnInterval = null;

            var randomMobOptions = this.room.getRandomMobOptions();

            _.extend(randomMobOptions, {
                id : this.room.options.mobsCounterIndex
            });

            log.debug("workSpawn randomMobOptions", randomMobOptions);

            this.room.options.mobsCounterIndex++;
            this.room.options.mobs.push(randomMobOptions);
            this.room.options.save(function(err) {
                if(err) {
                    log.debug("Error save room");
                }

                this.room.addMob(randomMobOptions);

                this.room.broadcast(JSON.stringify({
                    id : "spawnMob",
                    data : randomMobOptions
                }));

                this.spawnInterval = setInterval(this.workSpawn.bind(this), this.room.getSpawnTimeout());
            }.bind(this));
        }
    };
}


Server.prototype.start = function(callback) {
    this.resisClient.subscribe('ch_rooms_update');
    this.resisClient.on('message',this._handleInternalUpdates.bind(this));

    return RoomModel.findOne(this.roomId).exec(function(err, room) {
        if( err ) {
           log.error(err);
        }

        if( !room ) {
            log.error("Undefined room");
        }

        this.room = new Room(room);
        this.room.addMobs(room.mobs);

        this.app.ws('/rooms/' + this.room.id, this._handleWsConnect.bind(this));

        this.run();

        return callback(null);
    }.bind(this));
};

module.exports = Server;