var _ = require('underscore');

/**
 this.center = {
        x : _.random(-1500, 1500),
        y : _.random(-1500, 1500)
    };

 this.life = _.random(0, 2 * Math.PI);
 this.speed = _.random(0.2, 0.8);
 this.r_x = _.random(-500, 500);
 this.r_y = _.random(-500, 500);
 */

function Mob(options) {
    this.id = options.id;

    this.setOptions(options);
}

Mob.prototype.update = function(time) {
    var distance = this.options.speed * ( this.options.created + time ) / 1000;

    this.options.x = this.options.center.x + Math.sin(distance) * this.options.r_x * Math.sin(distance);
    this.options.y = this.options.center.y + Math.cos(distance) * this.options.r_y * Math.sin(distance);
};

Mob.prototype.setOptions = function(options) {
    // physic
    this.options = {
        x : 0,
        y : 0,
        angle : 0,
        center : { x : 0,  y : 0 },
        speed : 0,
        r_x : 0,
        r_y : 0,
        created : (new Date().getTime())
    };
    _.extend(this.options, options || {});
};


Mob.prototype.toJSON = function() {
    return this.options;
};


module.exports = Mob;