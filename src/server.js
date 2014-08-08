var express = require('express')
  , http = require('http')
  , fs = require('fs')
  , path = require('path')
  , exphbs = require('express3-handlebars')
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
  app.set('views', path.join(__dirname, '..', 'views'));
  app.set('view engine', 'html');
  app.engine('html', exphbs({
    defaultLayout: 'main',
    extname: '.html'
  }));
  app.enable('view cache');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  // public AND node_modules (for CustomElements)
  app.use(express.static(path.join(__dirname, '..', 'public')));
  app.use(express.static(path.join(__dirname, '..', 'node_modules')));

  // development only
  if ('development' == app.get('env')) {
    app.use(express.errorHandler());
  }

  app.get('/', function(req, res) {
    res.render('index', { title: "Logs" });
  });

  app.get('/terminus', function(req, res) {
    res.render('home', { title: "Terminus Immedius" });
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
        if (req.query.pattern=="true") {
          // TODO: Need to slice because filename are coming back with / at start
          if (!minimatch(data.filename.slice(1), req.query.pattern)) {
            return;
          }
        }
        if (req.query.html=="true") {
          data.content = ansi.toHtml(data.content);
        }
        var body;
        if (req.query.raw=="true") {
          if (req.query.filename=="true") {
            body = data.filename;
          }
          body += data.content;
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
    var art = fs.readFileSync(path.join(__dirname, 'art.txt')).toString();
    console.log(art);
    console.log("Running on port " + app.get('port'));
  });

  /*
   * Initializing logjam. This is going to hijack the logdir using FUSE
   * and then redirect all writes back to the event-stream in /events
   */
  var options = {
    rollingBytes: null
  };
  require('./logjam')(logdir, options);
};
