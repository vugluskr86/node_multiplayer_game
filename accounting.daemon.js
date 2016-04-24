module.exports = function (app, redisClient, mongoose, server, passport, callback) {
    const API_PREFIX = "/api/v1/";

    var UserModel = require('./models/user');
    var AccountModel = require('./models/accounting');
    var provideHttp = require('./mw/provideHttp');
    var isAuthenticated = require('./mw/isAuthenticated');
    var isAuthenticatedAdmin = require('./mw/isAuthenticatedAdmin');

    app.get([ API_PREFIX + "invoices" ], isAuthenticatedAdmin, function(req, res) {
        return AccountModel.getInvoices({}, provideHttp.bind(null, res));
    });
    app.put([ API_PREFIX + "invoices/:id/reject" ], isAuthenticatedAdmin, function(req, res) {
        return AccountModel.rejectInvoice({ _id : req.params.id }, provideHttp.bind(null, res));
    });
    app.put([ API_PREFIX + "payouts/:id/close" ], isAuthenticatedAdmin, function(req, res) {
        return AccountModel.closeInvoice({ _id : req.params.id }, provideHttp.bind(null, res));
    });

    app.get([ API_PREFIX + "payouts" ], isAuthenticatedAdmin, function(req, res) {
        return AccountModel.getPayouts({}, provideHttp.bind(null, res));
    });
    app.put([ API_PREFIX + "payouts/:id/reject" ], isAuthenticatedAdmin, function(req, res) {
        return AccountModel.rejectPayout({ _id : req.params.id }, provideHttp.bind(null, res));
    });
    app.put([ API_PREFIX + "payouts/:id/close" ], isAuthenticatedAdmin, function(req, res) {
        return AccountModel.closePayout({ _id : req.params.id }, provideHttp.bind(null, res));
    });

    return callback(null);
};