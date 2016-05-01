(function (root, factory) {
    'use strict';

    module.exports = factory(
        root,
        exports,
        require('underscore'),
        require('jquery'),
        require('backbone'),
        require('ReconnectingWebSocket')
    );

}(this, function (root, Module, _, $, Backbone, ReconnectingWebSocket) {
    'use strict';

    const API_PREFIX = "/api/v1/";

    var PaginatedCollection = Backbone.Collection.extend({
        initialize: function(options) {
            _.bindAll(this, 'parse', 'url', 'pageInfo', 'nextPage', 'previousPage');
            typeof(options) != 'undefined' || (options = {});
            this.page = 1;
            typeof(this.limit) != 'undefined' || (this.limit = 5);
        },
        fetch: function(options) {
            typeof(options) != 'undefined' || (options = {});
            this.trigger("fetching");
            var self = this;
            var success = options.success;
            options.success = function(resp) {
                self.trigger("fetched");
                if(success) { success(self, resp); }
            };

            if( this.filter ) {
                _.extend(options, {
                    data : {
                        filter : this.filter
                    }
                });
            }

            return Backbone.Collection.prototype.fetch.call(this, options);
        },
        parse: function(resp) {
            this.page = resp.page;
            this.limit = resp.limit;
            this.total = resp.total;
            return resp.docs;
        },
        url: function() {
            return this.baseUrl + '?' + $.param({page: this.page, limit: this.limit});
        },
        pageInfo: function() {
            var info = {
                total: this.total,
                page: this.page,
                limit: this.limit,
                pages: Math.ceil(this.total / this.limit),
                prev: false,
                next: false
            };

            var max = Math.min(this.total, this.page * this.limit);

            if (this.total == this.pages * this.limit) {
                max = this.total;
            }

            info.range = [(this.page - 1) * this.limit + 1, max];

            if (this.page > 1) {
                info.prev = this.page - 1;
            }

            if (this.page < info.pages) {
                info.next = this.page + 1;
            }

            return info;
        },
        nextPage: function(options) {
            var _opt = { reset : true };
            _.extend(_opt, options || {});
            if (!this.pageInfo().next) {
                return false;
            }
            this.page = this.page + 1;
            return this.fetch(_opt);
        },
        previousPage: function(options) {
            var _opt = { reset : true };
            _.extend(_opt, options || {});

            if (!this.pageInfo().prev) {
                return false;
            }
            this.page = this.page - 1;
            return this.fetch(_opt);
        }
    });

    var MobModel = Backbone.Model.extend({

        initialize: function() {
            _.bindAll(this, '_calc', '_update');
        },

        _calc : function(time) {
            var options = this.toJSON();

            var distance = options.speed * ( options.created + time ) / 1000;

            var x = options.center.x + Math.sin(distance) * options.r_x * Math.sin(distance);
            var y = options.center.y + Math.cos(distance) * options.r_y * Math.sin(distance);

            this.set('x', x);
            this.set('y', y);
        },

        _update : function() {
            var shape = this.get('shape');

            if( shape ) {
                var _rot = this.get('angle') * (180 / Math.PI);
                if( shape._childText ) {
                    shape._childText.rotation = -_rot;
                }
                shape.rotation = _rot;
                shape.x = this.get('x');
                shape.y = this.get('y');
            }
        }
    });

    var MobsCollection = Backbone.Collection.extend({
        model : MobModel
    });

    var RoomModel = Backbone.Model.extend({

        idAttribute : '_id',

        urlRoot : API_PREFIX + "rooms",

        _mobsCache : new MobsCollection(),

        _connectState : 'DISCONNECTED',

        initialize : function() {
            _.bindAll(this, 'subscribe', 'join', 'leave',
                'click', '_connect', '_handleSocketMessage',
                '_handleClose', '_handleError', '_handleOpen', '_handleUpdateMobs');

          //  this.listenTo(this, 'update:mobs', this._handleUpdateMobs);
        },

        join: function( options ) {
            $.ajax({
                url : API_PREFIX + "rooms/" + this.get('_id') + '/join',
                dataType : 'json',
                type : 'put',
                success : function() {
                    this.trigger('joined');
                    if( options && _.isFunction( options.success ) ) {
                        options.success();
                    }
                    this.fetch();
                }.bind(this)
            });
        },

        leave: function( options ) {
            $.ajax({
                url : API_PREFIX + "rooms/" + this.get('_id') + '/leave',
                dataType : 'json',
                type : 'put',
                success : function() {
                    this.trigger('leaved');

                    if( options &&  _.isFunction( options.success ) ) {
                        options.success();
                    }

                    this.fetch();
                }.bind(this)
            });
        },

        subscribe: function() {
            this._connect(this.get("_id"));
        },

        isUserInRoom: function(user) {
            var players = this.get('players');

            if(!players) {
                throw "Not Initialized";
            }

            return players.indexOf(user.get("_id")) !== -1;
        },

        _handleUpdateMobs: function() {
          //  this._mobsCache = this.get('mobs');
        },

        _handleSocketMessage: function(event) {
            var packet = JSON.parse(event.data);
            if( packet ) {
                switch (packet.id) {
                    case "fillRoom": {
                        this._mobsCache.reset(packet.data);
                        this.set('mobs', this._mobsCache.toJSON());
                        break;
                    }
                    case "updateMobsData": {
                        this._mobsCache.add(packet.data, {merge: true});
                        this.set('mobs', this._mobsCache.toJSON());
                        break;
                    }
                    case "removeMob": {
                        console.log(packet);
                        this._mobsCache.remove({ id : packet.data });
                        this.trigger('removeMob');
                        this.set('mobs', this._mobsCache.toJSON());
                        break;
                    }
                    case "spawnMob" : {
                        this._mobsCache.add(packet.data);
                        this.trigger('spawnMob');
                        this.set('mobs', this._mobsCache.toJSON());
                        break;
                    }
                    case "UserBalanceUpdated": {
                        this.trigger('UserBalanceUpdated');
                        break;
                    }
                    case "updateRoom" : {
                        this._mobsCache.reset([]);
                        this.set('mobs', this._mobsCache.toJSON());
                        break;
                    }
                    case "error": {
                        this.trigger('ErrorMessage', packet.message);
                        break;
                    }
                }
            }
        },

        _connect: function(roomId) {
            if( this.socket ) {
                this.socket.close();
                this._mobsCache.reset([]);
                this.trigger('clear');
            }

            this.socket = new ReconnectingWebSocket("ws://test10.tests.onalone.com/rooms/" + roomId);
            this.socket.onmessage = this._handleSocketMessage;
            this.socket.onclose = this._handleClose;
            this.socket.onerror = this._handleError;
            this.socket.onopen = this._handleOpen;
        },

        _handleClose: function(event) {
            if (event.wasClean) {
                this._connectState = 'CLOSED';
                console.log('Соединение закрыто чисто');
            } else {
                this._connectState = 'BROKEN';
                console.log('Обрыв соединения');
            }
        },

        _handleError: function(error) {
            console.log("Ошибка ", error);
            this._connectState = 'ERROR';
        },

        _handleOpen: function() {
            this._connectState = 'CONNECTED';
        },

        click: function(mobId) {
            if( this._connectState === 'CONNECTED' ) {
                this.socket.send(JSON.stringify({ action : "clickMob", id : mobId }));
            }
        }
    });

    var RoomsCollection = Backbone.Collection.extend({
        url : API_PREFIX + "rooms",

        initialize : function() {

        },

        model : RoomModel
    });

    var UserModel = Backbone.Model.extend({
        url : API_PREFIX + "users",

        _auth : null,

        initialize : function() {
            _.bindAll(this,
                'isAuthenticated', 'isAuthenticatedAdmin', '_handleAuthStateChanged',
                'ban', 'unban', 'bootstrap');

            this.listenTo(this, 'change', this._handleAuthStateChanged);
        },

        isAuthenticated: function() {
            return this.get('auth');
        },

        isAuthenticatedAdmin: function() {
            return this.get('role') === 'admin';
        },

        _handleAuthStateChanged: function() {
            if( this.get("auth") !== this._auth ) {
                if( this.get("auth") ) {
                    this.trigger("on-login");
                } else {
                    this.trigger("on-logout");
                }
                this._auth = this.get("auth");
            }
        },

        ban : function() {
            $.ajax({
                url : this.url + "/" + this.get('_id') + '/ban',
                dataType : 'json',
                type : 'put',
                success : function() {
                    this.trigger('ban');
                    this.set('ban', true);
                }.bind(this)
            });
        },

        unban : function() {
            $.ajax({
                url : this.url + "/"  + this.get('_id') + '/unban',
                dataType : 'json',
                type : 'put',
                success : function() {
                    this.trigger('unban');
                    this.set('ban', false);
                }.bind(this)
            });
        },

        login: function(email, password) {
            $.ajax({
                url : '/login',
                type : 'post',
                data : {
                    email: email,
                    password: password
                },
                success : function(data) {
                    if( data.err ) {
                        return this.trigger('auth-error', data.err);
                    }
                    window.location.reload();
                }.bind(this)
            });
        },

        createUser: function(email, password) {
            $.ajax({
                url : '/signup',
                type : 'post',
                data : {
                    email: email,
                    password: password
                },
                success : function(data) {
                    if( data.err ) {
                        return this.trigger('auth-error', data.err);
                    }
                    window.location.reload();
                }.bind(this)
            });
        },

        bootstrap: function() {
            $.ajax({
                url : "/api/v1/bootstrap",
                dataType : 'json',
                type : 'get',
                success : function(data) {
                    this.set(data);
                    this.trigger('bootstrap');
                }.bind(this)
            });
        }
    });


    var TopCollection = Backbone.Collection.extend({
        url : API_PREFIX + "top"
    });

    var ModelAccounting = Backbone.Model.extend({
        initialize : function(options) {

            _.bindAll(this, 'reject', 'close');

            this.options = options;
        },

        reject : function() {
            $.ajax({
                url : this.url + "/" + this.get('_id') + '/reject',
                dataType : 'json',
                type : 'put',
                success : function() {
                    this.trigger('reject');
                    this.set('state', 'reject');
                }.bind(this)
            });
        },

        close : function() {
            $.ajax({
                url : this.url + "/"  + this.get('_id') + '/close',
                dataType : 'json',
                type : 'put',
                success : function() {
                    this.trigger('close');
                    this.set('state', 'close');
                }.bind(this)
            });
        }
    });

    var PayoutModel = ModelAccounting.extend({
        url : API_PREFIX + "payouts"
    });

    var InvoiceModel = Backbone.Model.extend({
        url : API_PREFIX + "invoices"
    });

    var UserHistoryModel = Backbone.Model.extend({
        url : API_PREFIX + "history"
    });

    var PayoutCollection = PaginatedCollection.extend({
        baseUrl : API_PREFIX + "payouts",
        model : PayoutModel
    });

    var InvoiceCollection = PaginatedCollection.extend({
        baseUrl : API_PREFIX + "invoices",
        model : InvoiceModel
    });

    var UserHistoryCollection = PaginatedCollection.extend({
        baseUrl : API_PREFIX + "history",
        model : UserHistoryModel
    });

    var UsersCollection = PaginatedCollection.extend({
        baseUrl : API_PREFIX + "users",
        model : UserModel
    });


    return {
        RoomModel: RoomModel,
        RoomsCollection: RoomsCollection,
        UserModel: UserModel,
        UsersCollection: UsersCollection,
        TopCollection: TopCollection,
        PayoutCollection: PayoutCollection,
        InvoiceCollection: InvoiceCollection,
        PayoutModel: PayoutModel,
        InvoiceModel: InvoiceModel,
        UserHistoryModel: UserHistoryModel,
        UserHistoryCollection: UserHistoryCollection
    };

}));