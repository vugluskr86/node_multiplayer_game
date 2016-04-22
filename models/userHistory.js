var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

var userHistory = mongoose.Schema({
    room: {type: mongoose.Schema.Types.ObjectId, ref: 'Room'},
    user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},

    mob: {},
    balanceAbs : {type: Number},
    balanceDelta : {type: Number}
});

module.exports = mongoose.model('UserHistory', userHistory);