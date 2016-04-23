var http = require('http'),
    url = require('url'),
    httpProxy = require('http-proxy'),
    mongoose = require('mongoose'),
    configDB = require('./config/database.js');

mongoose.connect(configDB.url);

var RoomModel = require('./models/room');

var proxy = httpProxy.createProxyServer({
    target: {
        host: 'localhost',
        port: 3001
    }
});

var server = http.createServer(function(req, res) {
    if( req.url.indexOf('/api/v1/users') === 0 ) {
        return proxy.web(req, res, { target: 'http://localhost:3002' });
    }

    if( req.url.indexOf('/api/v1/top') === 0 ) {
        return proxy.web(req, res, { target: 'http://localhost:3002' });
    }


    if( req.url.indexOf('/api/v1/rooms') === 0 ) {
        return proxy.web(req, res, { target: 'http://localhost:3004' });
    }

    proxy.web(req, res, { target: 'http://localhost:3001' });
});

server.on('upgrade', function (req, socket, head) {
    if( req.url.indexOf('/rooms') === 0 ) {

        var route = req.url.split('/');

        if( route.length == 3 ) {

            var roomID = route[2];

            if( roomID === 'lobby' ) {
                proxy.ws(req, socket, head, { target: 'http://localhost:3010', ws: true });
            } else {
                RoomModel.findOne({ _id : roomID, state : 'run' }).exec(function(err, room) {
                    if( err ) {
                        return console.log("mongo err", err);
                    }

                    proxy.ws(req, socket, head, { target: 'http://localhost:' + room.port, ws: true });
                });
            }
        }
    }
});

console.log("listening on port 3000");
server.listen(3000);