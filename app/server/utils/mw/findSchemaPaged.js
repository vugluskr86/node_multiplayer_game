var _ = require('underscore');
module.exports = function findSchemaPaged(options, req, res, next) {
    if( !options.schema ) {
        return next("findSchemaPaged: options.schema not defined");
    }

    if( !options.condition ) {
        return next("findSchemaPaged: options.condition not defined");
    }

    var page_options = {
        limit : 10,
        page : 1
    };

    _.extend(page_options, options.options || {});

    if( !page_options.page || page_options.page <= 0 ) {
        page_options.page = 1;
    }

    if( !page_options.limit || page_options.limit <= 0 ) {
        page_options.limit = 1;
    }

    if( options.populate ) {
        _.extend(page_options, { populate : options.populate });
    }




//    console.log(options.options, page_options)

    options.schema.paginate(options.condition, page_options, function(err, result) {
        if( err ) { return next(err); }
        res._result = result;
        return next();
    });
};