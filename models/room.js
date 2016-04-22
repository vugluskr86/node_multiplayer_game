var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

var roomSchema = mongoose.Schema({

    name :  {type: String, default : 'Room'},
    complexity :  {type: String, default : 'simple'},

    maxUsers : {type: Number, default : 10000},
    maxMobs : {type: Number, default : 50},

    spawnSpeed : {type: Number, default : 0.4},

    percent_profit : {type: Number, default : 30},
    percent_null : {type: Number, default : 20},
    percent_minus : {type: Number, default : 50},

    mobs : {type: Number, default : 0},
    players: { type : Array, default : []},

    // информация процесса
    state : { type: String, default : "stop" },
    pid : { type: Number },
    port : { type: Number }
});

module.exports = mongoose.model('Room', roomSchema);