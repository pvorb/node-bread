var isodate = require("isodate");

module.exports = function(docs) {
	for (var i = 0; i < docs.length; i++)
		if (docs[i].date !== undefined)
			docs[i].date = isodate(docs[i].date);

	return docs;
};
