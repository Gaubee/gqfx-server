exports.install = install;
var RedisClient = require("../../Model/redis_index");
var co = require("co");

function install(classMap, RedisClient) {
	var type_map = {
		"user-recharge": "充值",
		"transfers-to-user": "转账",
		"confirm-withdrawals-arrive": "提现",
		"user-create-user-with-membertype": "新建用户",
		"user-upgrade-asset-level": "用户升级",
	};
	var types = Object.keys(type_map);
	var file_prefix = "GQFX-SERVER-clearing_Logs_Statistics:";

	var proto = {
		getLogsStatistics: co.wrap(function*(options) {
			var UserLogCon = classMap.get("UserLog");
			var UserLogModel = yield UserLogCon.getModel();
			var query = UserLogModel.find();

			var filter_types = Array.isArray(options.filter_types) ?
				options.filter_types :
				(
					String.isString(options.filter_types) ?
					[options.filter_types] :
					types
				);
			var criteria = {
				type: types.filter(key => filter_types.indexOf(key) !== -1)
			};
			var from = options.from;
			var to = options.to;
			if (from || to) {
				var createdAt = criteria.createdAt = {};
				from && (createdAt[">="] = from);
				to && (createdAt["<="] = to);
			}
			var start_id = options.start_id;
			var end_id = options.end_id;
			if (start_id || end_id) {
				var id = criteria.id = {};
				start_id && (id[">"] = start_id);
				end_id && (id["<="] = end_id);
			}
			console.log(criteria);

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
					// console.log(log)
					return
				}
				var statistics_item = {
					owner: UserCon.getInstance(log.owner, true),
					asset: AssetCon.findOne(log.owner.asset, true),
					type: log.type,
					type_name: type_map[log.type],
					amount: 0,
					fee: 0,
					createdAt: log.createdAt,
					log_id: log.id,
					income: 0,
					outgo: 0,
				};
				try {
					switch (log.type) {
						case "user-recharge":
							statistics_item.amount = log.data.amount;
							statistics_item.fee = log.data.fee || 0;

							statistics_item.income = statistics_item.amount;

							totle_income += statistics_item.amount;
							break;
						case "transfers-to-user":
							statistics_item.amount = log.data.amount;
							statistics_item.fee = log.data.fee;
							statistics_item.payee = /*yield*/ UserCon.findOne(log.data.payee.id, true);
							statistics_item.payee_asset = co(function*() {
								var payee = yield statistics_item.payee;
								return yield payee.getAsset()
							});

							statistics_item.income = statistics_item.fee;

							totle_income += statistics_item.fee;
							break;
						case "confirm-withdrawals-arrive":
							statistics_item.amount = log.data.money;
							statistics_item.fee = log.data.fee;

							statistics_item.outgo = statistics_item.amount;

							totle_outgo += statistics_item.amount;
							break;
						case "user-create-user-with-membertype":
							statistics_item.amount = log.data.member_type.price;
							statistics_item.new_user = /*yield*/ UserCon.findOne(log.data.new_user.id, true);
							statistics_item.new_user_asset = co(function*() {
								var new_user = yield statistics_item.new_user;
								return yield new_user.getAsset()
							});

							break;
						case "user-upgrade-asset-level":
							statistics_item.amount = log.data.price;
							statistics_item.fee = log.data.fee;

							statistics_item.old_data = log.data.old_data;
							statistics_item.new_data = log.data.new_data;


							statistics_item.income = statistics_item.amount + statistics_item.fee;

							totle_income += statistics_item.income;
							break;
					}
					statistics.push(statistics_item);
				} catch (e) {
					// console.log(log)
				}
			});
			statistics = yield statistics;
			return {
				list: statistics,
				totle_income: totle_income,
				totle_outgo: totle_outgo
			}
		}),
		// 结算缓冲金额
		clearingAssetCache: co.wrap(function*(options) {

			/*
			 * 获取用户日志锚点
			 */
			var AdminCon = classMap.get("Admin");
			var UserLogCon = classMap.get("UserLog");
			var UserLogModel = yield UserLogCon.getModel();
			var user_logs = yield UserLogModel.find({
				limit: 1,
				sort: "id DESC"
			});
			var laset_user_log = user_logs[0];
			var config = yield AdminCon.getConfig();
			if (!laset_user_log || config.clearing_point === laset_user_log.id) {
				console.log(config.clearing_point)
				throwE("无可结算数据")
			}

			/*
			 * 执行结算
			 */
			var UserCon = classMap.get("User");
			var AssetCon = classMap.get("Asset");
			var assets = yield AssetCon.find({
				cache_balance: {
					">": 0
				},
				cache_assist: {
					">": 0
				}
			}, true);
			var asset_attributes = (yield AssetCon.getModel())._attributes;
			yield assets.map(co.wrap(function*(asset) {
				var asset_model = asset.model;
				var log_keys = [
					"balance",
					"assist",
					"cache_balance",
					"cache_assist",
				];

				/*
				 * 旧数据的备份
				 */
				var old_data = {};
				log_keys.forEach(key => old_data[key] = asset_model[key]);

				/*
				 * 结算
				 */
				asset_model.balance += asset_model.cache_balance;
				asset_model.cache_balance = 0;
				asset_model.assist += asset_model.cache_assist;
				asset_model.cache_assist = 0;

				/*
				 * 新数据的信息
				 */
				var new_data = {};
				log_keys.forEach(key => new_data[key] = asset_model[key]);

				//保存与打印日志
				yield [asset.save(), UserLogCon.create({
					owner: asset.owner,
					type: "clearing-cache",
					log: `用户结算：${asset_attributes.balance.title}:￥${old_data.cache_balance}，${asset_attributes.assist.title}:￥${old_data.cache_assist}`,
					data: {
						old_data: old_data,
						new_data: new_data,
					}
				})];
			}));
			/*
			 * 记录用户日志锚点
			 */
			return yield AdminCon.setConfig({
				//上一次结算的用户日志节点
				before_clearing_point: config.clearing_point,
				//这次结算到的用户日志节点
				clearing_point: laset_user_log && laset_user_log.id
			});
		}),
		// 结算报表
		clearingLogsStatistics: co.wrap(function*(options) {
			// 执行结算
			var config = yield this.clearingAssetCache();
			// 获取报表数据
			var logs_statistics = (yield this.getLogsStatistics({
				start_id: config.before_clearing_point,
				end_id: config.clearing_point
			})).list;
			console.log(config, logs_statistics)
				// 整理出不同表的数据
			logs_statistics_map = {};
			logs_statistics.forEach(statistics_item => {
				var logs = logs_statistics_map[statistics_item.type] || (logs_statistics_map[statistics_item.type] = {
					list: [],
					income: 0,
					outgo: 0,
				});
				logs.list.push(statistics_item);
				logs.income += statistics_item.income;
				logs.outgo += statistics_item.outgo;
			});
			logs_statistics_map = Object.keys(logs_statistics_map).map(key => {
				logs_statistics_map[key].type = key;
				return logs_statistics_map
			});
			//写入数据库中备份
			var redis_client = yield RedisClient.getClient();

			var logs_statistics_map_json = JSON.stringify(logs_statistics_map);
			yield redis_client.thunk.set([file_prefix + (new Date).toISOString(), logs_statistics_map_json]);

			return logs_statistics_map;
		}),
		// 获取历史的结算报表数据名
		getHistoryClearingLogsStatisticsName: co.wrap(function*(options) {
			var redis_client = yield RedisClient.getClient();
			return yield redis_client.thunk.keys([file_prefix + "*"]);
		}),
		// 获取指定报表数据
		getHistoryClearingLogsStatisticsData: co.wrap(function*(name) {
			var redis_client = yield RedisClient.getClient();
			if (name.indexOf(file_prefix) !== 0) {
				throwE("表单名有误")
			}
			var logs_statistics_map_json = yield redis_client.thunk.get([name]);
			try {
				return JSON.parse(logs_statistics_map_json);
			} catch (e) {
				throwE("表单数据有误或者损坏");
			}
		}),
	};
	return proto;
}