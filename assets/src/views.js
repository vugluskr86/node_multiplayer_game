(function (root, factory) {
    'use strict';

    module.exports = factory(
        root,
        exports,
        require('underscore'),
        require('jquery'),
        require('backbone'),
        require('bootstrap-notify')
    );

}(this, function (root, Module, _, $, Backbone) {
    'use strict';

    var Table =  Backbone.View.extend({

        attributes : {
            "class" : "table"
        },

        elName : "table",

        events: {
            'click a.prev': 'previous',
            'click a.next': 'next',
            'click .btn-action' : '_clickActionButton'
        },

        initialize: function(options) {
            this.template = _.template( $('#template-table-view').html() );

            _.bindAll(this, 'render', '_filterRow', 'previous', 'next', 'render', '_renderActionButtons', '_clickActionButton');

            this.options = {
                head : {},
                foot : []
            };

            _.extend(this.options, options);

            this.collection.listenTo(this.collection, 'reset change', this.render);

            this.render();
        },

        _renderActionButtons: function(actions) {
            const _tpl = _.template("<div class=\"btn-group btn-group-xs\">" +
                "<% _.each(actions,function(action){%>" +
                "<button data-target-id=\"<%=action._id%>\" data-name=\"<%=action.name%>\" type=\"button\" class=\"btn btn-action btn-<%=action.color%>\"><%=action.text%></button>" +
                "<%});%>" +
                "</div>");

            return _tpl({ actions : actions });
        },

        _clickActionButton : function(e) {
            e.preventDefault();

            var $btn = $(e.currentTarget),
                target_id = $btn.data('target-id'),
                name = $btn.data('name');

            var target = this.collection.find({ _id : target_id });

            target[name]();
        },

        render: function() {
            var data = _.clone(this.options),
                body = this.collection.toJSON().map(function(row) {
                    return this._filterRow(row);
                }.bind(this));

            _.extend(data, {
                body : body,
                pagination : this.collection.pageInfo()
            });

            this.$el.html(this.template(data));
        },

        previous: function() {
            this.collection.previousPage();
            return false;
        },

        next: function() {
            this.collection.nextPage();
            return false;
        },

        _filterRow: function(row) {
            var res = {};

            Object.keys(this.options.head).forEach(function(hKey){
                var val = row[hKey],
                    wrapper = this.options.head[hKey];
                if( val ) {
                    res[hKey] = _.isFunction(wrapper.view) ? wrapper.view.call(this, row, val) : val;
                } else {
                    res[hKey] = _.isFunction(wrapper.view) ? wrapper.view.call(this, row, null) : "";
                }
            }.bind(this));

            return res;
        }
    });


    var WindowView = Backbone.View.extend({
        attributes : {
            "class" : "block-container"
        },

        events : {
            "click .btn-window-close" : "_handleClickClose"
        },

        initialize: function(options) {

            _.bindAll(this, '_handleResizeWindow', '_handleClickClose');

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
        },

        _handleClickClose: function(e) {
            e.preventDefault();

            this.$el.hide();
        }
    });

    var AdminRoomView = Backbone.View.extend({
        events: {
            "click .btn-save-room" : "_handleClickSaveRoom",
            "click .btn-spawn": "_handleClickSpawn"
        },

        initialize: function(options) {
            _.bindAll(this,
                '_handleRoomChange',  '_handleClickSaveRoom',
                '_handleClickSpawn');

            this.options = options;
            this.template = _.template( $('#template-room-admin-block').html() );
            this.render();

            this.model.listenTo(this.model, 'change', this._handleRoomChange);
        },

        render: function() {
            this.$el.html( this.template({ room : this.model.toJSON() }) );
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
                "click .btn-edit-name" : "_handleClickEditName",
                "click .btn-invoice" : "_handleClickInvoice",
                "click .btn-payout" : "_handleClickPayout"
            },

            initialize: function(options) {
                this.__proto__.constructor.__super__.initialize.apply(this, arguments);

                _.bindAll(this,
                    '_handleUserChange', '_handleClickAdminSettings', '_handleClickRoomList',
                    '_handleClickEditName', '_handleClickInvoice', '_handleClickPayout');

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
            },

            _handleClickInvoice: function(e) {
                e.preventDefault();

                this.trigger('click-invoice');
            },

            _handleClickPayout: function(e) {
                e.preventDefault();

                this.trigger('click-payout');
            }
        }),


        RoomView: WindowView.extend({
            attributes : {
                "class" : "block-container"
            },

            events: {
                "click .btn-room-join" : "_handleClickJoin",
                "click .btn-room-leave" : "_handleClickLeave",
                "click .btn-room-donate" : "_handleClickDonate"
            },

            initialize: function(options) {
                this.__proto__.constructor.__super__.initialize.apply(this, arguments);

                _.bindAll(this,
                    '_handleRoomChange', '_handleClickJoin', '_handleUserChange',
                    '_handleClickLeave', '_handleClickDonate');

                this.options = options;
                this.userModel  = this.options.userModel;
                this.template = _.template( $('#template-room-block').html() );

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

            _handleClickDonate: function(e) {
                e.preventDefault();

                this.trigger('click-donate');
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

                const STATE_NAMES = {
                    "request" : "Запрос",
                    "close" : "Завершено",
                    "reject" : "Оклонено"
                };

                this.invoicePage = new Table({
                    head : {
                        created : {
                            name : "Время",
                            view : function(row, value) { return value; }
                        },
                        userid : {
                            name : "Игрок",
                            view : function(row, value) { return value.displayName; }
                        },
                        valueDelta : {
                            name : "Сумма",
                            view : function(row, value) { return value; }
                        },
                        state : {
                            name : "Состояние",
                            view : function(row, value) { return STATE_NAMES[value]; }
                        }
                    },
                    collection : this.invoices
                });

                this.payoutPage = new Table({
                    head : {
                        created : {
                            name : "Время",
                            view : function(row, value) { return value; }
                        },
                        userid : {
                            name : "Игрок",
                            view : function(row, value) { return value.displayName; }
                        },
                        valueDelta : {
                            name : "Сумма",
                            view : function(row, value) { return value; }
                        },
                        state : {
                            name : "Состояние",
                            view : function(row, value) { return STATE_NAMES[value]; }
                        },
                        action : {
                            name : "Действие",
                            view : function(row, value) {
                                if( row.state === 'request' ) {
                                    return this._renderActionButtons([
                                        {
                                            _id : row._id,
                                            name : "reject",
                                            text : "Отклонить",
                                            color : "danger"
                                        },
                                        {
                                            _id : row._id,
                                            name : "close",
                                            text : "Потдвердить",
                                            color : "success"
                                        }
                                    ]);
                                }
                                return "";
                            }
                        }
                    },
                    collection : this.payouts
                });

                this.usersPage = new Table({
                    head : {
                        displayName : {
                            name : "Имя",
                            view : function(row, value) { return value; }
                        },
                        photo : {
                            name : "Аватар",
                            view : function(row, value) { return "<img style='width: 32px' src="+ value +">"; }
                        },
                        profile : {
                            name : "Профиль",
                            view : function(row, value) { return "-"; }
                        },
                        balance : {
                            name : "Баланс",
                            view : function(row, value) { return value; }
                        },
                        actions : {
                            name : "Действия",
                            view : function(row, value) {
                                if( row.ban ) {
                                    return this._renderActionButtons([
                                        {
                                            _id : row._id,
                                            name : "unban",
                                            text : "Разбан",
                                            color : "success"
                                        }
                                    ]);
                                } else {
                                    return this._renderActionButtons([
                                        {
                                            _id : row._id,
                                            name : "ban",
                                            text : "Бан",
                                            color : "danger"
                                        }
                                    ]);
                                }
                            }
                        }
                    },

                    collection : this.users
                });

                this.settingsPage = new AdminRoomView({
                    model : this.model
                }) ;


                //  this.invoices.listenTo(this.invoices, 'reset change', this.render);
                //  this.payouts.listenTo(this.payouts, 'reset change', this.render);
                //  this.users.listenTo(this.users, 'reset change', this.render);

                this.render();
            },

            render: function() {

                this.$el.html( this.template({}) );

                this.$el.find('div#admin-invoices').append( this.invoicePage.$el );
                this.$el.find('div#admin-payouts').append( this.payoutPage.$el );
                this.$el.find('div#admin-users').append( this.usersPage.$el );
                this.$el.find('div#admin-settings').append( this.settingsPage.$el );

                return this
            }
        }),

        ProfilePage: WindowView.extend({

            events: function(){
                return _.defaults({
                    "click .btn-create-invoice" : "_handleCreateInvoice",
                    "click .btn-request-payout" : "_handleRequestPayout"
                }, WindowView.prototype.events);
            },

            invoices : new Backbone.Collection(),
            payouts : new Backbone.Collection(),
            history : new Backbone.Collection(),

            initialize: function(options) {
                this.__proto__.constructor.__super__.initialize.apply(this, arguments);

                console.log(WindowView.prototype.events)

                //  _.extend(this.events, WindowView.prototype.events);

                _.bindAll(this, 'render', '_update', '_handleCreateInvoice', '_handleRequestPayout');

                this.template = _.template( $('#template-profile-view').html() );

                if( options.invoices ) { this.invoices = options.invoices; }
                if( options.payouts ) { this.payouts = options.payouts; }
                if( options.history ) { this.history = options.history; }

                const STATE_NAMES = {
                    "request" : "Запрос",
                    "close" : "Завершено",
                    "reject" : "Оклонено"
                };

                this.invoicePage = new Table({
                    head : {
                        created : {
                            name : "Время",
                            view : function(row, value) { return value; }
                        },
                        valueDelta : {
                            name : "Сумма",
                            view : function(row, value) { return value; }
                        },
                        state : {
                            name : "Состояние",
                            view : function(row, value) { return STATE_NAMES[value]; }
                        }
                    },
                    collection : this.invoices
                });

                this.payoutPage = new Table({
                    head : {
                        created : {
                            name : "Время",
                            view : function(row, value) { return value; }
                        },
                        valueDelta : {
                            name : "Сумма",
                            view : function(row, value) { return value; }
                        },
                        state : {
                            name : "Состояние",
                            view : function(row, value) { return STATE_NAMES[value]; }
                        }
                    },
                    collection : this.payouts
                });

                this.historyPage = new Table({
                    head : {
                        created : {
                            name : "Время",
                            view : function(row, value) { return value; }
                        },
                        mob : {
                            name : "Фигура",
                            view : function(row, value) { return value.text; }
                        }
                    },
                    collection : this.history
                });


                this.invoices.listenTo(this.invoices, 'reset change', this._update);
                this.payouts.listenTo(this.payouts, 'reset change', this._update);
                this.history.listenTo(this.history, 'reset change', this._update);

                this.render();
            },

            _update: function() {
                this.model.fetch({ reset : true });
            },

            render: function() {

                this.$el.html( this.template({}) );

                this.$el.find('div#profile-invoices').append( this.invoicePage.$el );
                this.$el.find('div#profile-payouts').append( this.payoutPage.$el );
                this.$el.find('div#profile-history').append( this.historyPage.$el );

                return this
            },

            _handleCreateInvoice: function(e) {
                e.preventDefault();

                this.invoices.create({
                    valueDelta : this.$el.find('div#profile-invoices').find('input.invoice').val()
                })
            },

            _handleRequestPayout: function(e) {
                e.preventDefault();

                this.payouts.create({
                    valueDelta : this.$el.find('div#profile-payouts').find('input.payout').val()
                });
            }
        })
    };

    return ViewsModule;
}));
