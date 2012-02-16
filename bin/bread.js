#!/usr/bin/env node

var fs = require('fs');
var path = require('path');
var async = require('async');
var confdir = require('confdir');
var colors = require('colors');

var bread = require('../bread.js');

confdir(process.cwd(), 'conf', function (err, confdir) {
  if (err)
    throw err;

  // read conf.json and properties.json
  async.parallel({
    conf: function (cb) {
      fs.readFile(path.resolve(confdir, 'bread.json'), 'utf8', cb);
    },
    properties: function (cb) {
      fs.readFile(path.resolve(confdir, 'properties.json'), 'utf8', cb);
    }
  }, function (err, files) {
    if (err)
      die(err);

    // parse JSON and setup conf object
    var conf = JSON.parse(files.conf);
    conf.properties = JSON.parse(files.properties);

    conf.confdir = confdir;
    conf.root = path.resolve(confdir, '..');

    // invoke bread
    bread(conf, function (err) {
      if (err)
        die(err);

      console.log('ok'.green);
    });
  });
});

function die(err) {
  console.log('not ok'.red);
  throw err;
}
