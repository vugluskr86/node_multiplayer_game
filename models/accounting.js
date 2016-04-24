var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');
var _ = require('underscore');

var operations = 'payout mobTake invoice'.split(' ');
var states     = 'request close reject'.split(' ');

var AccountSchema = new  mongoose.Schema({
    userid:     { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    base:       mongoose.Schema.Types.Mixed,
    valueAbs:   { type: Number, default: 0 },
    valueDelta: { type: Number, default: 0 },
    operation:  { type: String, required: true, enum: operations },
    state:      { type: String, required: true, enum: states, default: 'request' },
    created:    { type: Date, default : Date.now }
});

AccountSchema.methods.createPayout = function(options, callback) {
     var _m = new this.model('Account');

    _m.userid = options.user._id;
    _m.valueAbs = options.user.balance;
    _m.valueDelta = options.value;
    _m.operation = 'payout';
    _m.state = 'request';

    return _m.save(callback);
};

AccountSchema.methods.closePayout = function(options, callback) {
    var q = _.clone(options);
    _.extend(q, { operation : 'payout', state : 'request' });
    return this.model('Account').update(q, { state : 'close' }).exec(callback);
};

AccountSchema.methods.rejectPayout = function(options, callback) {
    var q = _.clone(options);
    _.extend(q, { operation : 'payout', state : 'request' });
    return this.model('Account').update(q, { state : 'reject' }).exec(callback);
};

AccountSchema.methods.createMobTake = function(options, callback) {
    var _m = this.model('Account');

    _m.userid = options.user._id;
    _m.valueAbs = options.user.balance;
    _m.valueDelta = options.value;
    _m.base = options.mob;
    _m.operation = 'mobTake';
    _m.state = 'complete';

    return _m.save(callback);
};

AccountSchema.methods.createInvoice = function(options, callback) {
    var _m = this.model('Account');

    _m.userid = options.user._id;
    _m.valueAbs = options.user.balance;
    _m.valueDelta = options.value;
    _m.base = options.mob;
    _m.operation = 'invoice';
    _m.state = 'request';

    return _m.save(callback);
};

AccountSchema.methods.closeInvoice = function(options, callback) {
    var q = _.clone(options);
    _.extend(q, { operation : 'invoice', state : 'request' });
    return this.model('Account').update(q, { state : 'close' }).exec(callback);
};

AccountSchema.methods.rejectInvoice = function(options, callback) {
    var q = _.clone(options);
    _.extend(q, { operation : 'invoice', state : 'request' });
    return this.model('Account').update(q, { state : 'reject' }).exec(callback);
};

AccountSchema.methods.getInvoices = function(options, callback) {
    var q = _.clone(options);
    _.extend(q, { operation : 'invoice' });
    return this.model('Account').find(q).exec(callback);
};

AccountSchema.methods.getPayouts = function(options, callback) {
    var q = _.clone(options);
    _.extend(q, { operation : 'payout' });
    return this.model('Account').find(q).exec(callback);
};

AccountSchema.methods.getMobTakes = function(options, callback) {
    var q = _.clone(options);
    _.extend(q, { operation : 'mobTake' });
    return this.model('Account').find(q).exec(callback);
};


module.exports = mongoose.model('Account', AccountSchema);