var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session      = require('express-session');
var passport = require('passport');
var mongoose = require('mongoose');
var flash    = require('connect-flash');
var configDB = require('./config/database.js');
var redis = require("redis");
var http = require("http");
var _ = require("underscore");
var RedisStore = require('connect-redis')(session);
const MongoStore = require('connect-mongo')(session);
//var configAuth = require('./config/auth');

var redisClient = redis.createClient();
mongoose.connect(configDB.url);

var app = express();
var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
};
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    key: 'session',
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: true,
    store: new MongoStore({ mongooseConnection: mongoose.connection }),
    cookie: {maxAge: 24*60*60*1000},
    secure: false,
    httpOnly: false
}));
app.use(allowCrossDomain);
require('./config/passport')(passport);
app.use(passport.initialize());
app.use(passport.session());
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

var server = http.createServer(app);
server.listen("3001", "localhost");
