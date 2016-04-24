var _ = require('underscore');
var RoomModel = require('../models/room');
var async = require('async');

var Mob = require('./mob.js');
var Client = require("./client.js");

const COLOR_skySample = [
    '#b3cae5', '#dbdde4', '#e4e3e4', '#f7ddbb', '#efcab2',
    '#bccacc', '#c7d8d6', '#d9ebe0', '#ebf9e3', '#f4f8d0',
    '#5e7fb1', '#dce8f7', '#eff1f4', '#fce1a8', '#f7ec86',
    '#8fb8ee', '#cbe2f4', '#dbe5eb', '#f9d3b8', '#e0b2a3',
    '#a2e0f9', '#cef5fc', '#eafaeb', '#fefcd3', '#fdf4ba',
    '#6bafd2', '#a4c8dc', '#d6cbca', '#eabc96', '#db8876',
    '#b4ced8', '#d7e5d4', '#e2e8c9', '#f1e5b9', '#edd7ac',
    '#29153e', '#657489', '#bfb6aa', '#ead79d', '#f2ebda',
    '#20202f', '#273550', '#416081', '#adacb2', '#eac3a2',
    '#555351', '#555351', '#8d7b6c', '#cc9d7a', '#fff9aa',
    '#171c33', '#525f83', '#848896', '#bb9d78', '#f6e183',
    '#ffe3c8', '#efad9e', '#c79797', '#a78a92', '#857d8d',
    '#6f749e', '#9a8daf', '#d0a8b9', '#f8bbb1', '#fde6b1',
    '#536a97', '#8087ad', '#bca391', '#bd968a', '#a38b8a',
    '#325176', '#7b9ea7', '#9baf93', '#dbaf81', '#fbdf73',
    '#727288', '#8e889b', '#d3c2bd', '#f9d89a', '#f8c785',
    '#506e90', '#7695aa', '#a7bdb8', '#e2e2b8', '#fdf998',
    '#634b5f', '#868080', '#b7b29b', '#dfd6a4', '#e9f3a2',
    '#7e74b2', '#b3a2c2', '#e2cdbe', '#f6cf97', '#f4a77a',
    '#34a4ca', '#59d7dd', '#a8f2f0', '#d0f8ef', '#d6f6e1',
    '#7696cd', '#8fb2e4', '#b0cff0', '#d7e5ec', '#dee0e7',
    '#8dd6c3', '#c5e5e2', '#eafaeb', '#f9f7ca', '#fceea1',
    '#4e72c7', '#6d9ed7', '#a4c8d5', '#b4d9e1', '#c4d9d6',
    '#47565f', '#5b625a', '#947461', '#f98056', '#f7ec86',
    '#95b3bf', '#c6cdd3', '#e5d8d9', '#f1e1d9', '#f3e1cd',
    '#4c86ab', '#95a5bc', '#bfcdc9', '#dcd6c9', '#edd9c7',
    '#0f124a', '#1b2360', '#515b80', '#758391', '#e5e3b0',
    '#889db6', '#a5b8ce', '#c1cfdd', '#dee1e4', '#d5d1cf',
    '#74bddb', '#a8d1eb', '#cddbf5', '#e4e6fb', '#f6f4f8',
    '#a7d3cb', '#bcc1c4', '#e5cab3', '#fee6c5', '#fdecd0',
    '#325571', '#8e9fa4', '#decab2', '#f2d580', '#ffa642',
    '#c5d4d7', '#d6b98d', '#c99262', '#8c5962', '#43577e'
];

const COLOR_rainbow = [
    "#fbb735", "#e98931", "#eb403b", "#b32E37", "#6c2a6a",
    "#5c4399", "#274389", "#1f5ea8", "#227FB0", "#2ab0c5",
    "#39c0b3"
];

const COLOR_pastel = [
    "#ffcccc", "#ffe0cc", "#ffeacc", "#fff4cc", "#fffecc",
    "#effac8", "#c7f5c4", "#c4f0f4", "#c4daf4", "#c9c4f4",
    "#e1c4f4", "#f6c6e6"];



function RoomMobs(id) {
    this.id   = id;

    this.mobs = [];
    this.mobsOptions = [];

    this.mobIdx = 0;
}

RoomMobs.prototype.spawnMobs = function(x,y,angle,options) {
    this.mobIdx++;

    var _mob = _.clone(options);
    _.extend(_mob, { id : this.mobIdx });

    var mob = new Mob(this.mobIdx, _mob, this.mobIdx);

    mob.x = x;
    mob.y = y;
    mob.angle = angle;

    this.mobsOptions.push(_mob);
    this.mobs.push(mob);

    mob.update(1/60);

    return {
        options : _mob,
        data : mob
    };
};

RoomMobs.prototype.removeMob = function(id) {
    var mob_idx = _.findIndex(this.mobs, { id : id });
    if( mob_idx !== -1 ) {
        var mob = this.mobs[mob_idx];
        this.mobs.splice(mob_idx, 1);
        var opt_idx = _.findIndex(this.mobsOptions, { id : mob.optionId });
        if( opt_idx !== -1 ) {
            this.mobsOptions.splice(opt_idx, 1);

            return true;
        }
    }

    return false;
};

RoomMobs.prototype.findMob = function(id) {
    var mob_idx = _.findIndex(this.mobs, { id : id });
    if( mob_idx !== -1 ) {
        var mob = this.mobs[mob_idx];
        var opt_idx = _.findIndex(this.mobsOptions, { id : mob.optionId });
        if( opt_idx !== -1 ) {
            return this.mobsOptions[opt_idx];
        }
    }
};



function Room(id) {
    this.id = id;
    this.mobs = new RoomMobs(id);

    this.clients = [];
    this.clientIdx = 0;

    this.timer = 0;
}

Room.prototype.addClient = function(ws, user) {
    var client = new Client(this.clientIdx, ws, user, this);

    this.clients.push( client );
    this.clientIdx++;

    return client;
};

Room.prototype.removeClient = function(player) {
    var index = this.clients.indexOf(player);
    if( index != -1 ) {
        this.clients.splice(index, 1);
        player.disconnect();
    }
};

Room.prototype.getClient = function(id) {
    var index =  _.findIndex(this.clients, { id : id });
    if( index !== -1 ) {
        return this.clients[index];
    }
};

Room.prototype.load = function(callback) {
    return RoomModel.findOne({ _id : this.id }).exec(function(err, room) {
        if( err ) {
            return callback(err);
        }

        if( !room ) {
            return callback("undefinedRoom");
        }

        this.roomData = room;
        this.roomData.mobs = 0;
        // this.roomData.percent_profit
        // this.roomData.percent_null
        // this.roomData.percent_minus

        this.randSeq = [];

        for(var i = 0; i < this.roomData.percent_profit; i++) {
            this.randSeq.push(1);
        }
        for(var j = 0; j < this.roomData.percent_null; j++) {
            this.randSeq.push(0);
        }
        for(var q = 0; q < this.roomData.percent_minus; q++) {
            this.randSeq.push(-1);
        }

        // console.log(this.randSeq.length)


        this.roomData.save(function(err){
            if( err ) {
                return callback(err);
            }

            this.roomInterval = setInterval(this.update.bind(this, 1000 / 60), 1000 / 60);
            this.spawnInterval = setInterval(this.workSpawn.bind(this), this.roomData.spawnSpeed * 1000);

            return callback(null);
        }.bind(this));

    }.bind(this));
};

Room.prototype.workSpawn = function() {
    if( this.roomData.maxMobs > this.roomData.mobs ) {

        if( this.spawnInterval ) {
            clearInterval( this.spawnInterval );
            this.spawnInterval = null;
        }

        this.roomData.mobs += 1;
        this.roomData.save(function(err) {
            if(err) {
                console.log("Error save room");
            }

            var mob = this.spawnMob();

            this.broadcast(JSON.stringify({
                id : "spawnMob",
                data : mob
            }));

            if(!err && !this.spawnInterval) {
                this.spawnInterval = setInterval(this.workSpawn.bind(this), this.roomData.spawnSpeed * 1000);
            }
        }.bind(this));

    }
};

Room.prototype.updateInfo = function(room) {
    Object.keys(room).forEach(function(propKey) {
        if( propKey !== 'id' ) {
            this.roomData[propKey] = room[propKey];
        }
    }.bind(this));

    this.broadcast(JSON.stringify({
        id : "updateRoomData",
        data : this.roomData
    }));
};

Room.prototype.update = function(dt) {

    for(var mIndex = 0; mIndex < this.mobs.mobs.length; mIndex++) {
        var mob = this.mobs.mobs[mIndex];
        mob.update(dt);
    }
    for(var cIndex = 0; cIndex < this.clients.length; cIndex++) {
        var client = this.clients[cIndex];
        if( client.ws.readyState == 1) {
            client.updateMobsData();
        }
    }
};

Room.prototype.broadcast = function(message) {
    for(var i = 0; i < this.clients.length; i++) {
        var client = this.clients[i];
        if( client.ws.readyState == 1) {
            client.send(message)
        }
    }
};

Room.prototype.spawnMob = function() {

    var _rand = _.random(0, 99),
        _profitMode = this.randSeq[_rand];

    var _h = _.random(5, 500),
        type = _.random(0, 1) > 0.2 ? "box" : "circle",
        radius = _.random(10, 200),
        _x = _.random(0.51, 0.53),
        _cost =  parseInt(_.random(5, 500)),
        _profit = parseInt(_.random(1, 100)) * _profitMode,
        view = {};

    if(type === "box") {
        view = {
            type : "box",
            width  : _h * _x,
            height : _h * (1 - _x),
            fill : COLOR_skySample[_.random(0, COLOR_skySample.length - 1)],
            strokeStyle : _.random(1, 10),
            stroke : COLOR_rainbow[_.random(0, COLOR_rainbow.length - 1)]
        };
    } else {
        view = {
            type : "circle",
            radius : radius,
            fill : COLOR_skySample[_.random(0, COLOR_skySample.length - 1)],
            strokeStyle : _.random(1, 10),
            stroke : COLOR_rainbow[_.random(0, COLOR_rainbow.length - 1)]
        };
    }

    return this.mobs.spawnMobs(_.random(-500, 500), _.random(-500, 500), _.random(0, 2 * Math.PI), {
        text : _cost + "/" + _profit,
        prototype : {
            cost : _cost,
            profit : _profit,
            view : view
        }
    });
};

module.exports = Room;