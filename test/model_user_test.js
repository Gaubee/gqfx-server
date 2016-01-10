require("gq-core/lib/global");
var co = require("co");

var waterline = require("../Model");
var Waterline = require("waterline");


waterline.install(co.wrap(function*(wl) {
	// wl.collections.user.create({
	// 	user_name: "Gaubee"
	// }).then(console.log).catch(e => console.log("ERROR:", e))
	try {
		// var users = yield [wl.collections.user.create({
		// 	phone_number: "15659444549",
		// 	password: "123456",
		// 	// mailing_address: {
		// 	// 	province: "福建省",
		// 	// 	details: "呵呵99号"
		// 	// }
		// }), wl.collections.user.create({
		// 	phone_number: "18046048662",
		// 	password: "123456",
		// 	// mailing_address: {
		// 	// 	province: "广东省",
		// 	// 	details: "星河100号"
		// 	// }
		// })];
		// var u0 = users[0];
		// var u1 = users[1];
		// u1.recommender = u0;
		// yield u1.save();

		// console.log(yield wl.collections.user.findOne(u1.id).populateAll())

		// console.log(yield wl.collections.user.find())

		// console.log(yield wl.collections.user.findOne(3))

		// console.log(yield wl.collections.user.find())

		// console.log(yield wl.collections.user.find({phone_number:"15659444549"}))

		setTimeout(function() {
			process.exit(0)
		}, 1000);

		// var users = yield wl.collections.user.create({
		// 	phone_number: "15659444560",
		// 	password: "123456",
		// 		// mailing_address: {
		// 		// 	province: "福建省",
		// 		// 	details: "呵呵99号"
		// 		// }
		// });

		// console.log(users);

		// users.phone_number = "15659444561";

		// var users = yield wl.collections.user.create(users);

		// console.log(users);

		var userIds = [11, 6, 4, 7, 8]
		console.time()
		for (var i = 0; i < 100; i += 1) {
			console.log((yield waterline.collections.user.find(userIds)).map(u => u.id))
		}
		console.timeEnd()

		console.time()
		for (var i = 0; i < 100; i += 1) {
			console.log((yield userIds.map(function(user_id) {
				return waterline.collections.user.findOne(user_id);
			})).map(u => u.id));
		}
		console.timeEnd()



		// console.log(Object.keys(wl.collections.user).filter(k=>!k.indexOf("findBy")))

		// var users = yield waterline.collections.user.findByPhone_number("15659444551")
		// console.log(users[0].constructor.toString(),users[0].constructor.prototype);
		// console.log(waterline._collections.forEach(function (C) {
		// 	console.log(users.constructor.toString() ,C.toString())
		// }));
		// console.log(users instanceof wl.collections.user)
	} catch (e) {
		console.error("QAQ", e)
	}
}));