var _ = require('underscore');
module.exports = function findSchema(options, req, res, next) {
    if( !options.schema ) {
        return next("findSchema: options.schema not defined");
    }

    if( !options.condition ) {
        return next("findSchema: options.condition not defined");
    }

    var find_options = {};
    _.extend(find_options, options.options || {});

    options.schema.find(options.condition, find_options, function(err, result) {
        if( err ) { return next(err); }
        res._result = result;
        return next();
    });
};