var bake = require("bake"),
    Index = require("Index"),
    marked = require("marked"),
    isodate = require("isodate");

// Main function
var bread = function(conf) {

	// later holds a reference to the Index object
	var index;

	// Initialize hooks.
	var hooks = {};

	// Parse contents with `marked()`
	hooks.__content = function(fn, prop) {
		return marked(prop.__content);
	};

	// Parse ISO 8601 dates
	hooks.date = function(fn, prop) {
		var date;
		// If it's not a date, try parse it
		if (typeof prop.date !== "date") {
			try {
				date = isodate(prop.date);
			} catch (err) {
				date = new Date(prop.date);
			}
		} else {
			date = prop.date;
		}
		return date;
	};

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

		// bake some bread
		bake(conf, hooks);
	});
};

module.exports = bread;
