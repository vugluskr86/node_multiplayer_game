var express = require("express"),
    http = require("http"),
    sockjs = require("sockjs"),
    path = require('path'),
    favicon = require('serve-favicon'),
    logger = require('morgan'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    session      = require('express-session'),
    passport = require('passport'),
    mongoose = require('mongoose'),
    configDB = require('./config/database.js'),
    redis = require("redis"),
    _ = require("underscore"),
    async = require("async");

var RedisStore = require('connect-redis')(session);
const MongoStore = require('connect-mongo')(session);
var redisClient = redis.createClient(),
    pubsubClient = redis.createClient();


mongoose.connect(configDB.url);


var UserModel = require('./models/user');
var RoomModel = require('./models/room');

var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
};

var app = express(),
    socketServer = sockjs.createServer();

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
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

var server = http.createServer(app);

function isAuthenticated(req, res, next) {
    if (req.isAuthenticated())
        return next();

    return res.status("403").json({ message : "NotAuth" });
}

function isAuthenticatedAdmin(req, res, next) {
    if (req.isAuthenticated() && req.user.role === "admin")
        return next();

    return res.status("403").json({ message : "NotAuth" });
}

const API_PREFIX = "/api/v1/";
const REDIS_ROOMS_KEY = "ROOMS";

function provideHttp(res, err, result) {
    if( err ) {
        return res.status("404").json(err);
    }
    return res.json(result);
}

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

// FIXME: Отдельные обработчики для коллекции и модели
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

server.listen("3002", "localhost");
