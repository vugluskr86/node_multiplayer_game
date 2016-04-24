module.exports = function (app, redisClient, mongoose, server, passport, callback) {
    const API_PREFIX = "/api/v1/";

    var UserModel = require('./models/user');
    var provideHttp = require('./mw/provideHttp');
    var isAuthenticated = require('./mw/isAuthenticated');

    app.get([ API_PREFIX + "users" ], function(req, res) {
        if( req.isAuthenticated() ) {
            var user = {
                auth : true,
                balance : req.user.balance,
                photo : req.user.photo,
                displayName : req.user.displayName,
                role : req.user.role,
                currentRoom : req.user.currentRoom,
                _id : req.user._id
            };
            return res.json(user);
        } else {
            return res.json({ auth : false });
        }
    });

    app.get([ API_PREFIX + "users/:id" ], function(req, res) {
        if( !req.params.id ) {
            return res.status("403").json({ message : "InvalidId" });
        }

        return UserModel
            .findOne({ _id : req.params.id })
            .select('id displayName photo balance currentRoom role')
            .exec(provideHttp.bind(null, res));
    });

    app.post([ API_PREFIX + "users" ], isAuthenticated, function(req, res) {
        if( !req.body._id || !req.body.displayName || req.body.displayName.length < 3 ) {
            return res.status("403").json({ message : "InvalidParams" });
        }

        return UserModel
            .update({ _id : req.body._id }, { displayName : req.body.displayName })
            .select('id displayName photo balance currentRoom role')
            .exec(provideHttp.bind(null, res));
    });

    app.get([ API_PREFIX + "top" ], function(req, res) {
        return UserModel
            .find({ })
            .select('id displayName photo balance currentRoom role')
            .sort({ balance : -1 })
            .limit(6)
            .exec(provideHttp.bind(null, res));
    });

    return callback(null);
};