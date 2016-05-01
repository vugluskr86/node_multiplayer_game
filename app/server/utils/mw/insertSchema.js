var _ = require('underscore');
module.exports = function insertSchema(options, req, res, next) {
    if( !options.schema ) {
        return next("insertSchema: expected options.schema");
    }

    if( !options.data ) {
        return next("insertSchema: expected options.data");
    }


    new options.schema(options.data).save(function(err, result) {
        if( err ) { return next(err); }
        res._result = result;
        return next();
    });
};
