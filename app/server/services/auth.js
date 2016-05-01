module.exports = function(app, redisClient, mongoose, passport, callback) {

    var _ = require("underscore"),
        log4js = require('../utils/log'),
        log = log4js.getLogger();


    var express = require('express');
    var path = require('path');
    var flash = require('connect-flash');

    app.use(flash());

    app.post('/signup', function(req, res, next) {
        passport.authenticate('local-signup', function(err, user, info) {
            if( err ) {
                return next(err);
            }

            if( !user ) {
                return res.json({ err : info });
            }

            req.logIn(user, function(err) {
                if (err) { return next(err); }
                return res.json({});
            });
        })(req, res, next);
    });

    app.post('/login', function(req, res, next) {
        passport.authenticate('local-login', function(err, user, info) {
            if( err ) {
                return next(err);
            }

            if( !user ) {
                return res.json({ err : info });
            }

            req.logIn(user, function(err) {
                if (err) { return next(err); }
                return res.json({});
            });
        })(req, res, next);
    });

    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

    app.get('/auth/vkontakte',
        passport.authenticate('vkontakte'),
        function(req, res) {
            res.end();
        });

    app.get('/auth/vkontakte/callback',
        passport.authenticate('vkontakte', { failureRedirect: '/' }),
        function(req, res) {
            res.redirect('/');
        });

    app.post('/api/v1/errors',
        function(req, res) {
            log.debug(req.body);
            res.end();
        });

    return callback(null, { createServer : true });
};
