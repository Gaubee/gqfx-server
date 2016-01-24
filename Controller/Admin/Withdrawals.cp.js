// Withdrawals 提款
exports.install = install;
var co = require("co");

function install(classMap, RedisClient) {
	var proto = {
		getWithdrawalsApplyUsers: co.wrap(function*(num, page, options) {
			num = parseInt(num, 10) || 0;
			page = parseInt(page, 10) || 0;
			var start = num * page;
			var end = num * (page + 1) - 1;
			var redis_client = yield RedisClient.getClient();
			var wd_allpy_data = yield redis_client.thunk.ZRANGE(["Admin.WithdrawalsApply", start, end, "WITHSCORES"]);

			var UserCon = classMap.get("User");
			var wd_allpy_user_id_map = {};
			var wd_allpy_users = []
			for (var i = 0, len = wd_allpy_data.length; i < len; i += 2) {
				wd_allpy_user_id_map[wd_allpy_users = wd_allpy_data[i]] = wd_allpy_data[i + 1]
			}

			var UserModel = yield UserCon.getModel();
			var userModelList = yield UserModel.find(wd_allpy_users).populate("asset");
			var userModelIdMap = userModelList.toMap("id");

			var userControlList = [];
			for (var user_id in wd_allpy_user_id_map) {
				var userModel = userModelIdMap[user_id];
				if (userModel) {
					userControlList.push({
						user: yield UserCon.getInstance(userModel),
						applyAt: new Date(parseInt(wd_allpy_user_id_map[user_id]))
					});
				}
			}
			var res = {
				num: num || userControlList.length,
				page: page,
				list: userControlList
			};
			if (options) {
				if (options.with_total_info) {
					var total_num = parseInt(yield redis_client.thunk.ZCOUNT(["Admin.WithdrawalsApply", "-inf", "+inf"]), 10);
					if (num && total_num) {
						var total_page = Math.ceil(total_num / num);
					} else {
						total_page = 1;
					}
					res.total_num = total_num;
					res.total_page = total_page;
				}
			}

			return res;

		}),
		//完成用户的提现申请，商家已打款
		fulfillUserWithdrawalsApply: co.wrap(function*(user_id) {
			var user = yield this.getUserById(user_id, true);
			var asset_model = yield user.getAsset();
			if (!asset_model) {
				throwE("找不到指定资产对象");
			}
			if (asset_model.apply_wd_status !== "用户已申请") {
				throwE("用户未申请提款")
			}

			var redis_client = yield RedisClient.getClient();
			yield redis_client.thunk.ZREM(["Admin.WithdrawalsApply", user.model.id]);

			asset_model.apply_wd_status = "商家已打款";
			yield asset_model.save();
			var user_data = user.toJSON();
			user_data.asset = asset_model;

			/*LOG*/
			yield classMap.get("AdminLog").create({
				owner: this.model.id,
				type: "fulfill-user-withdrawals-apply",
				log: "商家打款给申请提现的用户",
				data: {
					amount: asset_model.apply_wd_amount,
					fee: asset_model.apply_wd_fee,
					money: asset_model.apply_wd_money,
					user: {
						id: user_id,
						model: "user"
					},
					associations: ["user"]
				}
			});
			return user_data;
		}),
	};
	return proto;
};