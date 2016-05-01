var _ = require('underscore');
var RoomModel = require('../models/room');
var UserHistoryModel = require('../models/userHistory');
var async = require('async'),
    log4js = require('../utils/log'),
    log = log4js.getLogger();

function Client(ws, user, room) {
    this.ws = ws;
    this.room = room;
    this.user = user;
    log.debug("Client connected", this.user._id);
}

Client.prototype.disconnect = function() {
    log.debug("Client disconnected", this.user._id);
};

Client.prototype.message = function(message) {

    if( this.user ) {

        RoomModel.findOne({ _id : this.room.id, players : { $in : [this.user._id] }  }).exec(function(err, room) {

            if(err) {
                this.send(JSON.stringify({
                    id : "error",
                    message : "NotInRoom"
                }));
                return;
            }

            if(!room) {
                this.send(JSON.stringify({
                    id : "error",
                    message : "NotInRoom"
                }));
                return;
            }

            var packet = JSON.parse(message);

            log.debug(packet);

            if( packet && packet.action ) {
                switch (packet.action) {
                    case "clickMob": {

                        if( packet.id === undefined ) {
                            this.send(JSON.stringify({
                                id : "error",
                                message : "UndefinedMobId"
                            }));
                            return;
                        }

                        // получаем моба
                        var mobObject = this.room.findMob(packet.id);

                        if( mobObject === undefined ) {
                            this.send(JSON.stringify({
                                id : "error",
                                message : "UndefinedMob"
                            }));
                            return;
                        }

                        var mob = mobObject.toJSON();

                        // проверяем наличие денег
                        if( this.user.balance < mob.prototype.cost ) {
                            this.send(JSON.stringify({
                                id : "error",
                                message : "NotMoney"
                            }));
                            return;
                        }

                        if( this.room.removeMob(mob) !== -1 ) {

                            RoomModel.update(
                                { _id : this.room.id },
                                { $pull : { mobs : mob } },
                                { safe: true }
                            ).exec(function(err, result) {

                                if( err ) {
                                    this.send(JSON.stringify({
                                        id : "error",
                                        message : "UndefinedMob"
                                    }));
                                    return;
                                }

                                log.debug({ id : "removeMob", data : packet.id });

                                this.room.broadcast(JSON.stringify({ id : "removeMob", data : packet.id }));

                                // производим расчеты с балансом
                                this.user.balance += parseInt(mob.prototype.cost / 100 * mob.prototype.profit);

                                var history = new UserHistoryModel();
                                history.user = this.user._id;
                                history.room = this.user.currentRoom;
                                history.mob = mob;

                                // сохраниение пользователя и истории
                                async.parallel([
                                    function(next) {
                                        this.user.save(next)
                                    }.bind(this),
                                    function(next) {
                                        history.save(next)
                                    }.bind(this)
                                ], function(err, result) {
                                    if( err ) {
                                        this.send(JSON.stringify({
                                            id : "error",
                                            message : "BalanceChangedError"
                                        }));
                                        return;
                                    }
                                    this.send(JSON.stringify({
                                        id : "UserBalanceUpdated",
                                        message : this.user.balance
                                    }));
                                }.bind(this));



                            }.bind(this));
                        } else {
                            this.send(JSON.stringify({
                                id : "error",
                                message : "RemoveMobError"
                            }));
                            return;
                        }
                        break;
                    }
                }
            }
        }.bind(this));

    } else {
        log.debug("Not In room")
        this.send(JSON.stringify({
            id : "error",
            message : "NotInRoom"
        }));
    }
};

Client.prototype.send = function(data, options) {
    this.ws.send(data, options);
};

Client.prototype.sendBinary = function(data) {
    this.ws.send(data, { binary: true, mask: false });
};

Client.prototype.fillRoom = function() {
    this.send(JSON.stringify({
        id : "fillRoom",
        data : this.room.mobs
    }), { mask : false });
};


module.exports = Client;