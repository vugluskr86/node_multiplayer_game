var _ = require('underscore');

module.exports = function errorHandlerJSONAPI(err, req, res) {
    if( err ) {
        if( _.isObject(err) || _.isArray(err) ) {
            res.status(503).json(err);
        } else {
            res.status(503).json({ err : err });
        }
    }
};
