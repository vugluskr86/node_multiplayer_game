var mongoose = require('../utils/mongoose');
var bcrypt   = require('bcrypt-nodejs');
var _ = require('underscore');
var mongoosePaginate = require('mongoose-paginate');

var operations = 'payout mobTake invoice'.split(' ');
var states     = 'request close reject'.split(' ');

var AccountSchema = new  mongoose.Schema({
    userid:     { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    base:       mongoose.Schema.Types.Mixed,
    valueAbs:   { type: Number, default: 0 },
    valueDelta: { type: Number, default: 0 },
    operation:  { type: String, required: true, enum: operations },
    state:      { type: String, required: true, enum: states, default: 'request' }
}, { timestamps: { createdAt: 'created', updatedAt: 'updated' } });

AccountSchema.statics.createPayout = function(options, callback) {
    var _m = new this;

    _m.userid = options.userid;
    _m.valueAbs = options.valueAbs;
    _m.valueDelta = options.valueDelta;
    _m.operation = 'payout';
    _m.state = 'request';

    return _m.save(callback);
};

AccountSchema.statics.createMobTake = function(options, callback) {
    var _m = new this;

    _m.userid = options.userid;
    _m.valueAbs = options.valueAbs;
    _m.valueDelta = options.valueDelta;
    _m.base = options.base;
    _m.operation = 'mobTake';
    _m.state = 'complete';

    return _m.save(callback);
};

AccountSchema.statics.createInvoice = function(options, callback) {
    var _m = new this;

    _m.userid = options.userid;
    _m.valueAbs = options.valueAbs;
    _m.valueDelta = options.valueDelta;
    _m.base = options.base;
    _m.operation = 'invoice';
    _m.state = 'request';

    return _m.save(callback);
};

AccountSchema.statics.closePayout = function(options, callback) {
    var q = _.clone(options);
    _.extend(q, { operation : 'payout', state : 'request' });
    return mongoose.model('Account').update(q, { state : 'close' }).exec(callback);
};

AccountSchema.statics.rejectPayout = function(options, callback) {
    var q = _.clone(options);
    _.extend(q, { operation : 'payout', state : 'request' });
    return mongoose.model('Account').update(q, { state : 'reject' }).exec(callback);
};


AccountSchema.statics.closeInvoice = function(options, callback) {
    var q = _.clone(options);
    _.extend(q, { operation : 'invoice', state : 'request' });
    return mongoose.model('Account').update(q, { state : 'close' }).exec(callback);
};

AccountSchema.statics.rejectInvoice = function(options, callback) {
    var q = _.clone(options);
    _.extend(q, { operation : 'invoice', state : 'request' });
    return mongoose.model('Account').update(q, { state : 'reject' }).exec(callback);
};

AccountSchema.statics.getInvoices = function(options, callback) {
    var q = _.clone(options);
    _.extend(q, { operation : 'invoice' });
    return mongoose.model('Account').find(q).exec(callback);
};

AccountSchema.statics.getPayouts = function(options, callback) {
    var q = _.clone(options);
    _.extend(q, { operation : 'payout' });
    return mongoose.model('Account').find(q).exec(callback);
};

AccountSchema.statics.getMobTakes = function(options, callback) {
    var q = _.clone(options);
    _.extend(q, { operation : 'mobTake' });
    return mongoose.model('Account').find(q).exec(callback);
};


AccountSchema.statics.getInvoicesPage = function(query, options, callback) {
    var q = _.clone(query);
    _.extend(q, { operation : 'invoice' });
    return mongoose.model('Account').paginate(q, options, callback);
};

AccountSchema.statics.getPayoutsPage = function(query, options, callback) {
    var q = _.clone(query);
    _.extend(q, { operation : 'payout' });
    return mongoose.model('Account').paginate(q, options, callback);
};

AccountSchema.statics.getMobTakesPage = function(query, options, callback) {
    var q = _.clone(query);
    _.extend(q, { operation : 'mobTake' });
    return mongoose.model('Account').paginate(q, options, callback);
};


AccountSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Account', AccountSchema);