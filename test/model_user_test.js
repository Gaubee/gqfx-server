require("gq-core/lib/global");
var co = require("co");

require("../Model").install(co.wrap(function*(wl) {
	// wl.collections.user.create({
	// 	user_name: "Gaubee"
	// }).then(console.log).catch(e => console.log("ERROR:", e))
	try {
		// var users = yield [wl.collections.user.create({
		// 	phone_number: "15659444549",
		// 	password: "123456",
		// 	mailing_address: {
		// 		province: "福建省",
		// 		details: "呵呵99号"
		// 	}
		// }), wl.collections.user.create({
		// 	phone_number: "18046048662",
		// 	password: "123456",
		// 	mailing_address: {
		// 		province: "广东省",
		// 		details: "星河100号"
		// 	}
		// })];
		// var u0 = users[0];
		// var u1 = users[1];
		// u1.recommender = u0;
		// yield u1.save();

		// console.log(yield wl.collections.user.findOne(u1.id).populateAll())

		console.log(yield wl.collections.user.find())

		setTimeout(function() {
			process.exit(0)
		}, 1000);
	} catch (e) {
		console.error("QAQ", e)
	}
}));