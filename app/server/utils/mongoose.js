var mongoose = require('mongoose');
var mongooseTypes = require('mongoose-types');

var config = require('../config');

var _buildOptionsUrl = function(options) {
    options.hostname = (options.hostname || 'localhost');
    options.port = (options.port || 27017);
    options.db = (options.db || 'test');

    if(options.username && options.password) {
        return "mongodb://" + options.username + ":" + options.password + "@" + options.hostname + ":" + options.port + "/" + options.db;
    } else {
        return "mongodb://" + options.hostname + ":" + options.port + "/" + options.db;
    }
};

mongooseTypes.loadTypes(mongoose);
mongoose.createConnection( _buildOptionsUrl( config.get('mongodb') ) );

module.exports = mongoose;