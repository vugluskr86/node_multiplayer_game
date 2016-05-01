(function(){

    const DEBUG_LOG = false;

    if( DEBUG_LOG ) {
        var oldLog = console.log;

        console.log = function (message) {
            logError(message, "", "");
            oldLog.apply(console, arguments)
        };

        function logError(details) {
            $.ajax({
                type: 'POST',
                url: '/api/v1/errors',
                data: JSON.stringify({context: navigator.userAgent, details: details}),
                contentType: 'application/json; charset=utf-8'
            });
        }

        window.onerror = function(message, file, line) {
            logError(file + ':' + line + '\n\n' + message);
        };
    }

})();


var App = require('./app.js');
require('../../assets/styles/style.less');

$(document).ready(function () {
    'use strict';
    App.initialize();
});
