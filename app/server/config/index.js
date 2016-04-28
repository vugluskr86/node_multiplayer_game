var nconf = require('nconf'),
    path = require('path');

const DEAULT_CONFIG_NAME = "default";

/**
 * Get config name from environment variable NODE_ENV
 *
 * Usage : $> NODE_ENV=production node app.js
 *
 *
 * @constructor
 */
var ResolveConfigName = function ResolveConfigName()
{
    var configName = process.env.NODE_ENV ? process.env.NODE_ENV : 'default';

    return path.join(__dirname, configName + '.json')
};

var ConfigFile = ResolveConfigName();

console.log('Use config: ', ConfigFile);

nconf.argv().env().file({ file : ConfigFile });

module.exports = nconf;