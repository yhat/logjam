
/**
 * Module dependencies.
 */

var express = require('express')
  , http = require('http')
  , path = require('path')
  , spawn = require('child_process').spawn
  , _ = require('underscore');


module.exports = function(port, logdir) {

  logdir = logdir || "./logs/";

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


  startTail = function(glob) {
    var child = spawn("tail", ["-n", "1", "-f", logdir + glob + ".log"]);
    return child;
  };

  var tails = {};

  io.sockets.on('connection', function(socket) {

    socket.on("modelname", function(model) {
      socket.join(model);
      if (!_.has(tails, model)) {
        tails[model] = startTail(model).stdout.on('data', function(d) {
          io.sockets.in(model).emit('logthis', d.toString().trim());
        });
      } else {
        console.log("tail already exists: " + model);
      }
    });
  });
};
