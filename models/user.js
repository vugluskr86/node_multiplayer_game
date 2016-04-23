var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

var userSchema = mongoose.Schema({
    displayName: {type: String},
    photo: {type: String, default: '/images/ph_avatar.jpg'},
    balance: {type: Number, default: 10000},
    currentRoom: {type: mongoose.Schema.Types.ObjectId, ref: 'Room'},
    role: { type: String },

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
});

// generating a hash
userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password);
};

// create the model for users and expose it to our app
module.exports = mongoose.model('User', userSchema);