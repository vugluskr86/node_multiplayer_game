var _ = require('underscore');
module.exports = function updateSchema(options, req, res, next) {
    if( !options.schema ) {
        return next("updateSchema: options.schema not defined");
    }

    if( !options.condition ) {
        return next("updateSchema: options.condition not defined");
    }

    if( !options.data ) {
        return next("updateSchema: options.update not defined");
    }

    var update_options = {};

    if( _.isObject(options.options) ) {
        _.extend(update_options, options.options);
    }

    options.schema.update(options.condition, options.data, update_options, function(err, result) {
        if( err ) { return next(err); }
        res._result = result;
        return next();
    });
};