module.exports = function (app, redisClient, mongoose, passport, callback) {

    var async = require("async");
    var UserModel = require('../models/user');
    var AccountModel = require('../models/accounting');
    var UserHistoryModel = require('../models/userHistory');
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


    const MIN_PAYMENT_VALUE = 100;

    app._invoicesApi = new ensureApi(app, {
        name : "invoices",
        schema : AccountModel,

        one : false,

        many : {
            auth : true,
            page : true,

            populate : {
                path: 'userid',
                select: '_id displayName photo balance role ban'
            },

            filter: function(req) {
                var _def = { operation : 'invoice' };
                if(req.user.role === 'admin') {
                    var _ext = req.query.filter !== undefined ? req.query.filter : {};
                    _.extend(_def, _ext);
                } else {
                    _.extend(_def, { userid : req.user._id });
                }
                return _def;
            }
        },

        add : {
            auth : true,

            playLoad: function(req) {
                var defaultInvoice = { operation : 'invoice', state : 'request',  userid : req.user._id,  valueAbs : req.user.balance, valueDelta : MIN_PAYMENT_VALUE},
                    filtered = filterKeys(req.body, ["valueDelta"], function(k, v) {
                        if( k === "valueDelta" ) {
                            var value = parseInt(v);
                            if( !isNaN(value) && value >= MIN_PAYMENT_VALUE ) {
                                return value;
                            }
                        }
                    });
                _.extend(defaultInvoice, filtered);
                return defaultInvoice;
            },

            flow: function(req, res, next) {
                var value = parseInt(req.body.valueDelta);
                if( isNaN(value) || value < MIN_PAYMENT_VALUE ) {
                    return next("MinPaymentValue");
                }

                return next();
            }
        },

        update : false
    });

    app._payoutsApi = new ensureApi(app, {
        name : "payouts",
        schema : AccountModel,

        one : false,

        many : {
            auth : true,
            page : true,

            populate : {
                path: 'userid',
                select: '_id displayName photo balance role ban'
            },

            filter: function(req) {
                var _def = { operation : 'payout' };
                if(req.user.role === 'admin') {
                    var _ext = req.query.filter !== undefined ? req.query.filter : {};
                    _.extend(_def, _ext);
                } else {
                    _.extend(_def, { userid : req.user._id });
                }
                return _def;
            }
        },

        add : {
            auth : true,

            playLoad: function(req) {
                var defaultInvoice = { operation : 'payout', state : 'request', userid : req.user._id, valueAbs : req.user.balance, valueDelta : req.user.balance},
                    filtered = filterKeys(req.body, ["valueDelta"], function(k, v) {
                        if( k === "valueDelta" ) {
                            var value = parseInt(v);
                            if( !isNaN(value) && value > 0 && value <= req.user.balance ) {
                                return value;
                            }
                        }
                    });
                _.extend(defaultInvoice, filtered);
                return defaultInvoice;
            },

            flow: function(req, res, next) {
                var value = parseInt(req.body.valueDelta);
                if( isNaN(value) || value < 0 || value > req.user.balance ) {
                    return next("NotMoney");
                }

                req.user.balance -= value;
                req.user.save(function(err) {
                    if(err) {
                        return next("BalanceNotSaved");
                    }

                    return next();
                });
            }
        },

        update : false,

        actions : {
            reject : {
                auth : [ isAuthenticatedAdmin ],
                flow : [
                    function(req, res, next) {
                        updateSchema({
                            schema : AccountModel,
                            condition : { _id : new mongoose.Types.ObjectId(req.params.id), operation : 'payout', state : 'request' },
                            data : { state : 'reject' }
                        }, req, res, next);
                    },

                    function(req, res, next) {
                        findOneSchema({
                            schema : AccountModel,
                            condition : { _id : new mongoose.Types.ObjectId(req.params.id) }
                        }, req, res, next);
                    }
                ]
            },
            close : {
                auth : [ isAuthenticatedAdmin ],
                flow : [
                    function(req, res, next) {
                        updateSchema({
                            schema : AccountModel,
                            condition : { _id : new mongoose.Types.ObjectId(req.params.id), operation : 'payout', state : 'request' },
                            data : { state : 'close' }
                        }, req, res, next);
                    },

                    function(req, res, next) {
                        findOneSchema({
                            schema : AccountModel,
                            condition : { _id : new mongoose.Types.ObjectId(req.params.id) }
                        }, req, res, next);
                    }
                ]
            }
        }
    });

    app._invoicesApi = new ensureApi(app, {
        name : "history",
        schema : UserHistoryModel,

        one : false,

        many : {
            auth : true,
            page : true,


            populate : {
                path: 'userid',
                select: '_id displayName photo balance role ban'
            },

            filter: function(req) {
                var _def = {};
                if(req.user.role === 'admin') {
                    _def = req.query.filter !== undefined ? req.query.filter : {};
                } else {
                    _def = { user : req.user._id };
                }
                return _def;
            }
        },

        add : false,
        update : false
    });

    return callback(null, { createServer : true });
};