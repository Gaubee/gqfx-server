exports.install = install;
var co = require("co");

function install(classMap, RedisClient) {
	var proto = {
		getVerifyApplyUsers: co.wrap(function*(num, page, options) {
			console.log("options", options)
			num = parseInt(num, 10) || 0;
			page = parseInt(page, 10) || 0;
			var start = num * page;
			var end = num * (page + 1) - 1;
			var redis_client = yield RedisClient.getClient();
			var verify_allpy_data = yield redis_client.thunk.ZRANGE(["Admin.VerifyApply", start, end, "WITHSCORES"]);

			var UserCon = classMap.get("User");
			var verify_allpy_user_id_map = {};
			var verify_allpy_users = []
			for (var i = 0, len = verify_allpy_data.length; i < len; i += 2) {
				verify_allpy_user_id_map[verify_allpy_users = verify_allpy_data[i]] = verify_allpy_data[i + 1]
			}

			var userModelList = yield UserCon.find(verify_allpy_users);
			var userModelIdMap = userModelList.toMap("id");

			var userControlList = [];
			for (var user_id in verify_allpy_user_id_map) {
				var userModel = userModelIdMap[user_id];
				if (userModel) {
					userControlList.push({
						user: yield UserCon.getInstance(userModel),
						applyAt: new Date(parseInt(verify_allpy_user_id_map[user_id]))
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
					var total_num = parseInt(yield redis_client.thunk.ZCOUNT(["Admin.VerifyApply", "-inf", "+inf"]), 10);
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
		resolveVerifyApplyByUserId: co.wrap(function*(user_id) {
			var UserCon = classMap.get("User");
			var user = yield UserCon.findOne(user_id);
			if (!user) {
				throwE("找不到指定用户")
			}

			if (user.auth_status !== "认证中") {
				throwE("指定用户并没有申请认证");
			}

			user.auth_status = "已认证";
			yield user.save();

			var redis_client = yield RedisClient.getClient();
			yield redis_client.thunk.ZREM(["Admin.VerifyApply", user_id]);

			return user;
		}),
		rejectVerifyApplyByUserId: co.wrap(function*(user_id) {
			var UserCon = classMap.get("User");
			var user = yield UserCon.findOne(user_id);
			if (!user) {
				throwE("找不到指定用户")
			}

			if (user.auth_status !== "认证中") {
				throwE("指定用户并没有申请认证");
			}

			user.auth_status = "未认证";
			yield user.save();

			var redis_client = yield RedisClient.getClient();
			yield redis_client.thunk.ZREM(["Admin.VerifyApply", user_id]);

			return user;
		}),
		withdrawVerifyResultByUserId: co.wrap(function*(user_id) {
			var UserCon = classMap.get("User");
			var user = yield UserCon.findOne(user_id);
			if (!user) {
				throwE("找不到指定用户")
			}

			if (user.auth_status !== "已认证") {
				throwE("指定用户并没有通过认证");
			}

			user.auth_status = "未认证";
			yield user.save();

			return user;
		}),
	}
	return proto;
}