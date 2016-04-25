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
        require('./game')
    );

}(this, function (root, Module, _, $, Backbone, DataModule, ViewsModule, GameModule) {
    'use strict';

    var App = {

        views : {},

        initialize : function() {
            _.bindAll(this,
                '_handleUserLogOut', '_handleUserLogin', '_handleClickShowAdmin',
                '_handleClickPayout', '_handleClickInvoice', '_handleClickDonate');

            console.log("initialize")

            this.$el = $('div.info-block-container');

            var CurrentUserModel = DataModule.UserModel.extend({
                url : "/api/v1/bootstrap"
            });

            // Models
            this.currentUser = new CurrentUserModel();
            this.currentRoom = new DataModule.RoomModel({
                id : "571526540e1ea4be02c7683e"
            });
            this.notifyCollection = new Backbone.Collection();

            this.topCollection = new DataModule.TopCollection();

            this.topCollection.fetch({ reset : true });

            this.currentUser.listenTo(this.currentUser, 'on-login', this._handleUserLogin);
            this.currentUser.listenTo(this.currentUser, 'on-logout', this._handleUserLogOut);

            this.currentUser.listenTo(this.currentUser, 'change', function(){
                this.topCollection.fetch({ reset : true });
            }.bind(this));

            // filtered
            this.payouts = new DataModule.PayoutCollection();
            this.invoices = new DataModule.InvoiceCollection();
            this.history = new DataModule.UserHistoryCollection();

            this.adminPayouts = new DataModule.PayoutCollection();
            this.adminInvoices = new DataModule.InvoiceCollection();
            this.adminUsers = new DataModule.UsersCollection();

            // Game Field
            this.views.gameFieldView = new GameModule.GameFieldView({
                model : this.currentRoom
            });
            $('.game-field-container').append(this.views.gameFieldView.$el);

            // User Panel
            this.views.userCardView = new ViewsModule.UserCardView({
                model :  this.currentUser,
                valign : 'top',
                align : 'left',
                margin : 4,
                width : 160,
                height : 240
            });

            this.views.userCardView.$el.hide();

            this.$el.append(this.views.userCardView.$el);

            this.views.userCardView.listenTo(this.views.userCardView, 'click-admin-settings', this._handleClickShowAdmin);
            this.views.userCardView.listenTo(this.views.userCardView, 'click-invoice', this._handleClickInvoice);
            this.views.userCardView.listenTo(this.views.userCardView, 'click-payout', this._handleClickPayout);

            this.views.topView = new ViewsModule.TopView({
                collection : this.topCollection,
                valign : 'top',
                align : 'right',
                margin : 4,
                width : 160,
                height : 240
            });

            this.views.signInView = new ViewsModule.LoginBlockView({});
            this.views.signUpView = new ViewsModule.SignBlockView({});

            this.views.signInView.$el.hide();
            this.views.signUpView.$el.hide();
            this.views.topView.$el.hide();

            this.$el.append(this.views.signInView.$el);
            this.$el.append(this.views.signUpView.$el);
            this.$el.append(this.views.topView.$el);

            this.views.signInView.listenTo(this.views.signInView, 'sign', function(){
                this.views.signInView.$el.hide();
                this.views.signUpView.$el.show();
            }.bind(this));

            this.views.adminView = new ViewsModule.AdminPage({
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

            this.views.profileView = new ViewsModule.ProfilePage({
                model : this.currentUser,
                valign : 'center',
                align : 'center',
                margin : 4,
                width : 640,
                height : 480,
                payouts : this.payouts,
                invoices : this.invoices,
                history : this.history
            });

            this.views.joinRoomView = new ViewsModule.RoomView({
                model : this.currentRoom,
                userModel : this.currentUser,
                valign : 'center',
                align : 'center',
                margin : 4,
                width : 242,
                height : 100
            });

            this.views.leaveRoomView = new ViewsModule.RoomView({
                model : this.currentRoom,
                userModel : this.currentUser,
                valign : 'top',
                align : 'center',
                margin : 4,
                width : 242,
                height : 100
            });

            this.views.joinRoomView.listenTo(this.views.joinRoomView, 'click-donate', this._handleClickDonate);
            this.views.leaveRoomView.listenTo(this.views.leaveRoomView, 'click-donate', this._handleClickDonate);

            this.views.joinRoomView.$el.hide();
            this.views.leaveRoomView.$el.hide();
            this.views.profileView.$el.hide();

            this.$el.append(this.views.joinRoomView.$el);
            this.$el.append(this.views.leaveRoomView.$el);
            this.$el.append(this.views.adminView.$el);
            this.$el.append(this.views.profileView.$el);


            this.views.adminView.$el.hide();

            this.currentRoom.listenTo(this.currentRoom, 'change:players', function() {
                var userid = this.currentUser.get('_id');
                if( userid ) {
                    this.currentRoom.subscribe('571526540e1ea4be02c7683e');
                    if( this.currentRoom.get('players').indexOf(userid) !== -1  ) {
                        this.views.leaveRoomView.$el.show();
                        this.views.joinRoomView.$el.hide();
                    } else {
                        this.views.joinRoomView.$el.show();
                        this.views.leaveRoomView.$el.hide();
                    }
                }
            }.bind(this));

            this.views.notifyView = new ViewsModule.NotifyView({
                collection : this.notifyCollection
            });

            $('body').append(this.views.notifyView.$el);

            this.currentRoom.listenTo(this.currentRoom, 'UserBalanceUpdated', function() {
                this.currentUser.fetch();
            }.bind(this));

            this.currentRoom.listenTo(this.currentRoom, 'spawnMob', function() {
                this.notifyCollection.add({ message: { text: 'Появилась новая фигура' } });
            }.bind(this));

            this.currentRoom.listenTo(this.currentRoom, 'removeMob', function() {
                this.notifyCollection.add({ message: { text: 'Фигура удалена' } });
            }.bind(this));

            this.currentRoom.listenTo(this.currentRoom, 'ErrorMessage', function(message) {
                var _errDictionary = {
                    "NotMoney" : "Не хватает денег, пополните ваш баланс!"
                };
                var _msg = _errDictionary[message];
                this.notifyCollection.add({ message: { text: _msg === undefined ? message : _msg }, type : 'danger' });
            }.bind(this));

            this.currentUser.fetch({
                success : function() {

                    this.payouts.setFilter({data : { filter_userid : this.currentUser.get("_id") }});
                    this.invoices.setFilter({data : { filter_userid : this.currentUser.get("_id") }});
                    this.history.setFilter({data : { filter_userid : this.currentUser.get("_id") }});

                    this.currentRoom.fetch();
                }.bind(this)
            });
        },

        _handleUserLogOut: function() {
            this.views.signInView.$el.show();
        },

        _handleUserLogin: function() {
            this.views.topView.$el.show();
            this.views.userCardView.$el.show();
        },

        _handleClickShowAdmin: function() {
            this.views.adminView.$el.show();

            this.adminPayouts.fetch({ reset : true });
            this.adminInvoices.fetch({ reset : true });
            this.adminUsers.fetch({ reset : true });
        },

        _handleClickInvoice: function() {
            this.views.profileView.$el.show();

            this.payouts.fetch({ reset : true });
            this.invoices.fetch({ reset : true });
            this.history.fetch({ reset : true });
        },

        _handleClickPayout:function() {
            this.views.profileView.$el.show();

            this.payouts.fetch({ data : { filter_userid : this.currentUser.get("_id") }, reset : true });
            this.invoices.fetch({ data : { filter_userid : this.currentUser.get("_id") }, reset : true });
            this.history.fetch({ data : { filter_userid : this.currentUser.get("_id") }, reset : true });
        },

        _handleClickDonate: function() {
            this.views.profileView.$el.show();

            this.payouts.fetch({ data : { filter_userid : this.currentUser.get("_id") }, reset : true });
            this.invoices.fetch({ data : { filter_userid : this.currentUser.get("_id") }, reset : true });
            this.history.fetch({ data : { filter_userid : this.currentUser.get("_id") }, reset : true });
        }
    };

    return App;
}));
