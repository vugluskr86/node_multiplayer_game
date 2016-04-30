var express = require("express"),
    http = require("http"),
    path = require('path'),
    favicon = require('serve-favicon'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    session      = require('express-session'),
    passport = require('passport'),
    mongoose = require('../utils/mongoose'),
    redis = require("redis"),
    async = require("async"),
    passportConfig = require('../utils/passport'),
    MongoStore = require('connect-mongo')(session),
    log4js = require('../utils/log'),
    log = log4js.getLogger(),
    allowCrossDomain = require('../utils/mw/allowCrossDomain'),
    optimist = require('optimist'),
    _ = require("underscore");

var daemon = {

    config : {
        port : 3000,
        service : ""
    },

    initialize : function() {

        log.debug("initialize")

        _.bindAll(this, 'createServer', '_handleServerCreate');

        this.argv = optimist.argv;

        if( Object.keys(this.argv).length < 2  ) {
            log.error("undefined process args");
        }

        this.config.service = this.argv["service"];
        this.config.port = this.argv["port"];

        this.serviceMw = require("../services/" + this.config.service);

        this.redisClient = redis.createClient();

     //   mongoose.connect(configDB.url);

        this.app = express();


        this.app.use(log4js.connectLogger(log, { level: log4js.levels.INFO }));
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({extended: true}));
        this.app.use(cookieParser());
        this.app.use(session({
            key: 'session',
            secret: 'keyboard cat',
            resave: true,
            saveUninitialized: true,
            cookie: {maxAge: 24*60*60*1000},
            secure: false,
            httpOnly: false,
            store: new MongoStore({ mongooseConnection: mongoose.connection })
        }));

       // this.app(allowCrossDomain);

        passportConfig(passport);

        this.app.use(passport.initialize());
        this.app.use(passport.session());

        this.createServer();
    },

    createServer:  function() {

        log.debug("createServer")

        this.serviceMw(this.app, this.redisClient, mongoose, passport, this._handleServerCreate);
    },

    _handleServerCreate: function(err, options) {
        // FIXME
        if( err ) {
            log.error(log);
        }

        log.debug(options)

        if( options && options["createServer"] ) {
            log.debug("create server", options["createServer"]);
            this.server = http.createServer(this.app);

            this.server.listen(this.config.port, "localhost", function() {
                log.info(this.config.service + " listening on localhost:" + this.config.port)
            }.bind(this));
        } else {
            this.app.listen(this.config.port, "localhost", function() {
                log.info(this.config.service + " listening on localhost:" + this.config.port)
            }.bind(this));
        }
    }
};

log.debug('initialize');
daemon.initialize();

/*
_app(app, redisClient, mongoose, server, passport, function() {
    server.listen(port, "localhost", function() {
        log.info(serviceName + " listening on localhost:" + port)
    });
});
*/

