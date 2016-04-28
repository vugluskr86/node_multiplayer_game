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
        _filter : {
            data : {}
        },
        initialize: function(options) {
            _.bindAll(this, 'parse', 'url', 'pageInfo', 'nextPage', 'previousPage', 'setFilter');
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
            _.extend(_opt, this._filter);
            _.extend(_opt, options || {});
            if (!this.pageInfo().next) {
                return false;
            }
            this.page = this.page + 1;
            return this.fetch(_opt);
        },
        previousPage: function(options) {
            var _opt = { reset : true };
            _.extend(_opt, this._filter);
            _.extend(_opt, options || {});

            if (!this.pageInfo().prev) {
                return false;
            }
            this.page = this.page - 1;
            return this.fetch(_opt);
        },
        setFilter:function (options) {
            this._filter = options;
        }
    });

    var MobModel = Backbone.Model.extend({

        initialize: function() {
            _.bindAll(this, '_calc', '_update');
        },

        _calc : function(dt) {
            var physic = this.toJSON();

         //   console.log(dt)

            this.set('x', physic.center.x + Math.sin(physic.life) * physic.r_x * Math.sin(physic.life), {silent: true});
            this.set('y', physic.center.y + Math.cos(physic.life) * physic.r_y * Math.sin(physic.life), {silent: true});

            this.set('life', this.get('life') + (dt / 1000 * physic.speed));
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
        url : function() {

            if(this.isNew()) {
                return API_PREFIX + "rooms";
            }

            return API_PREFIX + "rooms/" + this.id;
        },

        mobs : new MobsCollection(),

        _connectState : 'DISCONNECTED',

        initialize : function() {
            _.bindAll(this, 'subscribe', 'join', 'leave', 'click', '_connect',
                '_handleSocketMessage', '_handleClose', '_handleError', '_handleOpen');
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

        subscribe: function(roomId) {
            this._connect(roomId);
        },

        _handleSocketMessage: function(event) {
            var packet = JSON.parse(event.data);
            if( packet ) {
                switch (packet.id) {
                    case "fillRoom": {
                        this.mobs.add(packet.data.options, { silent : true });
                        this.mobs.add(packet.data.data, { silent : true });
                        this.trigger('fillRoom');
                        break;
                    }
                    case "updateMobsData": {
                        this.mobs.add(packet.data, {merge: true});
                        this.trigger('updateMobsData');
                        break;
                    }
                    case "removeMob": {
                        this.mobs.remove({ id : packet.data });
                        this.set('mobs', this.get('mobs') - 1);
                        this.trigger('removeMob');
                        break;
                    }
                    case "spawnMob" : {
                        var mobData = _.clone(packet.data.options);
                        _.extend(mobData, packet.data.data);
                        this.mobs.add(mobData);
                        this.set('mobs', this.get('mobs') + 1);
                        this.trigger('spawnMob');
                        break;
                    }
                    case "UserBalanceUpdated": {
                        this.trigger('UserBalanceUpdated');
                        break;
                    }
                    case "error": {
                        //console.log(packet)
                        this.trigger('ErrorMessage', packet.message);
                        break;
                    }
                }
            }
        },

        _connect: function(roomId) {
            if( this.socket ) {
                this.socket.close();
                this.mobs.reset([]);
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
            _.bindAll(this, 'isAuthenticated', 'isAuthenticatedAdmin', '_handleAuthStateChanged', 'ban', 'unban');
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