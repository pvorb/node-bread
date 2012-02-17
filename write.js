var fs = require('fs');
var path = require('path');
var append = require('append');
var clone = require('clone');
var dive = require('dive');
var async = require('async');
var ejs = require('ejs');
var esc = require('esc');

module.exports = function write(reg, conf, cb) {
  console.log('Beginning to write index and tag files.');
  async.parallel({
    indexes: function (callback) {
      indexes(reg, conf, function (err) {
        console.log('Index files written.');
        callback(err);
      });
    },
    tags: function (callback) {
      tags(reg, conf, function (err, rest) {
        console.log('Tag files written.');
        callback(err);
      });
    },
    autoindex: function (callback) {
      autoindex(reg, conf, function (err, rest) {
        console.log('Autoindex files written.');
        callback(err);
      });
    }
  }, cb);
};

function indexes(reg, conf, cb) {
  var dir = conf.directories;
  var output = path.resolve(conf.root, dir.output);

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

      // add esc to p
      p.esc = esc;

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
              console.log('  * '+file+' written.');
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

          // if no files are in the index, decrease todo
          if (pages.length == 0 && !--todo)
            return cb();

          // for each page, own scope
          for (var i = 0, files = 0; i < pages.length; i++) {(function (i) {
            var page = pages[i];
            page.toArray(function (err, documents) {
              if (err)
                return cb(err);
              p.__docs = documents;

              // get filename for page
              if (i == 0)
                var file = path.resolve(output, index.path.first);
              else
                var file = path.resolve(output,
                  index.path.pattern.replace(/{{page}}/g, i + 1));

              var fileContents = ejs.render(tpl, { locals: p });

              // write the page to disk
              fs.writeFile(file, fileContents, function (err) {
                if (err)
                  return cb(err);
                // callback at last
                console.log('  * '+file+' written.');
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
    var tagDir = path.resolve(conf.root, dir.output, tags.directory);

    // Load templates concurrently
    async.parallel({
      tag: function (callback) {
        fs.readFile(path.resolve(dir.templates, tags.template), 'utf8',
            function (err, tpl) {
          var todo = reg.tags.length;

          // for each tag
          reg.tags.toArray().forEach(function (tag) {
            var p = clone(conf.properties);

            p.esc = esc;
            p.title = tag;

            // get docs with tag
            reg.get({ tags: tag }, {}, tags.sort, 0, function (err, docs) {
              if (err)
                return callback(err);

              docs.toArray(function (err, docs) {
                if (err)
                  return callback(err);

                p.__docs = docs;

                var file = path.resolve(tagDir, tag+'.html');
                var fileContents = ejs.render(tpl, { locals: p });

                // write tag file
                fs.writeFile(file, fileContents, function (err) {
                  if (err)
                    return callback(err);
                  console.log('  * '+file+' written.');
                  if (!--todo)
                    return callback();
                });
              });
            });
          });
        });
      },
      index: function (callback) {
        fs.readFile(path.resolve(dir.templates, tags.index.template), 'utf8',
            function (err, tpl) {
          var p = clone(conf.properties);

          p.__tags = reg.tags.toArray();

          var file = path.resolve(tagDir, tags.index.path);
          var fileContents = ejs.render(tpl, { locals: p });

          fs.writeFile(file, fileContents, function (err) {
            if (err)
              return callback(err);
            console.log('  * '+file+' written.');
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

function autoindex(reg, conf, cb) {
  var pubDir = path.resolve(conf.root, conf.directories.output);
  var tplDir = conf.directories.templates;

  // dive down the directory tree
  dive(pubDir, { directories: true, files: false, recursive: true },
      function (err, dir) {
    if (err)
      return cb(err);

    // normalize dir and remove pubDir
    var dirname = dir.replace(path.normalize(pubDir + '/'), '');
    // normalize slashes
    dirname = dirname.replace(new RegExp('\\\\', 'g'), '/');

    for (var i in conf.autoindex) {(function (index) {
      if (dirname.match(new RegExp(index.pattern))) {
        async.parallel({
          tpl: function (callback) {
            // read template
            fs.readFile(path.resolve(tplDir, index.template), 'utf8',
                function (err, tpl) {
              if (err)
                return callback(err);
              callback(null, tpl);
            });
          },
          files: function (callback) {
            // read directory
            fs.readdir(dir, function (err, files) {
              if (err)
                return callback(err);
              if (!files.length)
                return callback(null, files);

              var tasks = [];
              // for each file
              for (var i = 0; i < files.length; i++) {(function (i, file) {
                // add new task
                tasks[i] = function (callback) {
                  // get stats
                  fs.stat(path.resolve(dir, file), function (err, stats) {
                    if (stats.isDirectory()
                        && (new RegExp(index.directory.match)).test(file)
                        && !(new RegExp(index.directory.filter)).test(file))
                      callback(null, file + '/');
                    else if (stats.isFile()
                        && (new RegExp(index.file.match)).test(file)
                        && !(new RegExp(index.file.filter)).test(file))
                      callback(null, file);
                    else
                      callback(null, null);
                  });
                };
              })(i, files[i]);}

              // run parallel
              async.parallel(tasks, function (err, files) {
                callback(null, files.filter(function (elem) {
                  return elem !== null;
                }));
              });
            });
          }
        }, function (err, data) {
          if (err)
            return cb(err);
          var p = clone(conf.properties);
          p.__dir = dirname;
          p.__files = data.files;
          p.title = dirname.split('/').pop();

          var file = path.resolve(dir, index.path);
          var fileContents = ejs.render(data.tpl, { locals: p });

          // write generated index
          fs.writeFile(file, fileContents, function (err) {
            if (err)
              return cb(err);
            console.log('  * '+file+' written.');
          });
        });
      }
    })(conf.autoindex[i])}
  }, cb);
}
