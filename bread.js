var bake = require('bake');
var Reg = require('reg');
var marked = require('marked');
var mongo = require('mongodb');
var isodate = require('isodate');

var write = require('./write.js');

// empty callback
var x = function () {};

// Main function
var bread = function(conf, cb) {

  var dir = conf.directories;
  var tags = [];

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

        // Parse contents with `marked()`
        hooks.__content = function(f, prop) {
          return marked(prop.__content);
        };

        // Parse ISO 8601 dates
        hooks.date = function(f, prop) {
          var date;
          // If it's not a date, try parse it
          if (typeof prop.date != 'date') {
            try {
              date = isodate(prop.date);
            } catch (err) {
              date = new Date(prop.date);
            }
          } else
            date = prop.date;

          return date;
        };

        // Save files in registry
        hooks.__writeAfter = function(f, prop) {
          var id = prop._id;
          delete prop._id;

          // Save reference to all used tags
          // Used later by write()
          if (prop.tags)
            for (var i = 0; i < prop.tags.length; i++)
              tags[prop.tags[i]] = true;

          reg.extend(id, prop, x);
        };

        // Write indexes, feeds and tag pages
        hooks.__complete = function(f, prop) {
          write(reg, conf, function (err) {
            if (err)
              cb(err);
            db.close();
            cb(null);
          });
        };

        bake(conf, hooks, function (err) {
          if (err)
            cb(err);
        });
      });
    });
  });
};

module.exports = bread;
