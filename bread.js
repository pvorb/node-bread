var bake = require('bake');
var Reg = require('reg');
var pandoc = require('pdc');
var isodate = require('isodate');
var mongo = require('mongodb');
var append = require('append');
var clone = require('clone');
var Set = require('Set');

var write = require('./write.js');

// empty callback
var x = function () {};

// Main function
var bread = function(conf, cb) {

  var dir = conf.directories;

  // Open connection to MongoDB
  new mongo.Db(conf.db.name, new mongo.Server(conf.db.host, conf.db.port))
      .open(function (err, db) {
    if (err)
      return cb(err);

    // Open collection
    db.collection(conf.db.collection, function (err, collection) {
      if (err)
        return cb(err);

      // Get registry
      new Reg(collection, function (err, reg) {
        if (err)
          return cb(err);

        var hooks = {};
        reg.tags = new Set();

        // Parse contents with `marked()`
        hooks.__content = function __content(f, prop, cb) {
          pandoc(prop.__content, 'markdown', 'html', cb);
        };

        hooks.__propBefore = function __propBefore(f, prop, cb) {
          if (!prop.modified)
            prop.modified = new Date();

          cb(null, prop);
        };

        // Parse ISO 8601 dates
        hooks.created = function(f, prop, cb) {
          var created;
          // If it's not a date, try parse it
          if (typeof prop.created != 'date') {
            try {
              created = isodate(prop.created);
            } catch (err) {
              try {
                created = new Date(prop.created);
              } catch (err) {
                return cb(err);
              }
            }
          } else
            created = prop.created;

          cb(null, created);
        };

        // Save files in registry
        hooks.__writeAfter = function(f, prop, cb) {
          var id = prop._id;
          delete prop._id;
          reg.extend(id, prop, x);
          if (prop.tags)
            for (var i = 0; i < prop.tags.length; i++)
              reg.tags.add(prop.tags[i].trim());
          cb(null, prop);
        };

        // Write indexes, feeds and tag pages
        hooks.__complete = function(f, prop, cb) {
          console.log('Content files written.');
          write(reg, conf, function (err) {
            if (err)
              return cb(err);
            cb(null);
          });
        };

        bake(conf, hooks, function (err) {
          db.close();
          cb(err);
        });
      });
    });
  });
};

module.exports = bread;
