module.exports = function (app, redisClient, mongoose, passport, callback) {
    const API_PREFIX = "/api/v1/";

    var UserModel = require('../models/user');
    var provideHttp = require('../utils/mw/provideHttp');
    var isAuthenticated = require('../utils/mw/isAuthenticated');
    var isAuthenticatedAdmin = require('../utils/mw/isAuthenticatedAdmin');

    var _ = require("underscore"),
        log4js = require('../utils/log'),
        log = log4js.getLogger();

    // Endpoint : bootstrap
    app.get([ API_PREFIX + "bootstrap" ], function(req, res) {
        if( req.isAuthenticated() ) {
            var auth = { auth : true},
                user = req.user.toObject();
            _.extend(auth, user);

            return res.json(auth);
        } else {
            return res.json({ auth : false });
        }
    });

    // Endpoint : users

    app.get([ API_PREFIX + "users" ], isAuthenticatedAdmin, function(req, res) {
        var pages = {
            page : parseInt(req.query.page),
            limit : parseInt(req.query.limit),
            select : 'id displayName photo balance currentRoom role ban'
        }, query = {};

        return UserModel.getPage(query, pages, provideHttp.bind(null, res));
    });

    app.get([ API_PREFIX + "users/:id" ], isAuthenticated, function(req, res) {
        if( !req.params.id ) {
            return res.status("403").json({ message : "InvalidId" });
        }

        return UserModel
            .findOne({ _id : req.params.id })
            .select('id displayName photo balance currentRoom role')
            .exec(provideHttp.bind(null, res));
    });


    app.put([ API_PREFIX + "users/:id/ban" ], isAuthenticatedAdmin, function(req, res) {
        return UserModel.ban({
            _id : req.params.id
        }, provideHttp.bind(null, res));
    });

    app.put([ API_PREFIX + "users/:id/unban" ], isAuthenticatedAdmin, function(req, res) {
        return UserModel.unban({
            _id : req.params.id
        }, provideHttp.bind(null, res));
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

    return callback(null, { createServer : true });
};