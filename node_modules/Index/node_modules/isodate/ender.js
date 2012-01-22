!function($) {
  var ISODate = require('isodate');

  $.ender({
    isodate: function isodate(string) {
      return new ISODate(string);
    }
  });
}(ender);
