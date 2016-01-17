require("gq-core/lib/global");
var co = require("co");

var waterline = require("../Model");
var Waterline = require("waterline");


waterline.install(co.wrap(function*(wl) {
	try {
		setTimeout(function() {
			process.exit(0)
		}, 1000);

		var asset = yield waterline.collections.asset.create();

		console.log(asset);

	} catch (e) {
		console.error("QAQ", e)
	}
}));