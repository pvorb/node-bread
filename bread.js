var bake = require("bake"),
    Index = require("Index"),
    marked = require("marked");

// Main function
var bread = function(conf) {

	// later holds a reference to the Index object
	var index;

	// Intialize hooks.
	var hooks = {};

	// Parse contents with `marked()`
	hooks.__content = function(fn, prop) {
		return marked(prop.__content);
	};

	hooks.tags = function(fn, prop) {
		index.addTags(prop.tags);
	}

	// Add files to index
	hooks.__writeAfter = function(fn, prop) {
		index.add(prop);
	};

	// Write indexes, feeds and tag pages
	hooks.__complete = function(fn, prop) {
		if (conf.indexes)
			index.write(conf);
		if (conf.tags)
		 	index.writeTags(conf);
	};

	new Index(conf.dbinf, function(i) {
		// save ref to index
		index = i;

		// bake the bread
		bake(conf, hooks);
	});
};

module.exports = bread;
