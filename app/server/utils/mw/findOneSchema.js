var _ = require('underscore');
module.exports = function findOneSchema(options, req, res, next) {
    if( !options.schema ) {
        return next("findOneSchema: options.schema not defined");
    }

    if( !options.condition ) {
        return next("findOneSchema: options.condition not defined");
    }

    var find_options = {};

    _.extend(find_options, options.options || {});

    options.schema.findOne(options.condition, find_options, function(err, result) {
        if( err ) { return next(err); }
        res._result = result;
        return next();
    });
};