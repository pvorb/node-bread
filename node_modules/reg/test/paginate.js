var Reg = require('../reg.js');
var setup = require('./setup.js');

setup(function (err, collection) {
  if (err)
    return console.error(err);

  new Reg(collection, function (err, reg) {
    if (err)
      return console.error(err);

    reg.getPages({ _id: /^log\/\d\d-/ }, {}, [[ 'created', 'desc' ]], 10,
        function (err, cursors) {
      if (err)
        return console.error(err);

      var todo = cursors.length;

      // for each page
      for (var i in cursors) {
        console.log('Page '+i);
        cursors[i].each(function (err, doc) {
          if (err)
            return console.error(err);
          if (doc !== null)
            console.log(doc);
          else
            if (!--todo)
              setup.db.close();
        });
      }
    });
  });
});
