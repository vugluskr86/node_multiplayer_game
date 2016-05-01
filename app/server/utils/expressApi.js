const API_PREFIX = "/api/v1/";

var provideHttp = require('./mw/provideHttp');
var isAuthenticated = require('./mw/isAuthenticated');
var isAuthenticatedAdmin = require('./mw/isAuthenticatedAdmin');
var updateSchema = require('./mw/updateSchema');
var errorHandlerJSONAPI = require('./mw/errorHandlerJSONAPI');
var findOneSchema = require('./mw/findOneSchema');
var findSchema = require('./mw/findSchema');
var findSchemaPaged = require('./mw/findSchemaPaged');
var insertSchema = require('./mw/insertSchema');

var filterKeys = require('./filterKeys');

var _ = require("underscore"),
    log4js = require('./log'),
    log = log4js.getLogger();


var mongoose = require('mongoose');

// TODO :
// UPDATE
// REMOVE
// Success callback on action

module.exports.ensureApi = function ensureApi(app, options) {

    this.options = {
        one : true,
        many : true,
        add : false,
        update : false,
        delete : false,
        actions : {}
    };

    _.extend(this.options, options || {});

    if( !this.options.schema ) {
        log.error("ensureApi: expected options.schema");
    }

    if( !this.options.name ) {
        log.error("ensureApi: expected options.name");
    }

    this._mw = {};

    var makeAuthMiddlewareList = function makeAuthMiddlewareList(options, out_list) {
        if( _.isObject(options) && options.auth ) {
            if( Array.isArray(options.auth) ) {
                out_list = options.auth;
            } else {
                out_list.push(isAuthenticated);
            }
        }
        return out_list;
    };

    var checkRequestCondition = function checkRequestCondition(req, condition, _default) {
        if( _.isFunction(condition) ) {
            return condition(req);
        }

        if( condition === true ) {
            return _default;
        }
    };



    if( this.options.one ) {
        this._mw.one = [];

        makeAuthMiddlewareList(this.options.one, this._mw.one);

        var _findOneWrapper = function(req, res, next) {
            findOneSchema({
                schema : this.options.schema,
                condition : { _id : new mongoose.Types.ObjectId(req.params.id) }
            }, req, res, next);
        }.bind(this);

        if(_.isFunction(this.options.one.flow) ) {
            this._mw.one.push(this.options.one.flow);
        } else if(Array.isArray(this.options.one.flow) ) {
            this._mw.one = this._mw.one.concat(this.options.one.flow);
        }

        this._mw.one.push(_findOneWrapper);

        if( _.isFunction(this.options.one.success) ) {
            this._mw.one.push(this.options.one.success);
        }

        this._mw.one.push(provideHttp);
        this._mw.one.push(errorHandlerJSONAPI);

        app.get([ API_PREFIX + this.options.name + "/:id" ], this._mw.one);
    }

    if( this.options.many ) {
        this._mw.many = [];

        makeAuthMiddlewareList(this.options.many, this._mw.many);

        var _findWrapper = function(req, res, next) {

            var condition = {},
                _conditionFilter = checkRequestCondition(req, this.options.many.filter, {});
            if( _conditionFilter ) {
                _.extend(condition, _conditionFilter);
            }

            var page = undefined,
                _conditionPage = checkRequestCondition(req, this.options.many.page, {});
            if( _conditionPage ) {
                page = {};

                _.extend(page, _conditionPage);
                _.extend(page,
                    filterKeys(req.query,
                        ["limit", "page"],
                        function(k, v) {
                            return parseInt(v);
                        }
                    ) || {});
            }

         //   console.log(condition)

            if( page ) {
                findSchemaPaged({
                    schema : this.options.schema,
                    condition : condition,
                    options : page
                }, req, res, next);
            } else {
                findSchema({
                    schema : this.options.schema,
                    condition : condition
                }, req, res, next);
            }

        }.bind(this);

        if(_.isFunction(this.options.many.flow) ) {
            this._mw.many.push(this.options.many.flow);
        } else if(Array.isArray(this.options.many.flow) ) {
            this._mw.many = this._mw.many.concat(this.options.many.flow);
        }

        this._mw.many.push(_findWrapper);

        if( _.isFunction(this.options.many.success) ) {
            this._mw.many.push(this.options.many.success);
        }

        this._mw.many.push(provideHttp);
        this._mw.many.push(errorHandlerJSONAPI);

        app.get([ API_PREFIX + this.options.name ], this._mw.many);
    }

    if( this.options.add ) {
        this._mw.add = [];

        makeAuthMiddlewareList(this.options.add, this._mw.add);

        var _insertWrapper = function(req, res, next) {

            var playLoad = {};

            if(_.isFunction(this.options.add.playLoad)) {
                playLoad = this.options.add.playLoad(req);
            } else {
                playLoad = req.body;
            }

            insertSchema({
                schema : this.options.schema,
                data : playLoad
            }, req, res, next);
        }.bind(this);

        if(_.isFunction(this.options.add.flow) ) {
            this._mw.add.push(this.options.add.flow);
        } else if(Array.isArray(this.options.add.flow) ) {
            this._mw.add = this._mw.add.concat(this.options.add.flow);
        }

        this._mw.add.push(_insertWrapper);

        if( _.isFunction(this.options.add.success) ) {
            this._mw.add.push(this.options.add.success);
        }


        this._mw.add.push(provideHttp);
        this._mw.add.push(errorHandlerJSONAPI);

        app.post([ API_PREFIX + this.options.name ], this._mw.add);
    }


    if( this.options.update ) {
        this._mw.update = [];

        makeAuthMiddlewareList(this.options.update, this._mw.update);

        var _updateWrapper = function(req, res, next) {
            var playLoad = {};

            if(_.isFunction(this.options.update.playLoad)) {
                playLoad = this.options.update.playLoad(req);
            } else {
                playLoad = req.body;
            }

            var id = playLoad._id;

            if( playLoad._id ) { delete playLoad._id; }
            if( playLoad.id ) { delete playLoad.id; }

            updateSchema({
                schema : this.options.schema,
                condition : { _id : new mongoose.Types.ObjectId(id) },
                data : playLoad
            }, req, res, next);
        }.bind(this);

        if(_.isFunction(this.options.update.flow) ) {
            this._mw.update.push(this.options.update.flow);
        } else if(Array.isArray(this.options.update.flow) ) {
            this._mw.update = this._mw.update.concat(this.options.update.flow);
        }

        this._mw.update.push(_updateWrapper);

        if( _.isFunction(this.options.update.success) ) {
            this._mw.update.push(this.options.update.success);
        }

        this._mw.update.push(provideHttp);
        this._mw.update.push(errorHandlerJSONAPI);

        app.put([ API_PREFIX +  this.options.name + "/:id" ], this._mw.update);
    }

    /*
     if( this.options.delete ) {
     this._mw.delete = [];

     makeAuthMiddlewareList(this.options.one, this._mw.one);
     }
     */


    if( this.options.actions && _.isObject(this.options.actions) ) {
        var actionsNames = Object.keys(this.options.actions);

        this.actions_mw = {};

        actionsNames.forEach(function(actionName) {
            var action = this.options.actions[actionName];

            if(_.isObject(action) ) {
                var _mw = [];

                makeAuthMiddlewareList(action, _mw);

                if(_.isFunction(action.flow) ) {
                    _mw.push(action.flow);
                } else if(Array.isArray(action.flow) ) {
                    _mw = _mw.concat(action.flow);
                }

                if( _.isFunction(action.success) ) {
                    _mw.push(action.success);
                }

                _mw.push(provideHttp);
                _mw.push(errorHandlerJSONAPI);

                this.actions_mw[actionName] = _mw;

                app.put([ API_PREFIX +  this.options.name + "/:id/" + actionName ], this.actions_mw[actionName]);
            }

        }.bind(this))
    }
}
