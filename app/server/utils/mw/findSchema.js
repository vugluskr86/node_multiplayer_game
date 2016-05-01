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

    var _find = options.schema.find(options.condition, find_options);

    if( options.populate ) {
        _find = _find.populate(options.populate);
    }

    _find.exec(function(err, result) {
        if( err ) { return next(err); }
        res._result = result;
        return next();
    });
};