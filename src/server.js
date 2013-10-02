
/**
 * Module dependencies.
 */

var express = require('express')
  , http = require('http')
  , path = require('path')
  , spawn = require('child_process').spawn
  , _ = require('underscore')
  , ansiToHtml= require('ansi-to-html');;

var ansi = new ansiToHtml();

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

    socket.on("greplog", function(data) {
      var model = data.model
        , regex = "";
      try {
        regex = new RegExp(data.regex || ".*", 'g')
      } catch (e) {
        regex = RegExp(".+", "g");
      }
      var channel = model + '-' + regex;
      
      socket.channel = channel;
      socket.join(channel);
      if (!_.has(tails, model)) {
        tails[channel] = startTail(model);
        tails[channel].stdout.on('data', function(d) {
          if (regex.test(d.toString())) {
            var line = ansi.toHtml(d.toString().trim());
            if (! /<p>/.test(line)) {
              line = "<p>" + line + "</p>";
            }
            io.sockets.in(channel).emit('logthis', line);
          }
        });
      } else {
        console.log("tail already exists: " + model);
      }
    });
    socket.on("disconnect", function() {
      if (io.sockets.clients(socket.channel).length==1) {
        console.log(socket.channel + " is now empty, removing tail");
        if (_.has(tails, socket.channel)) {
          tails[socket.channel].kill();
          delete tails[socket.channel];
        }
      }
    });
  });
};
