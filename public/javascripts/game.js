(function() {

    window.requestAnimFrame = (function () {
        return window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function (/* function */ callback, /* DOMElement */ element) {
                window.setTimeout(callback, 1000 / 60);
            };
    })();


    var GameFieldView = Backbone.View.extend({

        tagName: "canvas",

        attributes: {
            "class": "game-field"
        },

        events: {
            "mousemove": "_handleMouseMove",
            "mouseup": "_handleMouseUp",
            "mousedown": "_handleMouseDown",

            "touchmove": "_handleMouseMove",
            "touchend": "_handleMouseUp",
            "touchstart": "_handleMouseDown"
        },

        mouseDown: false,

        _sleep : false,


        views: [],
        _players: [],

        debug : false,

        initialize: function () {
            _.bindAll(this,
                '_handleResizeCanvas', '_handleMouseMove',
                '_handleMouseUp', '_handleMouseDown', '_drawGrid',
                '_loop', '_initRender',
                '_constructSceneObject', '_initGrid', '_handleAddGameObject',
                '_handleResetGameObjects', '_handleUpdateGameObject', '_handleRemoveGameObject',
                '_handleClickObject');

            this.canvas = this.$el[0];


            this.context = this.canvas.getContext('2d');

            this.mouseCoord = { x : 0, y : 0 };

            this.mousePress =  { x : 0, y : 0 };
            this.mouseDown = false;


            this._initRender();

            $(window).on('resize', this._handleResizeCanvas);
            this._handleResizeCanvas();

            this._loop();

            this.listenTo(this.model, 'fillRoom', this._handleResetGameObjects);
            this.listenTo(this.model, 'updateMobsData', this._handleUpdateGameObject);

            this.listenTo(this.model.mobs, 'remove', this._handleRemoveGameObject);
            this.listenTo(this.model.mobs, 'add', this._handleAddGameObject);
        },

        _initRender: function() {
            this.stage = new createjs.Stage(this.canvas);
            this.stage.snapPixelsEnabled = true;
            this.stage.enableMouseOver();

            this._initGrid();

            this.worldView = new createjs.Container();
            this.stage.addChild(this.worldView);
        },

        _initGrid: function() {
            this.gridView = new createjs.Shape();
            this.gridView.snapToPixel = true;
            this.gridView.mouseEnabled = true;

            this._drawGrid();

            this.stage.addChild(this.gridView);
        },

        _drawGrid: function() {
            if( this.gridView ) {

                var gfx = this.gridView.graphics;

                gfx.clear();

                gfx.beginFill("#fefefe");
                gfx.drawRect(0, 0, this.canvas.width, this.canvas.height);

                var width = this.canvas.width;
                var height = this.canvas.height;
                var gridSize = 100;

                var _dx = this.mouseCoord.x;
                var _dy = this.mouseCoord.y;

                gfx.setStrokeStyle(1);
                gfx.beginStroke("#000");

                for (var _x = -gridSize; _x <= width + gridSize; _x += gridSize) {
                    var x = _x + _dx % gridSize;

                    gfx.moveTo(x, 0);
                    gfx.lineTo(x, height);
                }

                for (var _y = -gridSize; _y <= height + gridSize; _y += gridSize) {
                    var y = _y + _dy % gridSize;

                    gfx.moveTo(0, y + 0.5);
                    gfx.lineTo(width, y + 0.5);
                }
            }
        },

        _handleMouseMove: function (e) {
            if (this.mouseDown) {
                var dx = e.pageX - this.mousePress.x;
                var dy = e.pageY - this.mousePress.y;

                this.mouseCoord.x += dx;
                this.mouseCoord.y += dy;

                this.worldView.x += dx;
                this.worldView.y += dy;

                this._drawGrid();

                this.mousePress.x = e.pageX;
                this.mousePress.y = e.pageY;
            }
        },

        _handleMouseUp: function (e) {
            this.mousePress.x = 0;
            this.mousePress.y = 0;
            this.mouseDown = false;
        },

        _handleMouseDown: function (e) {
            this.mouseDown = true;
            this.mousePress.x = e.pageX;
            this.mousePress.y = e.pageY;
        },

        _handleResizeCanvas: function (e) {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;

            this._drawGrid();
        },


        _loop: function () {
            this.stage.update();
            requestAnimFrame(this._loop);
        },

        _handleClickObject: function(e) {
            this.model.click(e.currentTarget.serverId);
        },


        _constructSceneObject: function(object) {

            var container = new createjs.Container();

            var rect = new createjs.Shape();

            switch (object.prototype.view.type) {
                case "box": {
                    rect.graphics
                        .beginFill(object.prototype.view.fill)
                        .drawRect(0, 0, object.prototype.view.width, object.prototype.view.height)
                        .setStrokeStyle(object.prototype.view.strokeStyle)
                        .beginStroke(object.prototype.view.stroke)
                        .drawRect(0, 0, object.prototype.view.width, object.prototype.view.height);

                    rect.regX = object.prototype.view.width / 2.0;
                    rect.regY = object.prototype.view.height / 2.0;

                    container.setBounds(0, 0, object.prototype.view.width, object.prototype.view.height);
                    break;
                }
                case "circle":{
                    rect.graphics
                        .beginFill(object.prototype.view.fill)
                        .drawCircle(0, 0, object.prototype.view.radius)
                        .setStrokeStyle(object.prototype.view.strokeStyle)
                        .beginStroke(object.prototype.view.stroke)
                        .drawCircle(0, 0, object.prototype.view.radius);


                    container.setBounds(0, 0, object.prototype.view.radius, object.prototype.view.radius);
                    break;
                }
                case "polygon":
                default:
                {
                    throw "UndefinedViewObjectType";
                }
            }

            container.snapToPixel = true;
            container.mouseEnabled = true;

            var _rot = object.angle * (180 / Math.PI);

            container.addChild(rect);

            if( object.text ) {

                var _contText = new createjs.Container("text");

                var t1 = new createjs.Text(object.text, "12px Arial", "#000");
                t1.outline = 3;

                var t2 = t1.clone();
                t2.outline = false;
                t2.color = "#fff";


                var fontSize = 16;

                switch (object.prototype.view.type) {
                    case "box" :
                    {
                        fontSize = parseInt(object.prototype.view.width / 2.3);
                        break;
                    }
                    case "circle" :
                    {
                        fontSize = parseInt(object.prototype.view.radius / 2.3);
                        break;
                    }
                }

                const fontMinSize = 16;
                if( fontSize < fontMinSize ) {
                    fontSize = fontMinSize;
                }

                t1.font = fontSize + "px Arial";
                t2.font = fontSize + "px Arial";

                _contText.addChild(t1, t2);

                var b = _contText.getBounds();
                t1.x = - b.width / 2;
                t1.y = - b.height / 2;
                t2.x = - b.width / 2;
                t2.y = - b.height / 2;

                container.addChild(_contText);

                container._childText = _contText;
            }

            container.rotation = _rot;
            container.x = object.x;
            container.y = object.y;
            container.serverId = object.id;

            container.cursor = "pointer";

            return container;
        },


        _handleAddGameObject: function(model) {
            var object = model;

            var shape = this._constructSceneObject(object.toJSON());

            object.set('shape', shape);

            shape.addEventListener('mousedown', this._handleClickObject);
            this.worldView.addChild(shape);

            this.views.push({ id : object.id, view : shape })
        },

        _handleResetGameObjects: function() {
            this._sleep = true;

            this.views.forEach(function(v){
                v.view.removeAllEventListeners('mousedown');
                this.worldView.removeChild(v.view);
                v.view = null;
            }.bind(this));

            this.views = [];

            this.model.mobs.forEach(function(object) {
                var shape = this._constructSceneObject(object.toJSON());

                object.set('shape', shape);

                shape.addEventListener('mousedown', this._handleClickObject);
                this.worldView.addChild(shape);

                this.views.push({ id : object.id, view : shape })
            }.bind(this));

            this._sleep = false;
        },

        _handleUpdateGameObject: function() {
            this.model.mobs.forEach(function(object) {
                object._update();
            }.bind(this));
        },

        _handleRemoveGameObject: function(model) {
            var object = model.toJSON();
            var index = _.findIndex(this.views, { id : object.id });
            if( index !== -1 ) {
                this.views[index].view.removeAllEventListeners('mousedown');
                this.worldView.removeChild(this.views[index].view);
                this.views[index].view = null;
                this.views.splice(index, 1);
            }
        }
    });


    // GameField
    // Connect
    window.GameModule = {
        GameFieldView : GameFieldView
    };
})();