var bread = require('../../bread.js');
var path = require('path');
var colors = require('colors');

var conf = {
  confdir: __dirname,
  root: path.resolve(__dirname, '..'),

  db: {
    host: "localhost",
    port: 27017,
    name: "test",
    collection: "test"
  },
  directories: {
    input: "pub",
    output: "pub",
    templates: ".conf/templates"
  },
  fileExtensions: {
    "mkd": "html",
    "md": "html",
    "mdown": "html",
    "markdown": "html"
  },
  indexes: [
    {
      title: "Blog",
      pattern: /\d\d-.+/,
      path: {
        first: "index.html",
        pattern: "index-{{page}}.html"
      },
      template: "index.tpl",
      limit: 2,
      sort: [["date", "desc"]]
    },
    {
      title: "Blog",
      pattern: /\d\d-.+/,
      path : "feed.xml",
      template: "atom.tpl",
      limit: 10,
      sort: [["date", "desc"]]
    }
  ],
  tags: {
    directory: 'tag',
    template: 'tag.tpl',
    sort: [['date', 'desc']],
    index: {
      path: 'index.html',
      template: 'tag-index.tpl'
    }
  },
  properties: {
    siteTitle: "My Site"
  }
};

bread(conf, function (err) {
  if (err) {
    console.log('not ok'.red);
    throw err;
  }

  console.log('ok'.green);
});
