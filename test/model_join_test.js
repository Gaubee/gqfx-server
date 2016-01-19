require("gq-core/lib/global");
var co = require("co");

var waterline = require("../Model");
var Waterline = require("waterline");


waterline.install(co.wrap(function*(wl) {
	try {
		setTimeout(function() {
			process.exit(0)
		}, 1000);

		var users = yield waterline.collections.user.find({
			where: {
				password: {
					contains: "ae99763b9e",
				},
			},
			// "asset.car_flag": {
			// 	contains: "车主",
			// },
			// asset: {
			// 	car_flag: {
			// 		contains: "车主",
			// 	}
			// },
			joins: [{
				parent: 'user',
				parentKey: 'asset',
				child: 'asset',
				childKey: 'id',
				select: ['car_flag',
					'stock',
					'assist',
					'balance',
					'rebates_chain',
					'level',
					'apply_wd_status',
					'apply_wd_amount',
					'apply_wd_totle_amount',
					'apply_wd_fee_rate',
					'id',
					'createdAt',
					'updatedAt'
				],
				alias: 'asset',
				removeParentKey: true,
				model: true,
				collection: false,
				criteria: {
					where: {
						car_flag: {
							contains: "车主"
						}
					}
				}
			}]
		})//.where();

		console.log(users.map(u => u.asset));

		// var assets = yield waterline.collections.user.find({
		// 	where: {
		// 		car_flag: {
		// 			contains: "车主"
		// 		}
		// 	}
		// });

		// console.log(assets);

	} catch (e) {
		console.error("QAQ", e.stack)
	}
}));