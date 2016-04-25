var _ = require('underscore');

function Mob(id, options, optionId) {
    this.x = 0;
    this.y = 0;
    this.angle = 0;
    this.id = id;
    this.optionId = optionId;
    this.options = options;

    this.center = {
        x : _.random(-3000, 3000),
        y : _.random(-3000, 3000)
    };

    this.life = _.random(0, 2 * Math.PI);
    this.speed = _.random(0.2, 0.8);
    this.r_x = _.random(-500, 500);
    this.r_y = _.random(-500, 500);

    this._ditry = true;
}

Mob.prototype.update = function(dt) {
    this.x = this.center.x + Math.sin(this.life) * this.r_x * Math.sin(this.life);
    this.y = this.center.y + Math.cos(this.life) * this.r_y * Math.sin(this.life);
    this.life += dt / 1000 * this.speed;
};

Mob.prototype.toJSON = function() {
    return {
        x : this.x,
        y : this.y,
        angle : this.angle,
        id : this.id,
        center : this.center,
        life : this.life,
        speed : this.speed,
        r_x : this.r_x,
        r_y: this.r_y
    };
};

module.exports = Mob;