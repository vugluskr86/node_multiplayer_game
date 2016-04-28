var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');
var _ = require('underscore');
var mongoosePaginate = require('mongoose-paginate');

var userHistory = mongoose.Schema({
    room: {type: mongoose.Schema.Types.ObjectId, ref: 'Room'},
    user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    mob: {},
    created:    { type: Date, default : Date.now }
});

userHistory.statics.getPage = function(options, pages, callback) {
    return mongoose.model('UserHistory').paginate(options, pages, callback);
};

userHistory.plugin(mongoosePaginate);

module.exports = mongoose.model('UserHistory', userHistory);