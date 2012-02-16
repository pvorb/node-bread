var append = require('append'),
    url = require('url'),
    path = require('path');

module.exports = function(str, opt) {
  if (typeof str == 'undefined')
    str = '';
  if (typeof str != 'string')
    str = str.toString();

  // default options
  var def = {
    mode: 'html',
    uri: false
  };

  // append given options to `def`
  opt = append(def, opt);

  // If a URI is defined, put the prefix in front of URLs.
  if (opt.uri) {
    var uri = url.parse(opt.uri);
    var host = uri.protocol + '//' + uri.host;
    var dir = path.dirname(uri.pathname)+'/';
    var all = opt.uri;

    //             attr        (protocol:? // host)|document
    var pattern = /(href|src)="(([^:"]+:)?\/\/[^"]+|[^"]+)"/gi;

    // Add 'http://foo.bar/' to URLs
    str = str.replace(pattern,
        function(match, key, value, protocol, offset, string) {
      // If the URL hasn't got a protocol and doesn't start with '//'
      if (typeof protocol == 'undefined' && value[1] != '/')
        // If the URL is absolute
      if (value[0] == '/')
        return key+'="'+host+value+'"';
      // If the URL is a hash tag
      else if (value[0] == '#')
        return key+'="'+all+value+'"';
      // If the URL is relative
      else {
        return key+'="'+host+path.normalize(dir+value)+'"';
      }
    });
  }

  // Escape HTML output
  if (opt.mode == 'html') {
    str = str.replace(/&/gi, '&amp;');
    str = str.replace(/</gi, '&lt;');
    str = str.replace(/>/gi, '&gt;');
    str = str.replace(/"/gi, '&quot;');
  }

  return str;
};
