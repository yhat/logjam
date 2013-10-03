
/**
 * Module dependencies.
 */

var express = require('express')
  , http = require('http')
  , path = require('path');


module.exports = function(logdir, mountdir, port) {

  var app = express();

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

  var server = require('http').createServer(app);

  server.listen(app.get('port'), function(){
    console.log("Express server listening on port " + app.get('port'));
  });

  var io = require('socket.io').listen(server, { log: false })
    , options = { html: true }
    , logstream = require('./logstream')(logdir, mountdir, io, options);

  io.sockets.on('connection', function(socket) {

    socket.on("message", function(data) {
      console.log("new message: " + data);
    });

  });

};
