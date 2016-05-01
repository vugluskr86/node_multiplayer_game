module.exports = function (app, redisClient, mongoose, passport, callback) {
    const API_PREFIX = "/api/v1/";

    var UserModel = require('../models/user');
    var provideHttp = require('../utils/mw/provideHttp');
    var errorHandlerJSONAPI = require('../utils/mw/errorHandlerJSONAPI');
    var isAuthenticated = require('../utils/mw/isAuthenticated');
    var isAuthenticatedAdmin = require('../utils/mw/isAuthenticatedAdmin');

    var _ = require("underscore"),
        log4js = require('../utils/log'),
        log = log4js.getLogger();

    // Endpoint : bootstrap
    app.get([ API_PREFIX + "bootstrap" ], function(req, res, next) {
        if( req.isAuthenticated() ) {
            req.user.save(function(err) {
                if( err ) {
                    return next(err);
                }

                var auth = { auth : true },
                    user = req.user.toObject();
                _.extend(auth, user);

                return res.json(auth);
            });
        } else {
            return res.json({ auth : false });
        }
    });

    // Endpoint : users
    app.get([ API_PREFIX + "users" ], isAuthenticatedAdmin, function(req, res, next) {
        var pages = {
            page : parseInt(req.query.page),
            limit : parseInt(req.query.limit),
            select : 'id displayName photo balance role ban'
        }, query = {};

        return UserModel.getPage(query, pages, function(err, result) {
            if( err ) { return next(err); }
            res._result = result;
            return next();
        });
    }, provideHttp, errorHandlerJSONAPI);

    app.get([ API_PREFIX + "users/:id" ], isAuthenticated, function(req, res, next) {
        if( !req.params.id ) {
            return res.status("403").json({ message : "InvalidId" });
        }

        return UserModel
            .findOne({ _id : req.params.id })
            .select('id displayName photo balance role')
            .exec(function(err, result) {
                if( err ) { return next(err); }
                res._result = result;
                return next();
            });
    }, provideHttp, errorHandlerJSONAPI);


    app.put([ API_PREFIX + "users/:id/ban" ], isAuthenticatedAdmin, function(req, res, next) {
        return UserModel.ban({
            _id : req.params.id
        }, function(err, result) {
            if( err ) { return next(err); }
            res._result = result;
            return next();
        });
    }, provideHttp, errorHandlerJSONAPI);

    app.put([ API_PREFIX + "users/:id/unban" ], isAuthenticatedAdmin, function(req, res, next) {
        return UserModel.unban({
            _id : req.params.id
        }, function(err, result) {
            if( err ) { return next(err); }
            res._result = result;
            return next();
        });
    }, provideHttp, errorHandlerJSONAPI);

    app.post([ API_PREFIX + "users" ], isAuthenticated, function(req, res, next) {
        if( !req.body._id || !req.body.displayName || req.body.displayName.length < 3 ) {
            return res.status("403").json({ message : "InvalidParams" });
        }

        return UserModel
            .update({ _id : req.body._id }, { displayName : req.body.displayName })
            .select('id displayName photo balance role')
            .exec(function(err, result) {
                if( err ) { return next(err); }
                res._result = result;
                return next();
            });
    }, provideHttp, errorHandlerJSONAPI);


    app.get([ API_PREFIX + "top" ], function(req, res, next) {
        return UserModel
            .find({ })
            .select('id displayName photo balance role')
            .sort({ balance : -1 })
            .limit(6)
            .exec(function(err, result) {
                if( err ) { return next(err); }
                res._result = result;
                return next();
            });
    }, provideHttp, errorHandlerJSONAPI);

    return callback(null, { createServer : true });
};