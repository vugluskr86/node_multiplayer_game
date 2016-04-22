/**
 * Поднимать все процессы из базы
 * Перезапускать если упал
 * Перезапускать по требованию
 * Удалять
 */

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

var roomsState = {
};

var startPort = 3010;

function startRoomProcess(room, callback) {
    const id = room === 'lobby' ? 'lobby' : room._id;

    console.log("startRoomProcess", id);

    var util  = require('util'),
        spawn = require('child_process').spawn,
        game    = spawn('node', ['./game.daemon.js', id , startPort]);

    game.stdout.on('data', function (data) {
        console.log('stdout: ' + data);
    });

    game.stderr.on('data', function (data) {
        console.log('stderr: ' + data);
    });

    game.on('exit', function (code) {
        console.log('child process exited with code ' + code);
    });

    if( room !== 'lobby' ) {
        room.port = startPort;
        room.state = 'run';
        room.pid = game.pid;

        room.save(function(err) {
            if( err ) {
                return callback(err);
            }

            startPort++;

            callback(null, room);
        });
    } else {
        startPort++;
    }


}

//startRoomProcess("lobby", startPort);

RoomModel.find({}).exec(function(err, rooms) {
    if( err ) {
        throw err;
    }

    return async.eachSeries(rooms, startRoomProcess, function(err) {
        if( err ) {
            throw err;
        }

        console.log("All room loaded");
    });
});


app.get([ API_PREFIX + "rooms" ], function(req, res) {
    return RoomModel.find({}).exec(provideHttp.bind(null, res));
});

app.get([ API_PREFIX + "rooms/:id" ], function(req, res) {
    return RoomModel.findOne({ _id : req.params.id }).exec(provideHttp.bind(null, res));
});

app.put([ API_PREFIX + "rooms/:id/join" ], isAuthenticated, function(req, res) {
    var roomid = new mongoose.Types.ObjectId(req.params.id),
        userid = new mongoose.Types.ObjectId(req.user._id),

        room_condition = { _id : roomid, players : { $nin : [ userid ] } },
        room_update = { $push : { players : userid } },

        user_condition = { _id : userid },
        user_update = { currentRoom : roomid };

    console.log("join", userid, roomid);

    redisClient.setnx("user:" + userid.toString() + ":currentRoom", roomid.toString(), function(err, result) {
        if( err ) {
            return provideHttp(res, err, result);
        }

        if( result != 1 ) {
            return provideHttp(res, { message : "AlreadyInRoom" });
        }

        return async.parallel([

            function(next) {
                RoomModel.update(room_condition, room_update).exec(next)
            },

            function(next) {
                UserModel.update(user_condition, user_update).exec(next)
            }

        ], provideHttp.bind(null, res));
    });
});

app.put([ API_PREFIX + "rooms/:id/leave" ], isAuthenticated, function(req, res) {
    var roomid = new mongoose.Types.ObjectId(req.params.id),
        userid = new mongoose.Types.ObjectId(req.user._id),

        room_condition = { _id : roomid, players : { $in : [ userid ] } },
        room_update = { $pull : { players : userid } },

        user_condition = { _id : userid },
        user_update = { currentRoom : null };


    return redisClient.del("user:" + userid.toString() + ":currentRoom", function(err, result){
        if( err ) {
            return provideHttp(res, err, result);
        }

        if( result != 1 ) {
            return provideHttp(res, { message : "NotInRoom" });
        }

        return async.parallel([

            function(next) {
                RoomModel.update(room_condition, room_update).exec(next)
            },

            function(next) {
                UserModel.update(user_condition, user_update).exec(next)
            }

        ], provideHttp.bind(null, res));
    });
});

app.post([ API_PREFIX + "rooms" ], isAuthenticatedAdmin, function(req, res) {
    return RoomModel.collection.insert(req.body, provideHttp.bind(null, res));
});

app.put([ API_PREFIX + "rooms/:id" ], isAuthenticatedAdmin, function(req, res) {
    var condition = { _id : req.params.id};

    var data = Object.keys(req.body),
        update = {};

    const _filter = {
        "name" : function(v) { return v },
        "complexity" : function(v) { return v },
        "maxUsers" : function(v) { return parseInt(v) },
        "maxMobs" : function(v) { return parseInt(v) },
        "spawnSpeed" : function(v) { return parseFloat(v) },
        "percent_profit" : function(v) { return parseFloat(v) },
        "percent_null" : function(v) { return parseFloat(v) },
        "percent_minus" : function(v) { return parseFloat(v) }
    };

    data.forEach(function(v) {
        if(_.isFunction( _filter[v] ) ) {
            update[v] = _filter[v](req.body[v]);
        }
    });

    return RoomModel.update(condition, update).exec(function(err, model) {
        if( err ) {
            return provideHttp(res, err, model);
        }

        var info = {
            id : req.params.id
        };
        _.extend(info, update);

        pubsubClient.publish('ch_rooms_update', JSON.stringify(info));

        return provideHttp(res, err, model);
    });
});

app.put([ API_PREFIX + "rooms/:id/stop" ], isAuthenticatedAdmin, function(req, res) {
    res.end();
});

app.put([ API_PREFIX + "rooms/:id/restart" ], isAuthenticatedAdmin, function(req, res) {
    res.end();
});

app.delete([ API_PREFIX + "rooms/:id" ], isAuthenticatedAdmin, function(req, res) {
    res.end();
});


server.listen("3004", "localhost");