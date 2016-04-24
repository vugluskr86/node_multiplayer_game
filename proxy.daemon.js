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
        port: 4002
    }
});

var server = http.createServer(function(req, res) {
    if( req.url.indexOf('/api/v1/users') === 0 ) {
        return proxy.web(req, res, { target: 'http://localhost:4005' });
    }

    if( req.url.indexOf('/api/v1/top') === 0 ) {
        return proxy.web(req, res, { target: 'http://localhost:4005' });
    }

    if( req.url.indexOf('/api/v1/rooms') === 0 ) {
        return proxy.web(req, res, { target: 'http://localhost:4004' });
    }

    if( req.url.indexOf('/api/v1/invoices') === 0 ) {
        return proxy.web(req, res, { target: 'http://localhost:4001' });
    }
    if( req.url.indexOf('/api/v1/payouts') === 0 ) {
        return proxy.web(req, res, { target: 'http://localhost:4001' });
    }

    proxy.web(req, res, { target: 'http://localhost:4002' });
});

server.on('upgrade', function (req, socket, head) {
    if( req.url.indexOf('/rooms') === 0 ) {

        var route = req.url.split('/');

        if( route.length == 3 ) {

            var roomID = route[2];

            return RoomModel.findOne({ _id : roomID, state : 'run' }).exec(function(err, room) {
                if( err ) {
                    return console.log("mongo err", err);
                }

                if( !room ) {
                    return proxy.ws(req, socket, head, { target: 'http://localhost:4100', ws: true });
                }

                return proxy.ws(req, socket, head, { target: 'http://localhost:' + room.port, ws: true });
            });
        }
    }
});

console.log("listening on port 3000");
server.listen(3000);