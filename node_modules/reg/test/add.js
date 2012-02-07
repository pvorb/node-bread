var Reg = require('../reg.js');
var setup = require('./setup.js');

setup(function (err, collection) {
  if (err)
    return console.error(err);

  new Reg(collection, function (err, reg) {
    if (err)
      return console.error(err);

    function cb (err) {
      if (err)
        return console.error('error');

      console.log('saved document.');
    };

    reg.save('log/01-test', { title: 'Test', created: new Date() }, cb);
    reg.save('log/02-test', { title: 'Test', created: new Date() }, cb);
    reg.save('log/03-test', { title: 'Test', created: new Date() }, cb);
    reg.save('log/04-test', { title: 'Test', created: new Date() }, cb);
    reg.save('log/05-test', { title: 'Test', created: new Date() }, cb);
    reg.save('log/06-test', { title: 'Test', created: new Date() }, cb);
    reg.save('log/07-test', { title: 'Test', created: new Date() }, cb);
    reg.save('log/08-test', { title: 'Test', created: new Date() }, cb);
    reg.save('log/09-test', { title: 'Test', created: new Date() }, cb);
    reg.save('log/10-test', { title: 'Test', created: new Date() }, cb);
    reg.save('log/11-test', { title: 'Test', created: new Date() }, cb);
    reg.save('log/12-test', { title: 'Test', created: new Date() }, cb);
    reg.save('log/13-test', { title: 'Test', created: new Date() }, cb);
    reg.save('log/14-test', { title: 'Test', created: new Date() }, cb);
    reg.save('log/15-test', { title: 'Test', created: new Date() }, cb);
    reg.save('log/16-test', { title: 'Test', created: new Date() }, cb);
    reg.save('log/17-test', { title: 'Test', created: new Date() }, cb);
    reg.save('log/18-test', { title: 'Test', created: new Date() }, cb);
    reg.save('log/19-test', { title: 'Test', created: new Date() }, cb);
    reg.save('log/20-test', { title: 'Test', created: new Date() }, cb);
    reg.save('log/21-test', { title: 'Test', created: new Date() }, cb);
    reg.save('log/22-test', { title: 'Test', created: new Date() }, cb);
    reg.save('log/23-test', { title: 'Test', created: new Date() }, cb);
    reg.save('log/24-test', { title: 'Test', created: new Date() }, cb);
    reg.save('log/25-test', { title: 'Test', created: new Date() }, cb);
    reg.save('log/26-test', { title: 'Test', created: new Date() }, cb);
    reg.save('log/27-test', { title: 'Test', created: new Date() }, cb);
  });
});
