var fs = require('fs');
var path = require('path');
var append = require('append');
var clone = require('clone');
var async = require('async');
var ejs = require('ejs');

module.exports = function write(reg, conf, cb) {
  async.parallel({
    indexes: function (callback) {
      indexes(reg, conf, callback);
    },
    tags: function (callback) {
      tags(reg, conf, callback);
    }
  }, cb);
};

function indexes(reg, conf, cb) {
  var dir = conf.directories;
  var output = path.resolve(conf.confdir, '..', dir.output);

    // total number of indexes
    var todo = conf.indexes.length;

  // for each index, lookup documents and then write them to disk
  conf.indexes.forEach(function (index) {
    // read template
    fs.readFile(path.resolve(dir.templates, index.template), 'utf8',
        function (err, tpl) {

      // extend index's properties
      var p = (typeof conf.properties == 'object') ?
        append(clone(conf.properties), index.properties) :
        clone(index.properties);

      // set title
      p.title = index.title;

      // if we've got a single page index (e.g. feeds)
      if (typeof index.path == 'string')
        // get documents
        reg.get({ _id: new RegExp(index.pattern) }, {}, index.sort, index.limit,
            function (err, page) {
          page.toArray(function (err, documents) {
            if (err)
              return cb(err);

            p.__docs = documents;

            var data = ejs.render(tpl, { locals: p });

            // get filename and write the file to disk
            var file = path.resolve(output, index.path);
            fs.writeFile(file, data, function (err) {
              if (err)
                return cb(err);
              console.log('  '+file+' written.');
              if (!--todo)
                cb(null, file);
            });
          });
        });
      // if we've got a multi page index (e.g. blog archives)
      else
        // get documents as pages
        reg.getPages({ _id: new RegExp(index.pattern) }, {}, index.sort,
            index.limit, function (err, pages) {
          if (err)
            return cb(err);

          var files = [];

          // for each page, own scope
          for (var i = 0; i < pages.length; i++) {(function (i) {
            var page = pages[i];
            page.toArray(function (err, documents) {
              if (err)
                return cb(err);
              p.__docs = documents;

              var data = ejs.render(tpl, { locals: p });

              // get filename for page
              if (i == 0)
                var file = path.resolve(output, index.path.first);
              else
                var file = path.resolve(output,
                  index.path.pattern.replace(/{{page}}/g, i));

              // write the page to disk
              fs.writeFile(file, data, function (err) {
                if (err)
                  return cb(err);
                // callback at last
                console.log('  '+file+' written.');
                if (files.length == pages.length && !--todo)
                  cb(null, files);
              });
            });
          })(i);}
        });
    });
  });
}

function tags(reg, conf, cb) {
  var dir = conf.directories;
  var tags = conf.tags;

  if (reg.tags)
    // Load templates concurrently
    async.parallel({
      tag: function (callback) {
        fs.readFile(path.resolve(dir.templates, tags.template), 'utf8',
          callback);
      },
      index: function (callback) {
        fs.readFile(path.resolve(dir.templates, tags.index.template), 'utf8',
          callback);
      }
    }, function (err, tpl) {
      if (err)
        return cb(err);

      return cb(null);

    });
}
