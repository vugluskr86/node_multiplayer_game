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

            this.currentUser.listenTo(this.currentUser, 'on-login', this._handleUserLogin);
            this.currentUser.listenTo(this.currentUser, 'on-logout', this._handleUserLogOut);


            // Game Field
            this.views.gameFieldView = new window.GameModule.GameFieldView({
                model : this.currentRoom
            });
            $('.game-field-container').append(this.views.gameFieldView.$el);


            // User Panel
            this.views.userCardView = new window.ViewsModule.UserCardView({
                model :  this.currentUser
            });
            this.views.userCardView.$el.hide();
            $('.hud-ui').append(this.views.userCardView.$el);
            this.views.userCardView.listenTo(this.views.userCardView, 'click-admin-settings', this._handleClickShowAdmin);
            this.views.userCardView.listenTo(this.views.userCardView, 'click-room-list', this._handleClickRoomList);



            this.views.signInView = new window.ViewsModule.LoginBlockView({});
            this.views.signUpView = new window.ViewsModule.SignBlockView({});

            this.views.signInView.$el.hide();
            this.views.signUpView.$el.hide();

            this.$el.append(this.views.signInView.$el);
            this.$el.append(this.views.signUpView.$el);


            this.views.signInView.listenTo(this.views.signInView, 'sign', function(){
                this.views.signInView.$el.hide();
                this.views.signUpView.$el.show();
            }.bind(this));



            this.views.adminRoom = new window.ViewsModule.AdminRoomView({
                model : this.currentRoom
            });

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
            this.$el.append(this.views.adminRoom.$el);

            this.views.adminRoom.$el.hide();

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
          //  this.views.roomListView.$el.show();
        },

        _handleClickShowAdmin: function() {
            this.views.adminRoom.$el.show();
        }
    };

    window.App = App;
})();

$(document).ready(function () {
    console.log("ready!");

    window.App.initialize();
});