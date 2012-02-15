var fs = require('fs');
var path = require('path');
var pandoc = require('pdc');
var bake = require('../bake.js');

var a = {};

// Read the configuration file
var conf = fs.readFileSync(path.resolve(__dirname, 'conf/bake.json'),
    'utf8');

conf = JSON.parse(conf);
conf.root = __dirname;

var hooks = {
  __content: function(fn, properties, callback) {
    return pandoc(properties.__content, 'markdown', 'html', callback);
  }
};

// Bake some markdown files
bake(conf, hooks, function (err) {
  if (err)
    throw err;
  console.log('ok');
});
