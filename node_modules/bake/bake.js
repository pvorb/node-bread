var fs = require('fs');
var path = require('path');
var props = require('props');
var dive = require('dive');
var ejs = require('ejs');

// Main function
var bake = function(conf, hooks) {

  // File counter
  var todo = 0;

  // Ensure `conf` is an object
  if (typeof conf == 'string')
    conf = JSON.parse(conf);
  if (typeof conf != 'object')
    throw new Error('parameter conf must be a valid configuration object');

  // Ensure `hooks` is an object
  if (typeof hooks != 'object')
    hooks = { };

  // Set values for `inputDir`, `outputDir` and `tplDir`
  var inputDir = conf.directories.input || 'pub';
  var outputDir = conf.directories.output || 'pub';
  var tplDir = conf.directories.templates || 'tpl';

  inputDir = path.resolve(process.cwd(), inputDir);
  outputDir = path.resolve(process.cwd(), outputDir);
  tplDir = path.resolve(process.cwd(), tplDir);

  // Set values for `fileExt`
  var fileExt = conf.fileExtensions || { txt: 'html' };
  var fileExtPattern
      = new RegExp('\.(' + Object.keys(fileExt).join('|') + ')$', 'i');

  // Status log
  console.log('Beginning to bake ' + inputDir + '.\n');

  // Dive into the public directory
  dive(inputDir, function(err, master) {
    // Throw errors
    if (err) throw err;

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
        if (err) throw err;

        // Get the properties
        // `prop` is the file specific property object
        var prop = props(data);

        // Define `hasOwnProperty` shorthand
        prop.has = prop.hasOwnProperty;

        // Amend `prop` by properties in `conf.properties` if defined
        if (conf.properties != undefined)
          for (var key in conf.properties) {
            if (prop[key] == undefined)
              prop[key] = conf.properties[key];
          }

        // Assert that `prop.template` is set
        if (prop.template == undefined)
          prop.template = 'default.tpl';

        // `__propBefore` hook
        if (hooks.__propBefore != undefined)
          prop = hooks.__propBefore(master, prop);

        // Various property hooks
        for (var key in prop)
          if (hooks[key] != undefined)
            prop[key] = hooks[key](master, prop);

        // `__propAfter` hook
        if (hooks.__propAfter != undefined)
          prop = hooks.__propAfter(master, prop);

        // Read the template file
        fs.readFile(path.resolve(tplDir, prop.template), 'utf8',
            function(err, result) {
          // Throw errors
          if (err) throw err;

          // (Pre-)Insert the content (so ejs-tags in
          // `prop.__content` are parsed, too.
          result = result.replace(/<%=\s+__content\s+%>/g,
              prop.__content);

          // Result's filename
          var resName = master.replace(fileExtPattern,
              '.' + fileExt[masterExt]);

          // New file's path
          if (prop._id == undefined)
            prop._id = resName.replace(inputDir, '');

          // Remove first slash
          if (/^\//, prop._id)
            prop._id = prop._id.substring(1);

          // Add output dir
          resName = path.resolve(outputDir, prop._id);

          // Render ejs-template
          result = ejs.render(result, { locals: prop });

          // Write contents
          fs.writeFile(resName, result, function(err) {
            // Throw errors
            if (err) throw err;

            // `__written` hook
            if (hooks.__writeAfter != undefined)
              hooks.__writeAfter(master, prop);

            // Log status on success
            console.log('  ' + resName + ' written.\n');

            // When file counter is zero
            if (!--todo) {
              // `__complete` hook
              if (hooks.__complete != undefined)
                hooks.__complete(master, prop);

              // State final message
              console.log('Everything has been successfully baked!');
            }
          });
        });
      });
    }
  });
};

module.exports = bake;
