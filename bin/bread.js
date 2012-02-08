#!/usr/bin/env node

var fs = require('fs');
var path = require('path');
var confdir = require('confdir');
var colors = require('colors');

var bread = require('../bread.js');

confdir(process.cwd(), 'conf', function (err, dir) {
  if (err)
    throw err;

  fs.readFile(path.resolve(dir, 'conf.json'), 'utf8', function (err, conf) {
    if (err)
      throw err;

    var conf = JSON.parse(conf);
    conf.confdir = dir;
    conf.root = path.resolve(dir, '..');

    bread(conf, function (err) {
      if (err) {
        console.log('not ok'.red);
        throw err;
      }

      console.log('ok'.green);
    })
  });
});
