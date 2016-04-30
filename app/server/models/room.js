var mongoose = require('../utils/mongoose');
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

  //  mobs : {type: Number, default : 0},

    mobs: [ mongoose.Schema.Types.Mixed ],

    players: { type : Array, default : []},

    mobsCounterIndex : {type: Number, default : 0},

    // информация процесса
    state : { type: String, default : "stop" },
    pid : { type: Number },
    port : { type: Number }
}, { timestamps: { createdAt: 'created', updatedAt: 'updated' } });

module.exports = mongoose.model('Room', roomSchema);