require("gq-core/lib/global");
var co = require("co");

var waterline = require("../Model");
var Waterline = require("waterline");


waterline.install(co.wrap(function*(wl) {
	try {
		setTimeout(function() {
			process.exit(0)
		}, 1000);

		var user = yield waterline.collections.user.findOne(8);
		console.log(user);
		var member = yield waterline.collections.member_type.findOrCreate({
			car_flag: "无情车主",
			stock: 100,
			assist: 1000
		});
		// var member = yield waterline.collections.member.findOne(1);
		console.log(member = JSON.parse(JSON.stringify(member)))

		delete member.id
		var asset = yield waterline.collections.asset.create(member);
		console.log(asset)
		user.asset = asset;
		console.log(yield user.save());

		var user = yield waterline.collections.user.findOne(8).populateAll();
		console.log(user);

	} catch (e) {
		console.error("QAQ", e)
	}
}));