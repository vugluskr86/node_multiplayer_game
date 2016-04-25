module.exports = function(app, redisClient, mongoose, server, passport, callback) {

    var express = require('express');
    var path = require('path');
    var flash = require('connect-flash');
    app.use(express.static(path.join(__dirname, 'public')));
    app.use(flash());

    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect : '/',
        failureRedirect : '/',
        failureFlash : true
    }));

    app.post('/login', passport.authenticate('local-login', {
        successRedirect : '/',
        failureRedirect : '/',
        failureFlash : true
    }));

    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

// FIXME : in config
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


    app.get('/test', function(req, res) {
        res.json({ auth : req.isAuthenticated() });
    });

    return callback(null);
};
