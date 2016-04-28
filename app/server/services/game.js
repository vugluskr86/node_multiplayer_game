if( process.argv.length < 4 ) {
    throw "Process arguments error";
}

var express = require("express"),
    http = require("http"),
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
    async = require("async"),
    passportConfig = require('./config/passport'),
    MongoStore = require('connect-mongo')(session);


var port = parseInt(process.argv[2]);

if( isNaN(port) ) {
    throw "Process listen port error";
}

var redisClient = redis.createClient();

mongoose.connect(configDB.url);


var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
};

var app = express();

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

passportConfig(passport);
app.use(passport.initialize());
app.use(passport.session());

var Server = require("./game/server.js");
var roomServer = new Server(process.argv[3], app, redisClient);

roomServer.start(function(err){
    if( err ) {
        throw err;
    }

    app.listen(port);
});
