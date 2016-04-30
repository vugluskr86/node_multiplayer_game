module.exports = function (app, redisClient, mongoose, passport, callback) {
    const API_PREFIX = "/api/v1/";

    var UserModel = require('../models/user');
    var AccountModel = require('../models/accounting');
    var UserHistoryModel = require('../models/userHistory');
    var provideHttp = require('../utils/mw/provideHttp');
    var isAuthenticated = require('../utils/mw/isAuthenticated');
    var isAuthenticatedAdmin = require('../utils/mw/isAuthenticatedAdmin');


    app.post([ API_PREFIX + "invoices" ], isAuthenticated, function(req, res) {
        var value = req.body.valueDelta !== undefined && !isNaN( parseInt(req.body.valueDelta) ) ? parseInt(req.body.valueDelta) : 100;
        return AccountModel.createInvoice({
            userid : req.user._id,
            valueAbs : req.user.balance,
            valueDelta : value
        }, provideHttp.bind(null, res));
    });

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
    app.get([ API_PREFIX + "invoices" ], isAuthenticated, function(req, res) {
        var pages = {
            page : parseInt(req.query.page),
            limit : parseInt(req.query.limit),
            populate: 'userid'
        }, query = req.user.role === 'admin'
            ? ( req.query.filter_userid !== undefined ? { userid : req.query.filter_userid } : {} )
            : { userid : req.user._id };

        return AccountModel.getInvoicesPage(query, pages, provideHttp.bind(null, res));
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

    app.put([ API_PREFIX + "payouts/:id/reject" ], isAuthenticatedAdmin, function(req, res) {
        return AccountModel.rejectPayout({ _id : req.params.id }, provideHttp.bind(null, res));
    });
    app.put([ API_PREFIX + "payouts/:id/close" ], isAuthenticatedAdmin, function(req, res) {
        return AccountModel.closePayout({ _id : req.params.id }, provideHttp.bind(null, res));
    });



    return callback(null, { createServer : true });
};