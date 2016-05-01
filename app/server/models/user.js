var mongoose = require('../utils/mongoose');
var bcrypt   = require('bcrypt-nodejs');
var mongoosePaginate = require('mongoose-paginate');

var _ = require("underscore");
var async = require("async");


var userSchema = mongoose.Schema({
    displayName: {type: String},
    photo: {type: String, default: '/images/ph_avatar.jpg'},
    balance: {type: Number, default: 10000},
    role: { type: String },

    ban: { type:Boolean , default: false},

    local            : {
        email        : String,
        password     : String
    },

    facebook         : {
        id           : String,
        token        : String,
        email        : String,
        name         : String
    },

    twitter          : {
        id           : String,
        token        : String,
        displayName  : String,
        username     : String
    },

    google           : {
        id           : String,
        token        : String,
        email        : String,
        name         : String
    },

    vk         : {
        id           : String,
        displayName  : String
    }

    , created    : { type: Date }
    , updated    : { type: Date }
});

userSchema.pre('save', function(next){
    var now = new Date();
    this.updated = now;
    if ( !this.created ) {
        this.created = now;
    }
    next();
});

userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password);
};

userSchema.plugin(mongoosePaginate);


userSchema.statics.getPage = function(query, options, callback) {
    return mongoose.model('User').paginate(query, options, callback);
};

userSchema.statics.ban = function(options, callback) {
    var q = _.clone(options);
    _.extend(q, { ban : false });
    return mongoose.model('User').update(q, { ban : true }).exec(callback);
};

userSchema.statics.unban = function(options, callback) {
    var q = _.clone(options);
    _.extend(q, { ban : true });
    return mongoose.model('User').update(q, { ban : false }).exec(callback);
};

// получение статистики по регистрации пользователей
userSchema.statics.getRegistrationStatistic = function(options, callback) {
    var UserModel = mongoose.model('User');
    return async.waterfall({
        days : function(next) {
            UserModel.aggregate([
                {
                    $group:
                    {
                        _id: { day: { $dayOfMonth: "$created" },  month: { $month: "$created" }, year: { $year: "$created" } },
                        count: { $sum: 1 }
                    }
                }
            ], next);
        },
        week : function(next) {
            UserModel.aggregate([
                {
                    $group:
                    {
                        _id: { week: { $week: "$date" }, year: { $year: "$created" } },
                        count: { $sum: 1 }
                    }
                }
            ], next);
        },
        mounth : function(next) {
            UserModel.aggregate([
                {
                    $group:
                    {
                        _id: { month: { $month: "$created" }, year: { $year: "$created" } },
                        count: { $sum: 1 }
                    }
                }
            ], next);
        },
        all : function(next) {
            UserModel.find({}).count(next);
        }
    }, callback);
};


module.exports = mongoose.model('User', userSchema);