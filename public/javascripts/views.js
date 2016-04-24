(function() {


    var Table =  Backbone.View.extend({
        attributes : {
            "class" : "table"
        },
        elName : "table",

        initialize: function(options) {
            this.template = _.template( $('#template-table-view').html() );

            this.options = {
                head : [],
                foot : []
            };

            _.extend(this.options, options);

            this.render();
        },

        render: function() {
            var data = _.clone(this.options);

            this.$el.html(this.template(data));
        }
    });



    var WindowView = Backbone.View.extend({
        attributes : {
            "class" : "block-container"
        },

        initialize: function(options) {

            _.bindAll(this, '_handleResizeWindow');

            this.options = {
                width : 320,
                height : 200,
                margin : 0
            };
            _.extend(this.options, options || {});


            $(window).on('resize', this._handleResizeWindow.bind(this));
            this._handleResizeWindow();
        },

        _handleResizeWindow: function() {
            switch (this.options.valign) {
                case "top":
                {
                    this.top = this.options.margin;
                    break;
                }
                case "bottom":
                {
                    this.top = window.innerHeight - this.options.height - this.options.margin;
                    break;
                }
                case "center":
                default:
                {
                    this.top = (window.innerHeight / 2) - (this.options.height / 2);
                    break;
                }
            }

            switch (this.options.align) {
                case "left":
                {
                    this.top = this.options.margin;
                    break;
                }
                case "right":
                {
                    this.left = window.innerWidth - this.options.width - this.options.margin;
                    break;
                }
                case "center":
                default:
                {
                    this.left = window.innerWidth / 2 - this.options.width / 2;
                    break;
                }
            }

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

                _.bindAll(this, '_handleNeedAccountClick', 'render');

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

                _.bindAll(this, 'render');

                this.template = _.template( $('#template-signup-block').html() );

                this.render();
            },

            render: function() {
                this.$el.html( this.template({}) );
            }
        }),

        UserCardView : WindowView.extend({
            attributes : {
                "class" : "block-container user-card"
            },

            events: {
                "click .btn-admin-settings" : "_handleClickAdminSettings",
                "click .btn-room-list" : "_handleClickRoomList",
                "click .btn-edit-name" : "_handleClickEditName"
            },

            initialize: function(options) {
                this.__proto__.constructor.__super__.initialize.apply(this, arguments);

                _.bindAll(this, '_handleUserChange', '_handleClickAdminSettings', '_handleClickRoomList', '_handleClickEditName');

                this.options = options;

                this.template = _.template( $('#template-user-card-block').html() );

                this.model.listenTo(this.model, 'change', this._handleUserChange);
            },

            render: function() {
                this.$el.html( this.template( { user : this.model.toJSON() } ) );

                this.$inputEditName = this.$el.find('.input-displayName');
                this.$inputEditName.hide();
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

                    this.$inputEditName.hide();

                    $nameBlock.find('.btn-edit-name').removeClass('fa-save');
                    $nameBlock.find('.btn-edit-name').addClass('fa-edit');

                    $nameBlock.find('.btn-edit-name').removeClass('btn-danger');
                    $nameBlock.find('.btn-edit-name').addClass('btn-success');

                    $nameBlock.data('state', false);

                    if( _name && _name.length >= 3 ) {
                        this.model.save({
                            displayName : this.$inputEditName.val()
                        });
                    }
                }
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
        }),

        TopView : WindowView.extend({

            attributes: {
                "class" : "room-user-list block-container"
            },

            initialize: function(options) {
                this.__proto__.constructor.__super__.initialize.apply(this, arguments);

                console.log(options)

                _.bindAll(this, 'render');

                this.template = _.template( $('#template-top-view').html() );

                this.collection.listenTo(this.collection, 'reset', this.render);

                this.render();
            },

            render: function() {
                this.$el.html( this.template({ users : this.collection.toJSON() }) );
            }
        }),

        AdminPage: WindowView.extend({

            invoices : new Backbone.Collection(),
            payouts : new Backbone.Collection(),
            users : new Backbone.Collection(),

            initialize: function(options) {
                this.__proto__.constructor.__super__.initialize.apply(this, arguments);

                _.bindAll(this, 'render');

                this.template = _.template( $('#template-admin-page-view').html() );

                if( options.invoices ) { this.invoices = options.invoices; }
                if( options.payouts ) { this.payouts = options.payouts; }
                if( options.users ) { this.users = options.users; }

                this.invoicePage = new Table({
                    head : ["Время", "Игрок", "Сумма", "Состояние", "Действия"],
                    collection : this.invoices
                });

                this.payoutPage = new Table({
                    head : ["Время", "Игрок", "Сумма", "Состояние", "Действия"],
                    collection : this.payouts
                });

                this.usersPage = new Table({
                    head : ["Имя", "Аватар", "Профиль", "Баланс", "Действия"],
                    collection : this.users
                });

                this.invoices.listenTo(this.invoices, 'reset change', this.render);
                this.payouts.listenTo(this.payouts, 'reset change', this.render);
                this.users.listenTo(this.users, 'reset change', this.render);

                this.render();
            },

            render: function() {

                this.$el.html( this.template({}) );

                this.$el.find('div#invoices div.container').append( this.invoicePage.$el );
                this.$el.find('div#payouts div.container').append( this.payoutPage.$el );
                this.$el.find('div#users div.container').append( this.usersPage.$el );

                return this
            }
        })
    };

    window.ViewsModule = ViewsModule;
})();