module.exports = function filterKeys(object, keys, envelope_fn) {
    var _object = {};

    Object.keys(object).forEach(function(key) {
        if(keys.indexOf(key) == -1) {
            //delete object[key];
        } else {
            if( envelope_fn ) {
                var _val = envelope_fn(key, object[key]);
                if( _val ) {
                    _object[key] = _val;
                }
            } else {
                _object[key] = object[key];
            }
        }
    });

    return _object;
};