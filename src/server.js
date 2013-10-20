/**
 * Module dependencies.
 */

var express = require('express')
  , http = require('http')
  , path = require('path')
  , uuid = require('uuid');

// We need to keep track of our client connections so we can 
// push log updates as needed.
GLOBAL.connections = {};


module.exports = function(logdir, mountdir, port) {

  var app = express()

  // all environments
  app.set('port', port || 3000);
  app.set('views', __dirname + '/../views');
  app.set('view engine', 'ejs');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, '/../public')));

  // development only
  if ('development' == app.get('env')) {
    app.use(express.errorHandler());
  }

  app.get('/', function(req, res) {
    res.render('index', { title: "Logs" });
  });

  app.get('/events', function(req, res) {
    // keep the connection open indefinitely
    req.socket.setTimeout(Infinity);

    // create a way for us to push data to the client
    var conn = {
      id: uuid.v4(),
      send: function(data) {
        var body  = 'data: ' + JSON.stringify(data) + '\n\n';
        res.write(body);
      }
    };
    connections[conn.id] = conn;
    
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no' // Disable buffering for nginx
    });
    res.write('\n');

    req.on('close', function() {
      delete connections[conn.id];
    });

  });

  var server = require('http').createServer(app);

  server.listen(app.get('port'), function(){
    console.log("Express server listening on port " + app.get('port'));
  });
  
  var options = { html: false }
    , logstream = require('./logstream')(logdir, mountdir, options);

};
