(function() {


    var WindowView = Backbone.View.extend({
        attributes : {
            "class" : "block-container"
        },

        initialize: function(options) {
            this.options = {
                width : 320,
                height : 200
            };
            _.extend(this.options, options || {});

            $(window).on('resize', this._handleResizeWindow);
            this._handleResizeWindow();
        },

        _handleResizeWindow: function() {
            switch (this.options.valign) {
                case "top":
                {
                    this.top = 0;
                    break;
                }
                case "bottom":
                {
                    this.top = window.innerHeight - this.options.height / 2;
                    break;
                }
                case "center":
                default:
                {
                    this.top = window.innerHeight / 2 - this.options.height / 2;
                    break;
                }
            }

            this.left = window.innerWidth / 2 - this.options.width / 2;

            this.$el.css({
                'width': this.options.width + 'px',
                'height': this.options.height + 'px',
                'top':  this.top + 'px',
                'left': this.left + 'px',
                'position': 'absolute',
                'z-index' : '1000'
            });
        }
    });

    var ViewsModule = {

        LoginBlockView : WindowView.extend({
            events: {
                "click a.link-need-account" : "_handleNeedAccountClick"
            },

            initialize: function(options) {
                this.__proto__.constructor.__super__.initialize.apply(this, arguments);

                _.bindAll(this, '_handleNeedAccountClick');

                this.template = _.template( $('#template-login-block').html() );

                this.render();
            },

            render: function() {
                this.$el.html( this.template({}) );
            },

            _handleNeedAccountClick: function(e) {
                e.preventDefault();
                this.trigger('sign')
            }
        }),

        SignBlockView : WindowView.extend({
            initialize: function(options) {
                this.__proto__.constructor.__super__.initialize.apply(this, arguments);

                this.template = _.template( $('#template-signup-block').html() );

                this.render();
            },

            render: function() {
                this.$el.html( this.template({}) );
            }
        }),


        RoomListView : Backbone.View.extend({
            attributes : {
                "class" : "block-container"
            },

            events: {
                "click .btn-players-top" : "_handleBtnPlayersTopClick",
                "click .btn-donate" : "_handleBtnDonateClick",
        //        "click .btn-exit" : "_handleBtnExitClick",
                "click .btn-room-join" : "_handleRoomEnterClick",
                "click .btn-room-leave" : "_handleRoomLeaveClick",
                "click .btn-room-continue" : "_handleRoomContinueClick"
            },

            initialize: function(options) {
                _.bindAll(this,
                    '_handleRoomsChange', '_handleBtnPlayersTopClick', '_handleBtnDonateClick',
                    '_handleBtnExitClick', '_handleRoomEnterClick', '_handleResizeWindow',
                    '_handleRoomLeaveClick', '_handleRoomContinueClick');

                this.width = 320;
                this.height = 400;

                this.options = options;

                this.template = _.template( $('#template-room-list-block').html() );

                this.collection.listenTo(this.collection, 'sync reset change add remove', this._handleRoomsChange);

                $(window).on('resize', this._handleResizeWindow);
                this._handleResizeWindow();

                this.render();
            },

            render: function() {
                var rooms = this.collection.toJSON().map(function(room) {
                    if( this.model.isAuthenticated() && room._id === this.model.get("currentRoom") ) {
                        _.extend(room, { _current : true })
                    }
                    return room;
                }.bind(this));

                this.$el.html( this.template({ rooms : rooms }) );
            },

            _handleResizeWindow: function() {
                this.top = window.innerHeight / 2 - this.height / 2;
                this.left = window.innerWidth / 2 - this.width / 2;

                this.$el.css({
                    'width': this.width + 'px',
                    'height': this.height + 'px',
                    'top':  this.top + 'px',
                    'left': this.left + 'px',
                    'position': 'absolute',
                    'z-index' : '1000'
                });
            },

            _handleRoomsChange: function() {
               this.render();
            },

            _handleBtnPlayersTopClick : function(e) {
                e.preventDefault();
            },

            _handleBtnDonateClick: function(e) {
                e.preventDefault();
            },

            _handleBtnExitClick: function(e) {
                e.preventDefault();
            },

            _handleRoomEnterClick: function(e) {
                e.preventDefault();
                var id = $(e.currentTarget).data('room-id');
                this.trigger('join-room', id);
            },

            _handleRoomLeaveClick: function(e) {
                e.preventDefault();
                var id = $(e.currentTarget).data('room-id');
                this.trigger('leave-room', id);
            },

            _handleRoomContinueClick: function(e) {
                e.preventDefault();
                var id = $(e.currentTarget).data('room-id');
                this.trigger('continue-room', id);
            }
        }),

        UserCardView : Backbone.View.extend({
            attributes : {
                "class" : "user-card"
            },

            events: {
                "click .btn-admin-settings" : "_handleClickAdminSettings",
                "click .btn-room-list" : "_handleClickRoomList",
                "click .btn-edit-name" : "_handleClickEditName"
            },

            initialize: function(options) {
                _.bindAll(this, '_handleUserChange', '_handleClickAdminSettings', '_handleClickRoomList', '_handleClickEditName');

                this.options = options;

                this.template = _.template( $('#template-user-card-block').html() );

                this.model.listenTo(this.model, 'change', this._handleUserChange);
            },

            render: function() {
                this.$el.html( this.template( { user : this.model.toJSON() } ) );

                this.$inputEditName = this.$el.find('.input-displayName');

                this.$inputEditName.hide();

                if( this.model.get('auth') ) {
                    this.$el.show();
                }
            },

            _handleUserChange: function() {
                this.render();
            },

            _handleClickAdminSettings: function(e) {
                e.preventDefault();

                this.trigger('click-admin-settings');
            },

            _handleClickRoomList: function(e) {
                e.preventDefault();

                this.trigger('click-room-list');
            },

            _handleClickEditName: function(e) {
                e.preventDefault();

                var $nameBlock = this.$el.find('.displayName'),
                    state = $nameBlock.data('state');

                if( !state ) {
                    this.$inputEditName.show();

                    $nameBlock.find('.btn-edit-name').removeClass('fa-edit');
                    $nameBlock.find('.btn-edit-name').addClass('fa-save');

                    $nameBlock.find('.btn-edit-name').removeClass('btn-success');
                    $nameBlock.find('.btn-edit-name').addClass('btn-danger');

                    $nameBlock.data('state', true);
                } else {

                    var _name = this.$inputEditName.val();

                    if( _name && _name.length >= 3 ) {

                        this.$inputEditName.hide();

                        $nameBlock.find('.btn-edit-name').removeClass('fa-save');
                        $nameBlock.find('.btn-edit-name').addClass('fa-edit');

                        $nameBlock.find('.btn-edit-name').removeClass('btn-danger');
                        $nameBlock.find('.btn-edit-name').addClass('btn-success');

                        $nameBlock.data('state', false);


                        this.model.save({
                            displayName : this.$inputEditName.val()
                        });
                    }
                }
            }
        }),

        RoomUserListView : Backbone.View.extend({
            attributes : {
                "class" : "room-user-list"
            },

            events: {},

            initialize: function(options) {
                _.bindAll(this, '_handleTopChange');

                this.options = options;

                this.template = _.template( $('#template-room-user-list-block').html() );

                this.model.listenTo(this.model, 'change:users', this._handleTopChange);
            },

            render: function() {
                this.$el.html( this.template({ room : this.collection.toJSON() }) );
            },

            _handleTopChange : function() {
                this.render();
            }
        }),

        AdminRoomView: Backbone.View.extend({
            attributes : {
                "class" : "block-container"
            },

            events: {
                "click .btn-save-room" : "_handleClickSaveRoom",
                "click .btn-spawn": "_handleClickSpawn"
            },

            initialize: function(options) {
                _.bindAll(this,
                    '_handleRoomChange', '_handleResizeWindow', '_handleClickSaveRoom',
                    '_handleClickSpawn');

                this.width = 320;
                this.height = 400;

                this.options = options;

                this.template = _.template( $('#template-room-admin-block').html() );

                $(window).on('resize', this._handleResizeWindow);
                this._handleResizeWindow();

                this.render();

                this.model.listenTo(this.model, 'change', this._handleRoomChange);
            },

            render: function() {
                this.$el.html( this.template({ room : this.model.toJSON() }) );
            },

            _handleResizeWindow: function() {
                this.top = window.innerHeight / 2 - this.height / 2;
                this.left = window.innerWidth / 2 - this.width / 2;

                this.$el.css({
                    'width': this.width + 'px',
                    'height': this.height + 'px',
                    'top':  this.top + 'px',
                    'left': this.left + 'px',
                    'position': 'absolute',
                    'z-index' : '1000'
                });
            },

            _handleRoomChange : function() {
                this.render();
            },

            _handleClickSaveRoom: function(e) {
                e.preventDefault();
                var data = this.$el.find('.form-room-settings').serializeArray(),
                    update = {};

                const _filter = {
                    "name" : function(v) { return v },
                    "complexity" : function(v) { return v },
                    "maxUsers" : function(v) { return parseInt(v) },
                    "maxMobs" : function(v) { return parseInt(v) },
                    "spawnSpeed" : function(v) { return parseFloat(v) },
                    "percent_profit" : function(v) { return parseFloat(v) },
                    "percent_null" : function(v) { return parseFloat(v) },
                    "percent_minus" : function(v) { return parseFloat(v) }
                };

                data.forEach(function(v) {
                    if(_.isFunction( _filter[v.name] ) ) {
                        update[v.name] = _filter[v.name](v.value);
                    }
                });

                this.model.save(update);
            },

            _handleClickSpawn: function(e) {
                e.preventDefault();

            }
        }),

        RoomView: Backbone.View.extend({
            attributes : {
                "class" : "block-container"
            },

            events: {
                "click .btn-room-join" : "_handleClickJoin",
                "click .btn-room-leave" : "_handleClickLeave"
            },

            initialize: function(options) {
                _.bindAll(this,
                    '_handleRoomChange', '_handleClickJoin', '_handleResizeWindow',
                    '_handleUserChange', '_handleClickLeave');

                this.width = 320;
                this.height = 100;

                this.options = options;

                this.userModel  = this.options.userModel;

                this.template = _.template( $('#template-room-block').html() );

                $(window).on('resize', this._handleResizeWindow);
                this._handleResizeWindow();

                this.render();

                this.model.listenTo(this.model, 'reset change', this._handleRoomChange);
                this.userModel.listenTo(this.userModel, 'reset change', this._handleUserChange);
            },

            render: function() {
                var model = this.model.toJSON(),
                    userid = this.userModel.get('_id');

                if( model.players && userid && model.players.indexOf(userid) !== -1 ) {
                    _.extend(model, { _current : true })
                }

                this.$el.html( this.template({ room : model }) );
            },

            _handleRoomChange : function() {
                this.render();
            },

            _handleUserChange : function() {
                this.render();
            },

            _handleClickJoin: function(e) {
                e.preventDefault();

                this.model.join();
            },

            _handleClickLeave: function(e) {
                e.preventDefault();

                this.model.leave();
            },

            _handleResizeWindow: function() {

                switch (this.options.valign) {
                    case "top":
                    {
                        this.top = 0;
                        break;
                    }
                    case "center":
                    default:
                    {
                        this.top = window.innerHeight / 2 - this.height / 2;
                        break;
                    }
                }

                this.left = window.innerWidth / 2 - this.width / 2;

                this.$el.css({
                    'width': this.width + 'px',
                    'height': this.height + 'px',
                    'top':  this.top + 'px',
                    'left': this.left + 'px',
                    'position': 'absolute',
                    'z-index' : '1000'
                });
            }
        }),

        NotifyView: Backbone.View.extend({

            attributes : {
                "class" : "notifications bottom-right"
            },

            events: {

            },

            initialize: function(options) {
                _.bindAll(this, '_notify');

                this.collection.listenTo(this.collection, 'add', this._notify);
            },

            _notify: function( message ) {
                this.$el.notify(message.toJSON()).show(); // for the ones that aren't closable and don't fade out there is a .hide() function.

                this.collection.reset([]);
            }
        })
    };

    window.ViewsModule = ViewsModule;
})();