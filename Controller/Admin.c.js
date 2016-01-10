exports.install = install;

var co = require("co");

var Base = require("./Base");
var UserCon = require("../Model");
var classMap = require("./index").classMap;
var RedisClient = require("../Model/redis_index");

function install() {
	"use strict";
	class Admin extends Base {

	};
	Admin.prototype.getVerifyApplyUsers = co.wrap(function*(num, page) {
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
		return userControlList;
	});
	Admin.prototype.resolveVerifyApplyByUserId = co.wrap(function*(user_id) {
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
	});
	Admin.prototype.rejectVerifyApplyByUserId = co.wrap(function*(user_id) {
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
	});
	Admin.prototype.withdrawVerifyResultByUserId = co.wrap(function*(user_id) {
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
	});
	return Admin
}