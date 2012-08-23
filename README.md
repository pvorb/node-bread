[![build status](https://secure.travis-ci.org/pvorb/node-bread.png)](http://travis-ci.org/pvorb/node-bread)
# bread

![bread](https://raw.github.com/pvorb/node-bread/master/res/bread.png)

a file based static website/blog generator for node that uses [bake][bake],
[mongodb][mongodb-native] and [markdown][marked].

I’m using it for my personal website, [vorb.de][vorb.de]. It supports
normal pages (in any directory structure you like), customizable index 
pages and feeds as well as tag pages. Commenting functionality can be added
by using a service like [Disqus][disqus] or my own [comments][comments],
which also supports pingbacks.

So let’s see how you can bake your bread in node.

## Example

```javascript
var bread = require("bread");

// configuration object
var conf = {
  dbinf: { // MongoDB connection
    host: "localhost",
    port: "27017",
    name: "mywebsite",
    collection: "pages"
  },

  directories: {
    input: "pub",    // Look for files in this dir.
    output: "pub",   // Write files to this dir.
    templates: "tpl" // Look for templates in this dir.
  },

  fileExtensions: { // Replace markdown by html
    "mkd": "html",
    "md": "html",
    "mdown": "html",
    "markdown": "html"
  },

  // Array of indexes that shall be created
  indexes: [
    // Blog Index
    {
      title: "My Blog",
      pattern: /\/log\/[^\/]+/, // Index files matched by this pattern.
      path: {
        first: "/log/index.html",  // first page of the index
        pattern: "/log/index-{{page}}.html"  // other pages
      },
      template: "index.tpl",    // template
      limit: 8,                 // 8 links per page
      sort: [["date", "desc"]]  // newest first
    },
    // RSS Feed
    {
      title: "My Blog",
      pattern: /\/log\/[^\/]+/, // Add files matched by this pattern to the
                                // feed.
      path: "/log/feed.xml",    // feed url
      template: "rss.tpl",      // template
      limit: 10,                // total maximum
      sort: [["date", "desc"]]  // newest first
    }
  ],

  properties: {
    siteTitle: "My Site"
  }
};

bread(conf);
```

That's it for the moment. Extended documentation will soon follow in the [wiki][wiki].


## Bugs and Issues

If you encounter any bugs or issues, feel free to open an issue at
[github][issues].

## License

Copyright © 2011-2012 Paul Vorbach

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the “Software”), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


[vorb.de]: http://vorb.de/
[disqus]: http://disqus.com/
[comments]: //github.com/pvorb/node-comments
[bake]: //github.com/pvorb/node-bake
[mongodb-native]: //github.com/christkv/node-mongodb-native
[marked]: //github.com/chjj/marked
[wiki]: //github.com/pvorb/node-bread/wiki
[issues]: //github.com/pvorb/node-bread/issues
[mit]: http://vorb.de/license/mit.html
