var fs = require('fs');
var path = require('path');
var append = require('append');
var clone = require('clone');
var async = require('async');
var ejs = require('ejs');

module.exports = function write(reg, conf, cb) {
  console.log('Beginning to write index and tag files.');
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
                cb();
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

          var files = 0;
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
                  index.path.pattern.replace(/{{page}}/g, i + 1));

              // write the page to disk
              fs.writeFile(file, data, function (err) {
                if (err)
                  return cb(err);
                // callback at last
                console.log('  '+file+' written.');
                if (++files == pages.length && !--todo)
                  cb();
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

  if (reg.tags) {
    reg.tags = Object.keys(reg.tags);
    var tagDir = path.resolve(conf.root, dir.output, tags.directory);

    // Load templates concurrently
    async.parallel({
      tag: function (callback) {
        fs.readFile(path.resolve(dir.templates, tags.template), 'utf8',
            function (err, tpl) {
          var todo = reg.tags.length;
          for (var i = 0; i < reg.tags.length; i++) {(function (i) {
            var p = clone(conf.properties);

            var tag = reg.tags[i];
            p.title = tag;

            var tagFile = ejs.render(tpl, { locals: p });
            var file = path.resolve(tagDir, tag+'.html');

            fs.writeFile(file, tagFile, function (err) {
              if (err)
                return callback(err);
              console.log('  '+file+' written.');
              if (!--todo)
                return callback();
            });
          })(i);}
        });
      },
      index: function (callback) {
        fs.readFile(path.resolve(dir.templates, tags.index.template), 'utf8',
            function (err, tpl) {
          var p = clone(conf.properties);

          p.__tags = reg.tags;

          var index = ejs.render(tpl, { locals: p });
          var file = path.resolve(tagDir, tags.index.path);

          fs.writeFile(file, index, function (err) {
            if (err)
              return callback(err);
            console.log('  '+file+' written.');
            callback();
          });
        });
      }
    }, function (err) {
      if (err)
        return cb(err);

      cb();
    });
  } else
    return cb();
}
