exports.install = install;
var co = require("co");

function install(classMap, RedisClient) {
	var proto = {
		getLogsStatistics: co.wrap(function*(options) {
			var UserLogCon = classMap.get("UserLog");
			var UserLogModel = yield UserLogCon.getModel();
			var query = UserLogModel.find();

			var type_map = {
				"user-recharge": "充值",
				"transfers-to-user": "转账",
				"confirm-withdrawals-arrive": "提现",
				"user-create-user-with-membertype": "新建用户",
				"user-upgrade-asset-level": "用户升级",
			};
			var criteria = {
				owner: this.model.id,
				type: Object.keys(type_map)
			};
			var from = options.from;
			var to = options.to;
			if (from || to) {
				var createdAt = criteria.createdAt = {};
				from && (createdAt[">="] = from);
				to && (createdAt["<="] = to);
			}

			query.populate("owner");
			query.where(criteria);

			var logs = yield query;
			var AssetCon = classMap.get("Asset");
			var UserCon = classMap.get("User");

			var totle_income = 0; //收入
			var totle_outgo = 0; //支出
			var statistics = [];
			logs.forEach(log => {
				// console.log(Object.keys(log), log.id, log.owner)
				if (!log.owner) {
					console.log(log)
					return
				}
				var statistics_item = {
					type: log.type,
					type_name: type_map[log.type],
					amount: 0,
					fee: 0,
					createdAt: log.createdAt,
					log_id: log.id
				};
				try {

					switch (log.type) {
						case "user-recharge":
							statistics_item.amount = log.data.amount;
							totle_income += statistics_item.amount;
							break;
						case "transfers-to-user":
							statistics_item.amount = log.data.amount;
							statistics_item.fee = log.data.fee;
							totle_income += statistics_item.fee;
							break;
						case "confirm-withdrawals-arrive":
							statistics_item.amount = log.data.amount;
							statistics_item.fee = log.data.fee;
							totle_outgo += statistics_item.amount;
							break;
						case "user-create-user-with-membertype":
							statistics_item.amount = log.data.member_type.price;
							break;
						case "user-upgrade-asset-level":
							statistics_item.amount = log.data.amount;
							statistics_item.fee = log.data.fee;
							totle_income += statistics_item.amount + statistics_item.fee;
							break;
					}
					statistics.push(statistics_item);
				} catch (e) {
					console.log(log)
				}
			});
			return {
				list: statistics,
				totle_income: totle_income,
				totle_outgo: totle_outgo
			}
		})
	};
	return proto;
}