var mongoose = require('../utils/mongoose');
var bcrypt   = require('bcrypt-nodejs');
var mongoosePaginate = require('mongoose-paginate');

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

    , created    : { type: Date }
    , updated    : { type: Date }
});

roomSchema.pre('save', function(next){
    var now = new Date();
    this.updated = now;
    if ( !this.created ) {
        this.created = now;
    }
    next();
});

roomSchema.statics.join = function(options, callback) {
    var model = mongoose.model('Room'),
        room_condition = { _id : options.roomid, players : { $nin : [ options.userid ] } },
        room_update = { $push : { players : options.userid } };

    model.update(room_condition, room_update).exec(callback);
};

roomSchema.statics.leave = function(options, callback) {
    var model = mongoose.model('Room'),
        room_condition = { _id : options.roomid, players : { $in : [ options.userid ] } },
        room_update = { $pull : { players : options.userid } };

    model.update(room_condition, room_update).exec(callback);
};

roomSchema.plugin(mongoosePaginate);


module.exports = mongoose.model('Room', roomSchema);