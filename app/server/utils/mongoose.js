var mongoose = require('mongoose');
var mongooseTypes = require('mongoose-types');

var config = require('../config').get('mongodb');

var _buildOptionsUrl = function(options) {
    options.hostname = (options.hostname || 'localhost');
    options.port = (options.port || 27017);
    options.db = (options.db || 'test');

    console.log("Mongoose settings", options);

    if(options.username && options.password) {
        return "mongodb://" + options.username + ":" + options.password + "@" + options.hostname + ":" + options.port + "/" + options.db;
    } else {
        return "mongodb://" + options.hostname + ":" + options.port + "/" + options.db;
    }
};

mongooseTypes.loadTypes(mongoose);
mongoose.connect( _buildOptionsUrl( config ) );

module.exports = mongoose;