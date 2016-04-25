var App = require('./app.js');
require('bootstrap-webpack!./bootstrap.config.js');
require('font-awesome-webpack');
require('../styles/style.less');

$(document).ready(function () {
    'use strict';

    App.initialize();
});
