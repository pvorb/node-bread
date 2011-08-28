var bread = require("../");

var conf = {
	dbinf: {
		host: "localhost",
		port: "27017",
		name: "index",
		collection: "pages"
	},
	directories: {
		input: "pub",
		output: "pub",
		templates: "tpl"
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
			pattern: /\/\d\/[^\/]+/,
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
			path : "feed.xml",
			template: "atom.tpl",
			limit: 10,
			sort: [["date", "desc"]]
		}
	],
	properties: {
		siteTitle: "My Site"
	}
};

bread(conf);
