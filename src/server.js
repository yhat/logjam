/**
 * Module dependencies.
 */

var express = require('express')
  , http = require('http')
  , fs = require('fs')
  , path = require('path')
  , uuid = require('uuid')
  , minimatch = require('minimatch')
  , ConvertAnsi = require('ansi-to-html')
  , ansi = new ConvertAnsi();

// We need to keep track of our client connections so we can 
// push log updates as needed.
GLOBAL.connections = {};


module.exports = function(logdir, port) {

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
  app.use(express.static(path.join(__dirname, '..', 'public')));

  // development only
  if ('development' == app.get('env')) {
    app.use(express.errorHandler());
  }

  app.get('/', function(req, res) {
    res.render('index', { title: "Logs" });
  });

  /*
   * We're going to turn our logs into an event-stream. This is
   * nice because you can just curl localhost:3000/events and it has
   * the same affect as just doing tail -f *.log.
   */
  app.get('/events', function(req, res) {
    // keep the connection open indefinitely
    req.socket.setTimeout(Infinity);

    // create a way for us to push data to the client
    var conn = {
      id: uuid.v4(),
      send: function(data) {
        if (req.query.pattern) {
          // TODO: Need to slice because filename are coming back with / at start
          if (!minimatch(data.filename.slice(1), req.query.pattern)) {
            return;
          }
        }
        if (req.query.html) {
          data.content = ansi.toHtml(data.content);
        }
        var body;
        if (req.query.raw) {
          body = data.filename + "> " + data.content;
        } else {
          body = 'data: ' + JSON.stringify(data) + '\n\n';
        }

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
    // some senseless art...
    var art = fs.readFileSync(path.join(__dirname, 'art.txt')).toString();
    console.log(art);
    console.log("Running on port " + app.get('port'));
  });
  
  /*
   * Initializing logstream. This is going to hijack the logdir using FUSE
   * and then redirect all writes back to the event-stream in /events
   */
  var options = {
    rollingBytes: 3000
  };
  require('./logstream')(logdir, options);
};
