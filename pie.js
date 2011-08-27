var bake = require("bake"),
    Index = require("Index"),
    mongodb = require("mongodb"),
    marked = require("marked");

// Main function
var pie = function(conf) {

	// later holds a reference to the Index object
	var index;

	// Intialize hooks.
	var hooks = {};

	// Parse contents with `marked()`
	hooks.__content = function(fn, prop) {
		return marked(prop.__content);
	};

	// Add files to index
	hooks.__writeAfter = function(fn, prop) {
		index.add(prop);
	};

	// Write indexes, feeds and tag pages
	hooks.__complete = function(fn, prop) {
		if (conf.indexes != undefined)
			index.write(conf);
		// if (conf.tags != undefined)
		// 	index.writeTags(conf.tags);
	};

	new Index(conf.dbinf, function(i) {
		// save ref to index
		index = i;

		// Bake the pie
		bake(conf, hooks);
	});
};

module.exports = pie;
