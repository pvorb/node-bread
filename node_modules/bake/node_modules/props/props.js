;(function() {

var yaml = require('yamlparser');

module.exports = function(str, div) {
  div = div || /\n\n\n|\r\n\r\n\r\n/;

  // `str` must be a string
  if (typeof str != 'string')
    str = str.toString();

  // trim string
  str = str.trim();

  var split;
  var result = {};
  var content;

  // If a match was found
  if ((split = str.split(div)).length > 0)
    try {
      // JSON
      if (split[0].charAt(0) == '{')
        result = JSON.parse(split[0]);
      // YAML
      else
        result = yaml.eval(split[0]);
    } catch (e) {
      return { __content: str };
    }
  else
    return { __content: str };

  delete split[0];
  // Join remaining
  str = split.join('\n\n\n');

  result.__content = str;
  return result;
};

}).call(this);
