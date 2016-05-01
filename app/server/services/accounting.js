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

            filter: function(req) {
                var _def = { operation : 'invoice' };
                if(req.user.role === 'admin') {
                    // fixme : filter from req.body
                    var _ext = req.query.filter_userid !== undefined ? { userid : req.query.filter_userid } : {};
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

            filter: function(req) {
                var _def = { operation : 'payout' };
                if(req.user.role === 'admin') {
                    // fixme : filter from req.body
                    var _ext = req.query.filter_userid !== undefined ? { userid : req.query.filter_userid } : {};
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


    /*
    app.post([ API_PREFIX + "payouts" ], isAuthenticated, function(req, res) {
        var value = req.body.valueDelta !== undefined && !isNaN( parseInt(req.body.valueDelta) ) ? parseInt(req.body.valueDelta) : 100;

        // проверяем что есть деньги
        if( req.user.balance < value ) {
            return provideHttp(res, "NotMoney");
        }

        // отнимаем деньги
        req.user.balance -= value;
        req.user.save(function(err) {
            if(err) {
                return provideHttp(res, "BalanceNotSaved");
            }

            return AccountModel.createPayout({
                userid : req.user._id,
                valueAbs : req.user.balance,
                valueDelta : value
            }, provideHttp.bind(null, res));
        });
    });


    // Пагинация
    app.get([ API_PREFIX + "payouts" ], isAuthenticated, function(req, res) {
        var pages = {
            page : parseInt(req.query.page),
            limit : parseInt(req.query.limit),
            populate: 'userid'
        }, query = req.user.role === 'admin'
            ? ( req.query.filter_userid !== undefined ? { userid : req.query.filter_userid } : {} )
            : { userid : req.user._id };

        return AccountModel.getPayoutsPage(query, pages, provideHttp.bind(null, res));
    });



    app.put([ API_PREFIX + "payouts/:id/reject" ], isAuthenticatedAdmin, function(req, res) {
        return AccountModel.rejectPayout({ _id : req.params.id }, provideHttp.bind(null, res));
    });

    app.put([ API_PREFIX + "payouts/:id/close" ], isAuthenticatedAdmin, function(req, res) {
        return AccountModel.closePayout({ _id : req.params.id }, provideHttp.bind(null, res));
    });
    */




    app._invoicesApi = new ensureApi(app, {
        name : "history",
        schema : UserHistoryModel,

        one : false,

        many : {
            auth : true,
            page : true,

            filter: function(req) {
                var _def = {};
                if(req.user.role === 'admin') {
                    // fixme : filter from req.body
                    _def = req.query.filter_userid !== undefined ? { user : req.query.filter_userid } : {};
                } else {
                    _def = { user : req.user._id };
                }
                return _def;
            }
        },

        add : false,
        update : false
    });

/*
    // Пагинация
    app.get([ API_PREFIX + "history" ], isAuthenticated, function(req, res) {
        var pages = {
            page : parseInt(req.query.page),
            limit : parseInt(req.query.limit),
            populate: 'user'
        }, query = req.user.role === 'admin'
            ? ( req.query.filter_userid !== undefined ? { user : req.query.filter_userid } : {} )
            : { user : req.user._id };

        return UserHistoryModel.getPage(query, pages, provideHttp.bind(null, res));
    });
*/



    return callback(null, { createServer : true });
};