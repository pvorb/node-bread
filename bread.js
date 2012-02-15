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
        hooks.__content = function(f, prop, cb) {
          pandoc(prop.__content, 'markdown', 'html', cb);
        };

        // Parse ISO 8601 dates
        hooks.date = function(f, prop, cb) {
          var date;
          // If it's not a date, try parse it
          if (typeof prop.date != 'date') {
            try {
              date = isodate(prop.date);
            } catch (err) {
              try {
                date = new Date(prop.date);
              } catch (err) {
                return cb(err);
              }
            }
          } else
            date = prop.date;

          cb(null, date)
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
          write(reg, conf, function (err) {
            if (err)
              return cb(err);
            db.close();
            cb(null);
          });
        };

        bake(conf, hooks, cb);
      });
    });
  });
};

module.exports = bread;
