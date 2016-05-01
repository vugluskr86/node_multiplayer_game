(function (root, factory) {
    'use strict';

    module.exports = factory(
        root,
        exports,
        require('underscore'),
        require('jquery'),
        require('backbone'),
        require('./models'),
        require('./views'),
        require('./game'),
        require('./sounds'),
        require('easeljs-loader!./libs/soundjs-0.6.2.combined.js')
    );

}(this, function (root, Module, _, $, Backbone, DataModule, ViewsModule, GameModule, SoundManager) {
    'use strict';

    const DEFAULT_ROOM_ID = "571526540e1ea4be02c7683e";

    var App = {

        initialize : function() {

            _.bindAll(this, '_handleUserAuthChanged', '_appendUI', '_handleChangeRoom', '_makeNotify');

            SoundManager.initialize();

            this.$el = $('div.info-block-container');

            this.user = new DataModule.UserModel();
            this.user.on('change:auth', this._handleUserAuthChanged);

            this.user.listenTo(this.user, 'auth-error', function(error) {
                var _errDictionary = {
                    "UserNotFound" : "Пользователь c указанным email не найден! Зарегистрируйтесь чтобы войти!",
                    "InvalidPassword" : "Неверный пароль или email",
                    "AlreadyTaken" : "Пользователь c указанным email уже зарегистрирован!"
                };
                var _msg = _errDictionary[error];
                this._makeNotify({ message: _msg === undefined ? "Ошибка при аутентификации!" : _msg, type : 'danger' });
            }.bind(this));

            this.user.bootstrap();
        },

        _appendUI: function($el) {
            this.$el.append($el);
        },

        _makeNotify: function(message) {
            if( this.notifyCollection ) {
                this.notifyCollection.add(message);
            }
        },

        _handleUserAuthChanged: function() {
            console.log("_handleUserAuthChanged", this.user.toJSON());

            if( !this.notifyCollection )
            {
                this.notifyCollection = new Backbone.Collection();

                this.notifyView = new ViewsModule.NotifyView({
                    collection : this.notifyCollection
                });
            }

            if( this.user.isAuthenticated() ) {

                if( !this.userCardView ) {

                    this.userCardView = new ViewsModule.UserCardView({
                        model :  this.user,
                        valign : 'top',
                        align : 'left',
                        margin : 4,
                        width : 160,
                        height : 240
                    });

                    this._appendUI(this.userCardView.$el);

                    this.userCardView.listenTo(this.userCardView, 'click-invoice click-payout', function() {
                        if( this.profileView ) {

                            this.payouts.fetch({ reset : true });
                            this.invoices.fetch({ reset : true });
                            this.history.fetch({ reset : true });

                            this.profileView.show();
                        }
                    }.bind(this));

                    if( this.user.isAuthenticatedAdmin() ) {
                        this.userCardView.listenTo(this.userCardView, 'click-admin-settings', function() {
                            if( this.adminView ) {

                                this.adminPayouts.fetch({ reset : true });
                                this.adminInvoices.fetch({ reset : true });
                                this.adminUsers.fetch({ reset : true });

                                this.adminView.show();
                            }
                        }.bind(this));
                    }
                }

                if( !this.profileView ) {

                    var PayoutCollection = DataModule.PayoutCollection.extend({
                        filter : { userid : this.user.get("_id") }
                    });

                    var InvoiceCollection = DataModule.InvoiceCollection.extend({
                        filter : { userid : this.user.get("_id") }
                    });

                    var UserHistoryCollection = DataModule.UserHistoryCollection.extend({
                        filter : { userid : this.user.get("_id") }
                    });

                    this.payouts = new PayoutCollection();
                    this.invoices = new InvoiceCollection();
                    this.history = new UserHistoryCollection();

                    this.profileView = new ViewsModule.ProfilePage({
                        model : this.user,
                        valign : 'center',
                        align : 'center',
                        margin : 4,
                        width : 640,
                        height : 480,
                        payouts : this.payouts,
                        invoices : this.invoices,
                        history : this.history
                    });

                    this._appendUI(this.profileView.$el);
                    this.profileView.hide();
                }

                if( !this.currentRoom ) {
                    this.currentRoom = new DataModule.RoomModel({ _id : DEFAULT_ROOM_ID });

                    if(!this.gameFieldView) {
                        this.gameFieldView = new GameModule.GameFieldView({
                            model : this.currentRoom
                        });

                        $('.game-field-container').append(this.gameFieldView.$el);
                    }

                    this.currentRoom.listenTo(this.currentRoom, 'change:players', this._handleChangeRoom);

                    this.currentRoom.listenTo(this.currentRoom, 'UserBalanceUpdated', function() {
                        this.user.fetch();
                    }.bind(this));

                    this.currentRoom.listenTo(this.currentRoom, 'spawnMob', function() {
                        this._makeNotify({ message: 'Появилась новая фигура' });
                        SoundManager.playSound("mobAdd");
                    }.bind(this));

                    this.currentRoom.listenTo(this.currentRoom, 'removeMob', function() {
                        this._makeNotify({ message: 'Фигура удалена' });
                        SoundManager.playSound("mobRemove");
                    }.bind(this));

                    this.currentRoom.listenTo(this.currentRoom, 'ErrorMessage', function(message) {
                        var _errDictionary = {
                            "NotMoney" : "Не хватает денег, пополните ваш баланс!",
                            "NotInRoom" : "Для того чтобы войти в комнату, нажмите `Играть`"
                        };
                        var _msg = _errDictionary[message];
                        this._makeNotify({ message: _msg === undefined ? message : _msg, type : 'danger' });
                    }.bind(this));
                }

                if( this.user.isAuthenticatedAdmin() && !this.adminView ) {

                    this.adminPayouts = new DataModule.PayoutCollection();
                    this.adminInvoices = new DataModule.InvoiceCollection();
                    this.adminUsers = new DataModule.UsersCollection();

                    this.adminView = new ViewsModule.AdminPage({
                        model : this.currentRoom,
                        valign : 'center',
                        align : 'center',
                        margin : 4,
                        width : 640,
                        height : 480,
                        payouts : this.adminPayouts,
                        invoices : this.adminInvoices,
                        users : this.adminUsers
                    });

                    this._appendUI(this.adminView.$el);
                    this.adminView.hide();
                }

                if( !this.joinRoomView ) {
                    this.joinRoomView = new ViewsModule.RoomView({
                        model : this.currentRoom,
                        userModel : this.user,
                        valign : 'center',
                        align : 'center',
                        margin : 4,
                        width : 242,
                        height : 100
                    });
                    this._appendUI(this.joinRoomView.$el);
                    this.joinRoomView.hide();

                    this.joinRoomView.listenTo(this.joinRoomView, 'click-donate', function() {
                        this.profileView.show();
                    }.bind(this));
                }

                if( !this.leaveRoomView ) {
                    this.leaveRoomView = new ViewsModule.RoomView({
                        model : this.currentRoom,
                        userModel : this.user,
                        valign : 'top',
                        align : 'center',
                        margin : 4,
                        width : 242,
                        height : 100
                    });
                    this._appendUI(this.leaveRoomView.$el);
                    this.leaveRoomView.hide();

                    this.leaveRoomView.listenTo(this.leaveRoomView, 'click-donate', function() {
                        this.profileView.show();
                    }.bind(this))
                }

                if( !this.topCollection ) {
                    this.topCollection = new DataModule.TopCollection();

                    this.topView = new ViewsModule.TopView({
                        collection : this.topCollection,
                        valign : 'top',
                        align : 'right',
                        margin : 4,
                        width : 160,
                        height : 240
                    });

                    this._appendUI(this.topView.$el);
                    this.topView.hide();

                    this.topCollection.listenTo(this.topCollection, 'reset change', function(){
                        this.topView.show();
                    }.bind(this));
                }

                this.currentRoom.subscribe();
                this.currentRoom.fetch();
                this.topCollection.fetch({ reset : true });

            } else {

                if(!this.signInView) {
                    this.signInView = new ViewsModule.LoginBlockView({
                        model : this.user
                    });
                    this._appendUI(this.signInView.$el);
                    this.signInView.show();

                    this.signInView.listenTo(this.signInView, 'sign', function(){
                        this.signInView.hide();
                        this.signUpView.show();
                    }.bind(this));
                }

                if(!this.signUpView) {
                    this.signUpView = new ViewsModule.SignBlockView({
                        model : this.user
                    });
                    this._appendUI(this.signUpView.$el);
                    this.signUpView.hide();
                    this.signUpView.listenTo(this.signUpView, 'login', function(){
                        this.signUpView.hide();
                        this.signInView.show();
                    }.bind(this));
                }
            }
        },

        _handleChangeRoom: function() {
            console.log("_handleChangeRoom", this.currentRoom.toJSON());

            if( this.currentRoom.isUserInRoom(this.user) ) {
                this.leaveRoomView.show();
                this.joinRoomView.hide();
            } else {
                this.joinRoomView.show();
                this.leaveRoomView.hide();
            }
        }
    };

    return App;
}));
