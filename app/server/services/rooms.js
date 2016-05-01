module.exports = function (app, redisClient, mongoose, passport, callback) {

    var async = require("async");
    var UserModel = require('../models/user');
    var RoomModel = require('../models/room');
    var provideHttp = require('../utils/mw/provideHttp');
    var isAuthenticated = require('../utils/mw/isAuthenticated');
    var isAuthenticatedAdmin = require('../utils/mw/isAuthenticatedAdmin');
    var updateSchema = require('../utils/mw/updateSchema');
    var errorHandlerJSONAPI = require('../utils/mw/errorHandlerJSONAPI');
    var findOneSchema = require('../utils/mw/findOneSchema');
    var findSchema = require('../utils/mw/findSchema');
    var findSchemaPaged = require('../utils/mw/findSchemaPaged');
    var insertSchema = require('../utils/mw/insertSchema');

    var filterKeys = require('../utils/filterKeys');
    var ensureApi = require('../utils/expressApi').ensureApi;

    var _ = require("underscore"),
        log4js = require('../utils/log'),
        log = log4js.getLogger();

    app._roomsApi = new ensureApi(app, {
        name : "rooms",
        schema : RoomModel,

        one : true,

        many : {
            auth : false,
            page : true,
            filter: {}
        },

        add : {
            auth : [ isAuthenticatedAdmin ]
        },

        update : {
            auth : [ isAuthenticatedAdmin ],

            playLoad: function(req) {
                return filterKeys(req.body, [
                    "name",
                    "complexity",
                    "maxUsers",
                    "maxMobs",
                    "spawnSpeed",
                    "percent_profit",
                    "percent_null",
                    "percent_minus"
                ]);
            },


            success : function(req, res, next) {
                return RoomModel
                    .findOne({ _id : new mongoose.Types.ObjectId(req.params.id) })
                    .exec(function(err, room) {
                        redisClient.publish('ch_rooms_update', JSON.stringify(room));
                        return next();
                    });
            }
        },

        actions : {
            join : {
                auth : [ isAuthenticated ],
                flow : [
                    function(req, res, next) {
                        updateSchema({
                            schema : RoomModel,
                            condition : { _id : new mongoose.Types.ObjectId(req.params.id), players : { $nin : [ req.user._id ] } },
                            data : { $push : { players : req.user._id } }
                        }, req, res, next);
                    },

                    function(req, res, next) {
                        findOneSchema({
                            schema : RoomModel,
                            condition : { _id : new mongoose.Types.ObjectId(req.params.id) }
                        }, req, res, next);
                    }
                ]
            },

            leave : {
                auth : [ isAuthenticated ],
                flow : [
                    function(req, res, next) {
                        updateSchema({
                            schema : RoomModel,
                            condition : { _id : new mongoose.Types.ObjectId(req.params.id), players : { $in : [ req.user._id ] } },
                            data : { $pull : { players : req.user._id } }
                        }, req, res, next);
                    },

                    function(req, res, next) {
                        findOneSchema({
                            schema : RoomModel,
                            condition : { _id : new mongoose.Types.ObjectId(req.params.id) }
                        }, req, res, next);
                    }
                ]
            }
        }
    });

    return callback(null, { createServer : true });
};