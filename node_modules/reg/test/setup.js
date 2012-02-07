var Reg = require('../reg.js');
var path = require('path');

var mongo = require('mongodb');
var dbConnector = new mongo.Db('test',
    new mongo.Server('localhost', 27017));

module.exports = function setup(cb) {

  dbConnector.open(function (err, db) {
    if (err)
      return cb(err);

    module.exports.db = db;

    db.on('close', function () {
      console.log('Closed connection to the database.');
    });

    db.collection('test', function (err, collection) {
      if (err)
        return cb(err);

      return cb(null, collection);
    });

  });

};
