var _ = require('underscore');
module.exports = function provideHttp(req, res, next) {
    if( res._result === undefined ) {
        return next("Undefined provide data");
    }
    return res.json( res._result );
};
