(function() {

    // TODO
    // API Http ( REST )
    // Коллекция комнат /api/v1/rooms
    // Модель комнаты   /api/v1/room/:id
    // Модель игрока    /api/v1/user, /api/v1/user/:id
    // Коллекция топа   /api/v1/top/:id

    const API_PREFIX = "/api/v1/";

    var MobModel = Backbone.Model.extend({
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
                '_handleSocketMessage', '_handleClose', '_handleError', '_handleOpen', '_retryConnect');
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
                }
            }
        },

        _connect: function(roomId) {
            if( this.socket ) {
                this.socket.close();

                this.mobs.reset([]);

                this.trigger('clear');
            }

            this.socket = new WebSocket("ws://test10.tests.onalone.com//rooms/" + roomId);
            this.socket.onmessage = this._handleSocketMessage;
            this.socket.onclose = this._handleClose;
            this.socket.onerror = this._handleError;
            this.socket.onopen = this._handleOpen;
        },

        _handleClose: function(event) {
            if( this._connectState === 'RECONNECT' ) {

            } else {
                if (event.wasClean) {
                    this._connectState = 'CLOSED';
                    console.log('Соединение закрыто чисто');
                } else {
                    this._connectState = 'BROKEN';
                    console.log('Обрыв соединения');
                }
                console.log('Код: ' + event.code + ' причина: ' + event.reason)
                this._retryConnect();
            }

        },

        _handleError: function(error) {
            console.log("Ошибка " + error.message);
            this._connectState = 'ERROR';
        },

        _handleOpen: function() {
            this._connectState = 'CONNECTED';
        },

        _retryConnect: function() {
            this._connectState = 'RECONNECT';
            this._retryInterval = setInterval(function() {
                if( this._connectState === 'CONNECTED' ) {
                    clearInterval(this._retryInterval);
                } else {
                   // this._connect();
                }
            }.bind(this), 1000);
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
            _.bindAll(this, 'isAuthenticated', 'isAuthenticatedAdmin', '_handleAuthStateChanged');
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
        }
    });

    var UsersCollection = Backbone.Collection.extend({
        initialize : function() {

        }
    });

    window.DataModule = {
        RoomModel : RoomModel,
        RoomsCollection : RoomsCollection,
        UserModel : UserModel,
        UsersCollection : UsersCollection
    };
})();