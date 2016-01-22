exports.install = install;

var co = require("co");

var Base = require("./Base");
var classMap = require("./index").classMap;
var RedisClient = require("../Model/redis_index");

function install(waterline_instance) {
	"use strict";
	class User extends Base {
		static create(new_obj, is_to_instance) {
			[
				"register_id",
				"auth_status",
				"asset",
				"status",
				"recommender",
			].forEach(key => delete new_obj[key]);
			var self = this;
			var create = super.create;

			return co(function*() {
				var UserModel = yield self.getModel();
				// 不以4结尾
				do {
					var no_endWith_4_register_id = (Math.random().toString().substr(2) + Math.random().toString().substr(2)).substring(0, 8);
				} while (no_endWith_4_register_id.charAt(7) === 4 || (yield UserModel.findOneByRegister_id(no_endWith_4_register_id)))
				new_obj.register_id = no_endWith_4_register_id;

				if (!new_obj.hasOwnProperty("permis_password")) {
					new_obj.permis_password = new_obj.password;
				}

				return create.call(self, new_obj, is_to_instance);
			});
		}
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
					"status",
					"recommender"
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

	var get_model_content = co.wrap(function*(model, key_define, key) {
		if (model[key]) {
			model[key] = yield classMap.get(("_" + (key_define.model || key_define.collection)).camelize()).findOne(model[key], true /*获取实例，不同类中可能有不同的字段要隐藏*/ );
		}
	});
	User.prototype.getDetails = co.wrap(function*(key) {
		var user_definition = waterline_instance.collections.user.definition;
		var model = this.toJSON();
		if (!key || key === "*") {
			key = Object.keys(user_definition).filter(attr_name => user_definition[attr_name].alias);
		} else if (String.isString(key) && user_definition[key].alias) {
			key = [key]
		}
		console.log(key)
		if (Array.isArray(key)) {
			yield key.map(key => get_model_content(model, user_definition[key], key));
		}
		return model;
	});
	User.prototype._checkVerify = function() {
		if (this.model.auth_status !== "已认证") {
			throwE("用户未通过认证，无权操作")
		}
		return true;
	};
	User.prototype._checkPermisPassword = function(pwd) {
		if (!this.model.permis_password) {
			throwE("二级密码未设定")
		}
		if (!pwd) {
			throwE("请输入二级密码");
		}
		if (this.model.permis_password !== $$.md5_2(pwd)) {
			throwE("二级密码错误")
		}
		return true
	};
	User.prototype.changePassword = co.wrap(function*(old_pwd, new_pwd) {
		if (this.model.password !== $$.md5_2(old_pwd)) {
			throwE("登录密码错误")
		}
		this.model.password = new_pwd;
		yield this.model.save();
		return this;
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