var fs = require('fs');
var path = require('path');
var ejs = require('ejs');
var clone = require('clone');
var append = require('append');

var Index = require('./Index.js');
var parseDates = require('./parse-dates.js');

// Index.write
Index.prototype.write = function(cb) {

  // Shortcuts
  var opt = this.opt;
  var root = opt.root;
  var ind = opt.indexes;
  var db = this.db;
  var c = this.collection;

  // Number of indexes to write
  var todo = ind.length;

  // Count all objects in the collection
  c.count(function(err, count) {
    if (count == 0)
      return;

    // Walk index definitions
    ind.forEach(function(index) {

      // Set page to 1
      var page = 1;
      var p = append({}, index.properties);

      // Set p.title if defined
      if (typeof index.title != 'undefined')
        p.title = index.title;

      // Read the template file
      fs.readFile(path.resolve(opt.confdir, 'templates', index.template),
          'utf8', function(err, template) {
        if (err)
          return cb(err);

        var query = {};
        // Set id pattern
        if (index.pattern)
          query._id = new RegExp(index.pattern);

        // Set sorting option
        var opt = {
          sort: index.sort
        }

        // If limit is set, set it
        if (index.limit)
          opt.limit = index.limit;

        // If index.path is an string we're making a single file
        if (typeof index.path == 'string') {

          // Find all docs
          c.find(query, opt).toArray(function(err, docs) {
            if (err)
              return cb(err);

            // Parse the dates
            docs = parseDates(docs);

            // Extend properties by docs
            p.__docs = docs;

            // Render template
            var data = ejs.render(template, { locals: p });

            // New file name
            var filename = path.resolve(root, index.path);

            // Write the file
            fs.writeFile(filename, data,
                function(err) {
              if (err)
                return cb(err);

              // Log on success
              console.log('  ' + filename + ' written.');
            });

            // decrease todo
            if (!--todo) {
              if (typeof cb != 'undefined')
                cb();
              try {
                db.close();
              } catch (e) {}
              return;
            }
          });
        }
        // If index.path is an object we're making multiple files
        else {
          // offset
          opt.skip = 0;

          // as long as there are docs left, make another page
          while (opt.skip < count) {
            // find all docs (paginated)
            c.find(query, opt).toArray(function(err, docs) {
              if (err)
                return cb(err);

              // Parse the dates
              docs = parseDates(docs);

              // Ref in props
              p.__docs = docs;
              p.__page = page;

              // Render the template
              var data = ejs.render(template, { locals: p });

              // indexing dir
              var filename;

              // the first page has a different filename than the others
              if (page == 1)
                filename = path.resolve(root, index.path.first);
              else
                filename = path.resolve(root,
                    index.path.pattern.replace(new RegExp('{{page}}', 'g'),
                        page));

              // Write the file
              fs.writeFile(filename, data, function(err) {
                if (err)
                  return cb(err);

                // Log on success
                console.log('  ' + filename + ' written.');
              });

              // decrease todo
              if (!--todo) {
                if (typeof cb != 'undefined')
                  cb();
                try {
                  db.close()
                } catch (e) {}
                return;
              }

              // increase page
              page++;
            });

            // increase offset
            opt.skip += index.limit;
          }
        }
      });
    });
  });
};
