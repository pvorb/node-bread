var fs = require('fs');
var path = require('path');
var props = require('props');
var dive = require('dive');
var ejs = require('ejs');
var async = require('async');
var clone = require('clone');
var append = require('append');

// Main function
var bake = function(conf, hooks, cb) {

  // File counter
  var todo = 0;

  if (typeof conf != 'object')
    return cb(new Error('parameter conf must be a valid configuration object'));

  // Set values for `inputDir`, `outputDir` and `tplDir`
  var root = conf.root || process.cwd();
  var inputDir = conf.directories.input || 'pub';
  var outputDir = conf.directories.output || 'pub';
  var tplDir = conf.directories.templates || 'tpl';

  inputDir = path.resolve(root, inputDir);
  outputDir = path.resolve(root, outputDir);
  tplDir = path.resolve(root, tplDir);

  // Set values for `fileExt`
  var fileExt = conf.fileExtensions || { txt: 'html' };
  var fileExtPattern
      = new RegExp('\.(' + Object.keys(fileExt).join('|') + ')$', 'i');

  // Status log
  console.log('Beginning to bake ' + inputDir + '.');

  // Dive into the public directory
  dive(inputDir, function(err, master) {
    // Throw errors
    if (err)
      return cb(err);

    // Matching variable
    var match;

    // Match the master-file's name against enabled file extensions
    if (match = master.match(fileExtPattern)) {

      // Get the file extension of the master file
      var masterExt = match[1];

      // Increase file counter
      ++todo;

      // Read the master-file's contents
      fs.readFile(master, 'utf8', function(err, data) {
        // Throw errors
        if (err)
          return cb(err);

        // Get the properties
        // `prop` is the file specific property object
        var prop = props(data);

        // Amend `prop` by properties in `conf.properties` if defined
        if (conf.properties)
          prop = append(clone(conf.properties), prop);

        // Assert that `prop.template` is set
        if (typeof prop.template == 'undefined')
          prop.template = 'default.tpl';

        // `__propBefore` hook
        if (hooks.__propBefore)
          hooks.__propBefore(master, prop, propBeforeCB);
        else
          propBeforeCB(null, prop);

        function propBeforeCB(err, prop) {
          if (err)
            return cb(err);

          // tasks for async
          var tasks = {};

          // Various property hooks
          for (var key in prop) {(function (prop, key) {
            if (hooks[key])
              tasks[key] = function (callback) {
                return hooks[key](master, prop, callback);
              };
            else
              tasks[key] = function (callback) {
                return callback(null, prop[key]);
              };
          })(prop, key);}

          // run tasks in parallel
          async.parallel(tasks, function (err, prop) {
            if (err)
              return cb(err);

            // `__propAfter` hook
            if (hooks.__propAfter)
              hooks.__propAfter(master, prop, propAfterCB);
            else
              propAfterCB(null, prop);

            function propAfterCB(err, prop) {
              if (err)
                return cb(err);

              // Read the template file
              fs.readFile(path.resolve(tplDir, prop.template), 'utf8',
                  function(err, result) {
                // Throw errors
                if (err)
                  return cb(err);

                // (Pre-)Insert the content (so ejs-tags in
                // `prop.__content` are parsed, too.
                result = result.replace(/<%=\s+__content\s+%>/g,
                    prop.__content);

                // Result's filename
                var resName = master.replace(fileExtPattern,
                    '.' + fileExt[masterExt]);

                // New file's path
                if (typeof prop._id == 'undefined') {
                  prop._id = resName.replace(inputDir, '');
                  prop._id = prop._id.replace(/\\/, '/');
                }

                // Render ejs-template
                result = ejs.render(result, { locals: prop });

                // Remove first slash
                if (/^\//.test(prop._id))
                  prop._id = prop._id.substring(1)

                // absolute path
                resName = path.resolve(outputDir, prop._id);

                // Write contents
                fs.writeFile(resName, result, function(err) {
                  // Throw errors
                  if (err)
                    return cb(err);

                  // `__written` hook
                  if (hooks.__writeAfter)
                    hooks.__writeAfter(master, prop, writeAfterCB);
                  else
                    writeAfterCB(null);

                  function writeAfterCB(err) {
                    if (err)
                      return cb(err);

                    // Log status on success
                    console.log('  * ' + resName + ' written.');

                    // When file counter is zero
                    if (!--todo) {
                      // `__complete` hook
                      if (hooks.__complete)
                        hooks.__complete(master, prop, cb);
                      else
                        return cb(null);
                    }
                  }
                });
              });
            }
          });
        }
      });
    }
  });
};

module.exports = bake;
