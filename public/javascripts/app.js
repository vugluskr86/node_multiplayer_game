(function() {

    var App = {

        views : {

        },

        _viewsCache : [],

        initialize : function() {
            _.bindAll(this,
                '_handleUserLogOut', '_handleUserLogin', '_handleClickShowAdmin',
                '_addView');

            this.$el = $('div.info-block-container');

            // Models
            this.currentUser = new window.DataModule.UserModel();
            this.currentRoom = new window.DataModule.RoomModel({
                id : "571526540e1ea4be02c7683e"
            });
            this.notifyCollection = new Backbone.Collection();

            this.topCollection = new window.DataModule.TopCollection();

            this.topCollection.fetch({ reset : true });

            this.currentUser.listenTo(this.currentUser, 'on-login', this._handleUserLogin);
            this.currentUser.listenTo(this.currentUser, 'on-logout', this._handleUserLogOut);

            this.currentUser.listenTo(this.currentUser, 'change', function(){
                this.topCollection.fetch({ reset : true });
            }.bind(this));


            // Game Field
            this.views.gameFieldView = new window.GameModule.GameFieldView({
                model : this.currentRoom
            });
            $('.game-field-container').append(this.views.gameFieldView.$el);


            // User Panel
            this.views.userCardView = new window.ViewsModule.UserCardView({
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
            this.views.userCardView.listenTo(this.views.userCardView, 'click-room-list', this._handleClickRoomList);


            this.views.topView = new window.ViewsModule.TopView({
                collection : this.topCollection,
                valign : 'top',
                align : 'right',
                margin : 4,
                width : 160,
                height : 240
            });


            this.views.signInView = new window.ViewsModule.LoginBlockView({});
            this.views.signUpView = new window.ViewsModule.SignBlockView({});

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


            this.views.adminView = new window.ViewsModule.AdminPage({
                model : this.currentRoom,
                valign : 'center',
                align : 'center',
                margin : 4,
                width : 640,
                height : 480
            });
/*
            this.views.adminRoom = new window.ViewsModule.AdminRoomView({
                model : this.currentRoom
            });
*/
            this.views.joinRoomView = new window.ViewsModule.RoomView({
                model : this.currentRoom,
                userModel : this.currentUser,
                valign : 'center'
            });

            this.views.leaveRoomView = new window.ViewsModule.RoomView({
                model : this.currentRoom,
                userModel : this.currentUser,
                valign : 'top'
            });

            this.views.joinRoomView.$el.hide();
            this.views.leaveRoomView.$el.hide();

            this.$el.append(this.views.joinRoomView.$el);
            this.$el.append(this.views.leaveRoomView.$el);
            this.$el.append(this.views.adminView.$el);

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

            this.views.notifyView = new window.ViewsModule.NotifyView({
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
                    this.currentRoom.fetch();
                }.bind(this)
            });
        },


        _addView: function(_constructor, options) {
            var _view = new _constructor(options);

            this._viewsCache.push( _view );
        },

        _handleUserLogOut: function() {
            this.views.signInView.$el.show();
        },

        _handleUserLogin: function() {
            this.views.topView.$el.show();
            this.views.userCardView.$el.show();
          //  this.views.roomListView.$el.show();
        },

        _handleClickShowAdmin: function() {
            this.views.adminView.$el.show();
        }
    };

    window.App = App;
})();

$(document).ready(function () {
    console.log("ready!");

    window.App.initialize();
});