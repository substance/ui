var http = require('http');
var express = require('express');
var path = require('path');

var app = express();
var port = process.env.PORT || 5003;
var sass = require('node-sass');

function renderSass(cb) {
  sass.render({
    file: path.join(__dirname, "styles", "index.scss"),
    sourceMap: true,
    outFile: 'ui.css',
  }, cb);
}


function handleError(err, res) {
  console.error(err);
  res.status(400).json(err);
}

// use static server
app.use(express.static(__dirname));

app.get('/ui.css', function(req, res) {
  renderSass(function(err, result) {
    if (err) return handleError(err, res);
    res.set('Content-Type', 'text/css');
    res.send(result.css)
  });
});

app.get('/ui.css.map', function(req, res) {
  
  renderSass(function(err, result) {
    if (err) return handleError(err, res);
    res.set('Content-Type', 'text/css');
    res.send(result.map)
  });
});

app.listen(port, function(){
  console.log("Lens running on port " + port);
  console.log("http://127.0.0.1:"+port+"/");
});

// Export app for requiring in test files
module.exports = app;