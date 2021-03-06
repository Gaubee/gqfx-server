exports.install = install;

var co = require("co");

var Base = require("./Base");
var classMap = require("./index").classMap;
var RedisClient = require("../Model/redis_index");

function install() {
	"use strict";
	class User extends Base {
		toJSON() {
			var jsonObj = super.toJSON();
			[
				"password",
				"permis_password",
			].forEach(key => delete jsonObj[key]);
			return jsonObj;
		}
		update(new_obj, options) {
			options || (options = {});
			var self = this;
			var _super_update = super.update;
			return co(function*() {
				[
					"register_id",
					"password",
					"auth_status",
					"phone_number",
					"permis_password",
					"asset",
					"status"
				].forEach(key => delete new_obj[key]);

				// 认证申请
				if ($$.boolean_parse(options.verify)) {
					if (self.model.auth_status === "已认证") {
						throwE("用户已经通过验证")
					} else if (self.model.auth_status === "认证中") {
						throwE("用户已经提交认证信息，请耐心等待认证结果")
					}
					var _can_verify_able = [
						"id_number",
						"id_photos",
						"bank_card_account_name",
						"bank",
						"bank_card_number",
					].every(key => new_obj.hasOwnProperty(key));

					if (!_can_verify_able) {
						throwE("认证信息不完整")
					}

					var redis_client = yield RedisClient.getClient();
					yield redis_client.thunk.ZADD(["Admin.VerifyApply", Date.now(), self.model.id]);

					new_obj.auth_status = "认证中";
				}
				return yield _super_update.call(self, new_obj);
			});
		}
	}

	var get_model_content = co.wrap(function*(model, key) {
		model[key] = yield classMap.get(("_" + key).camelize()).findOne(model[key]);
	});
	User.prototype.getDetails = co.wrap(function*(key) {
		if (key) {

			var model = this.model.$deepClone();
			if (String.isString(key)) {
				yield get_model_content(model, key);
			} else if (Array.isArray(key)) {
				yield key.map(key => get_model_content(model, key));
			}
			return model;
		} else {
			return yield(yield User.getModel()).findOne(this.model.id).populateAll();
		}
	});
	fs.lsAll(__dirname + "/User").forEach(file_path => {
		var _ext = ".cp.js";
		if (file_path.endWith(_ext)) {
			console.flag("Install Contrill Proto", file_path);
			User.prototype.$extends(require(file_path).install(classMap, RedisClient))
		}
	});
	return User;
};