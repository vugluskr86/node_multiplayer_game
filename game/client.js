var _ = require('underscore');
var RoomModel = require('../models/room');
var async = require('async');

function Client(id, ws, user, room) {
    this.id = id;
    this.ws = ws;
    this.room = room;
    this.user = user;
    console.log("Client connected", id);
}

Client.prototype.disconnect = function() {
    console.log("Client disconnected", this.id);
};

Client.prototype.message = function(message) {
    if( this.user.currentRoom && this.user.currentRoom.toString() === this.room.id.toString() ) {
        var packet = JSON.parse(message);
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
                    var mob = this.room.mobs.findMob(packet.id);
                    if( mob == undefined ) {
                        this.send(JSON.stringify({
                            id : "error",
                            message : "UndefinedMob"
                        }));
                        return;
                    }

                    // проверяем наличие денег
                    if( this.user.balance < mob.prototype.cost ) {
                        this.send(JSON.stringify({
                            id : "error",
                            message : "NotMoney"
                        }));
                        return;
                    }

                    // удаляем моба
                    this.room.mobs.removeMob(packet.id);
                    this.room.broadcast(JSON.stringify({ id : "removeMob", data : packet.id }));

                    // производим расчеты с балансом
                    var moneyProfit = parseInt(mob.prototype.cost / 100 * mob.prototype.profit);
                    this.user.balance += moneyProfit;

                    // изменяем кол-во мобов на сервере

                    async.parallel([
                        function(next) {
                            RoomModel.update({ _id : this.room.id }, { $inc : { mobs : -1 } }).exec(next);
                        }.bind(this),
                        function(next) {
                            this.user.save(next)
                        }.bind(this)
                    ], function(err, result) {
                        if( err ) {
                            this.send(JSON.stringify({
                                id : "error",
                                message : "BalanceChangedError"
                            }));
                            return;
                        }

                        if( this.room.roomData ) {
                            this.room.roomData.mobs -= 1;
                        }

                        this.send(JSON.stringify({
                            id : "UserBalanceUpdated",
                            message : this.user.balance
                        }));
                    }.bind(this));
                    break;
                }
            }
        }
    } else {
        console.log("Not In room")
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
        data : {
            options : this.room.mobs.mobsOptions,
            data : this.room.mobs.mobs
        }
    }), { mask : false });
};

Client.prototype.updateMobsData = function() {
    this.send(JSON.stringify({
        id : "updateMobsData",
        data : this.room.mobs.mobs
    }), { mask : false });
};

module.exports = Client;