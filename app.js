
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
var nowjs = require("now");
var cp = require("child_process");
var app = module.exports = express.createServer();
var everyone = nowjs.initialize(app);

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes
var sessionId = 0;
var sessid2nowsessid = {};
var nowsessid2sessid = {};
var ghcis = {};

app.get(/^\/edit\/(.+)$/, function(req, res) {
  var sessid = sessionId++;
  var ghci = cp.spawn("ghci", []);
  ghcis[sessid] = ghci;
  require("fs").readFile("/" + req.params.toString(), function(err, data) {
    res.render("index", {
      title: "DrHaskell",
      path: "/" + req.params.toString(),
      sessid: sessid,
      fileContents: err ? "" : data.toString()
    });
  });
});

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);

everyone.now.register = function(sessid, path) {
  var cid = this.user.clientId;
  sessid2nowsessid[sessid] = cid;
  nowsessid2sessid[cid] = sessid;
  var $this = this;
  ghcis[sessid].stdout.on("data", function(data) {
    $this.now.consoleOutput(data.toString());
  });
};

everyone.now.save = function(path, data) {
  var $this = this;
  require("fs").writeFile(path, data, function(err) {
    $this.now.saved(!!err);
    var sessid = nowsessid2sessid[$this.user.clientId];
    var ghci = ghcis[sessid];
    ghci.stdin.write(":l " + path.replace(/ /g, "\\ ") + "\n");
  });
};

everyone.now.runCommand = function(command) {
  var cid = this.user.clientId;
  var sessid = nowsessid2sessid[cid];
  var ghci = ghcis[sessid];
  ghci.stdin.write(command + "\n");
};

everyone.on("disconnect", function() {
  var cid = this.user.clientId;
  var sessid = nowsessid2sessid[cid];
  var ghci = ghcis[sessid];
  ghci.stdin.write(":exit\n");
  delete nowsessid2sessid[cid];
  delete sessid2nowsessid[sessid];
  delete ghcis[sessid];
});
