;(function() {

var mongodb = require('mongodb');

var MongoDB = mongodb.Db;
var MongoServer = mongodb.Server;

var todo;

// Init the database connection
function Index(opt, cb) {

  var inst = this;

  // Save params
  inst.opt = opt;
  var dbinf = opt.db;
  inst.tags = {};

  todo = 2;

  // Init db connection
  var server = new MongoServer(dbinf.host, dbinf.port);
  var dbConnector = new MongoDB(dbinf.name, server);
  dbConnector.open(function (err, db) {
    // Throw errors
    if (err)
      return cb(err);

    console.log('Database connection established.');

    // Store db object
    inst.db = db;

    // Get db collection
    db.collection(dbinf.collection, function(err, c) {
      // Throw errors
      if (err)
        return cb(err);

      // Drop it
      c.drop();

      console.log("Dropped collection '" + dbinf.collection + "'.");

      // Create the collection
      db.createCollection(dbinf.collection, function(err, c) {
        if (err)
          return cb(err);

        console.log("Created collection '" + dbinf.collection + "'.");

        // Save collection pointer
        inst.collection = c;

        // Create index 'date'
        c.createIndex({ date: -1 }, { unique: false },
            function(err, index) {
          if (err)
            cb(err);

          // Call the cb when both indexes have been created
          else if (!--todo)
            cb(inst);
        });

        // Create index 'tags'
        c.createIndex({ tags: 1 }, { unique: false },
            function(err, index) {
          if (err)
            cb(err);

          // Call the cb when both indexes have been created
          else if (!--todo)
            cb(null, inst);
        });
      });

      db.on('close', function(err) {
        console.log('Database connection closed.');
      });
    });
  });

  return inst;
};

module.exports = Index;

}).call(this);
