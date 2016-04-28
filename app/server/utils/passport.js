var LocalStrategy    = require('passport-local').Strategy;
var VKontakteStrategy = require('passport-vkontakte').Strategy;

var User       = require('../models/user');
var configAuth = require('./auth');

var mongoose = require('mongoose');

var selectProfilePhoto = function selectProfilePhoto( photos )
{
    if( !photos || photos.length <= 0 )
        return '/images/ph_avatar.jpg';

    return photos[ 0 ].value;
};


module.exports = function(passport) {
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });

    passport.use('local-login', new LocalStrategy({
            usernameField : 'email',
            passwordField : 'password',
            passReqToCallback : true
        },
        function(req, email, password, done) {
            if (email)
                email = email.toLowerCase();

            process.nextTick(function() {
                return User.findOne({ 'local.email' :  email }, function(err, user) {
                    if (err) {
                        console.log(err);
                        return done(err);
                    }
                    if (!user) {
                        return done(null, false, req.flash('loginMessage', 'No user found.'));
                    }
                    if (!user.validPassword(password)) {
                        return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.'));
                    } else {
                        return done(null, user);
                    }
                });
            });

        }));

    passport.use('local-signup', new LocalStrategy({
            usernameField : 'email',
            passwordField : 'password',
            passReqToCallback : true
        },
        function(req, email, password, done) {
            process.nextTick(function() {
                User.findOne({ 'local.email' :  email }, function(err, user) {
                    if( err ) {
                        return done(err);
                    }
                    if (user) {
                        return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
                    } else {
                        var newUser            = new User();
                        newUser.displayName = "New User";
                        newUser.photo = selectProfilePhoto();
                        newUser.local.email    = email;
                        newUser.local.password = newUser.generateHash(password);
                        newUser.markModified('local');
                        newUser.save(function(err) {
                            if( err ) {
                                return done(err);
                            }
                            return done(null, newUser);
                        });
                    }
                });
            });
        }));

    passport.use('vkontakte', new VKontakteStrategy({
            clientID: configAuth.vkAuth.clientID,
            clientSecret: configAuth.vkAuth.clientSecret,
            callbackURL: configAuth.vkAuth.callbackURL
        },
        function(req, accessToken, refreshToken, profile, done)
        {
            return process.nextTick(function() {
                return User.findOne({ 'vk.id' : profile.id }, function(err, user) {
                    if( err ) {
                        return done(err);
                    }
                    if(user) {
                        // пользователь найден
                        return done(null, user);
                    } else {
                        var newUser = new User();
                        newUser.displayName = profile.displayName;
                        newUser.photo = selectProfilePhoto( profile.photos );
                        //      newUser.currentRoom = "571526540e1ea4be02c7683e";
                        newUser.vk.id = profile.id;
                        newUser.markModified('vk');
                        return newUser.save(function(err) {
                            if( err ) {
                                return done(err);
                            }
                            return done(null, newUser);
                        });
                    }
                });
            });
        }
    ));
};