exports.install = install;
var co = require("co");
var Context = require("../socket_handles/context");
var RedisClient = require("../Model/redis_index");

function install(socket, waterline_instance, classMap) {
	"use strict";

	// 拓展ctx的方法
	Context.prototype.__defineGetter__("user_loginer", co.wrap(function*() {
		console.log(this.session)
		if (!this._user_loginer) {
			var user_loginer_id = this.session.user_loginer_id;
			var user_loginer;
			if (user_loginer_id == undefined /*null/undefined*/ ||
				!(user_loginer = yield classMap.get("User").findOne(user_loginer_id, true))
			) {
				throwE("用户未登录")
			}
			this._user_loginer = user_loginer;
		}
		return this._user_loginer
	}));

	var routers = {
		"prefix": "/user",
		"get": {
			"/loginer": [{
				doc: {
					des: "获取已经登录的用户",
					params: [{
						name: "[query.populate]",
						type: "String, <String>List",
						des: "要填充的“外键”字段，也可以是多个（数组）。如果填写“*”，则意味则填充所有的外键字段"
					}]
				},
				emit_with: ["session", "query"]
			}, function*(data, config) {
				var user_loginer = yield this.user_loginer;
				this.body = data.query.populate ? (yield user_loginer.getDetails(data.query.populate)) : user_loginer;
			}],
			"/store_vode/:phone_number": [{
				doc: {
					des: "⚠ 模拟发送验证吗",
					params: [{
						name: "[query.store_key]",
					}],
				},
				emit_with: ["query", "params"]
			}, function*(data) {
				var redis_client = yield RedisClient.getClient();
				var vcode = Math.random().toString(36).substr(2, 6);
				if (data.query.store_key) {
					yield redis_client.thunk.SETEX([`vcode-${data.query.store_key}-${data.params.phone_number}`, 120, vcode]);
				}
				this.body = vcode;
			}],
		},
		"post": {
			"/create_user_with_membertype/:member_type_id": [{
				doc: {},
				emit_with: ["session", "params", "form"]
			}, function*(data) {
				var user_loginer = yield this.user_loginer;;
				this.body = yield user_loginer.createUserWithMemberType(data.params.member_type_id, data.form);
			}],
			"/register_from_recommender/:recommender_id": [{
				doc: {
					des: "推荐新用户注册",
					params: [{
						name: "user_name"
					}, {
						name: "password"
					}, {
						name: "confirm_password"
					}, ]
				},
				emit_with: ["params", "form"]
			}, function*(data, config) {
				var UserCon = classMap.get("User");
				var recommender_id = data.params.recommender_id;
				var recommender = yield UserCon.findOne(recommender_id);
				if (!recommender) {
					throwE("找不到推荐人信息")
				}
				var register_user_info = data.form;
				// 校验密码正确与否
				if (register_user_info.confirm_password !== register_user_info.password) {
					throwE("两次输入的密码不正确")
				}
			}],
			"/create": [{
				doc: {
					des: "⚠ 创建用户"
				},
				emit_with: ["form"]
			}, function*(data, config) {
				var UserCon = classMap.get("User");
				var user = yield UserCon.getInstance(data.form);
				this.body = user;
			}],
			"/login": [{
				doc: {
					des: "用户登录",
					params: [{
						name: "login_name",
						des: "可以用手机号码、昵称、注册号进行登录"
					}, {
						name: "password"
					}, {
						name: "v_code"
					}]
				},
				emit_with: ["form", "session"]
			}, function*(data, config) {
				var loginer_info = data.form;
				
				var v_code = this.session.VerificationCode;
				//校验完后就马上删除验证码
				this.session.VerificationCode = null;
				if (v_code !== loginer_info.v_code) {
					throwE("验证码有误");
				}
				
				if (!loginer_info.login_name || !(loginer_info.login_name = loginer_info.login_name.trim())) {
					throwE("登录帐号不可为空")
				}
				var loginer = yield classMap.get("User").findOne([{
					phone_number: loginer_info.login_name
				}, {
					user_name: loginer_info.login_name
				}, {
					register_id: loginer_info.login_name
				}], true);
				if (!loginer) {
					throwE("找不到指定用户，请检查登录帐号")
				}
				if (!loginer_info.password || loginer.model.password !== $$.md5_2(loginer_info.password)) {
					throwE("登录密码错误")
				}
				this.session.user_loginer_id = loginer.model.id;

				/*LOG*/
				yield classMap.get("UserLog").create({
					owner: loginer.model.id,
					type: "apply-withdrawals",
					log: `用户登录`,
					data: {}
				});
				this.body = loginer;
			}]
		},
		"put": {
			"/update": [{
				doc: {
					des: "登录用户修改自己的账户信息",
					details: "参数 参考 User-Model",
					params: [{
						name: "[form]",
						type: "Model.User",
						des: `整个form对应一个的用户类。
注意：其中id、createdAt、updatedAt等系统关键字以及register_id、password等特殊关键字是不会被外部修改的`
					}, {
						name: "[query.verify]",
						type: "Boolean",
						can_null: true,
						des: "通知管理员审核此用户"
					}],
				},
				emit_with: ["session", "form", "query"]
			}, function*(data, config) {
				var user_loginer = yield this.user_loginer;
				yield user_loginer.update(data.form, data.query);
				this.body = user_loginer;
			}],
			"/update_password": [{
				doc: {
					des: "用户修改登录密码",
					params: [{
						name: "[form.old_pwd]",
						type: "String",
						des: "旧登录密码"
					}, {
						name: "[form.new_pwd]",
						type: "String",
						des: "新登录密码"
					}]
				},
				emit_with: ["session", "form"]
			}, function*(data) {
				var user_loginer = yield this.user_loginer;
				var res = yield user_loginer.changePassword(data.form.old_pwd, data.form.new_pwd);

				/*LOG*/
				yield classMap.get("UserLog").create({
					owner: user_loginer.model.id,
					type: "user-update-password",
					log: `用户修改密码`,
					data: { /*为了确保安全，不保留任何密码信息*/ }
				});
				this.body = res;
			}],
			"/reset_password": [{
				doc: {
					des: "用户重置登录密码",
					params: [{
						name: "[form.security_code]",
						type: "String",
						des: "验证码"
					}, {
						name: "[form.phone_number]",
						type: "String",
						des: "手机号码"
					}, {
						name: "[form.new_pwd]",
						type: "String",
						des: "新登录密码"
					}]
				},
				emit_with: ["form"]
			}, function*(data) {
				var redis_client = yield RedisClient.getClient();
				var form = data.form
				var vcode = yield redis_client.thunk.get(`vcode-reset_password-${form.phone_number}`);
				if (!vcode) {
					throwE("验证码已过期")
				}
				if (vcode !== form.security_code) {
					throwE("验证码错误")
				}
				var UserCon = classMap.get("User");
				var user_model = yield UserCon.findOne({
					phone_number: form.phone_number
				});
				if (!user_model) {
					throwE("找不到指定用户");
				}
				user_model.password = form.new_pwd;
				yield user_model.save();
				var user = yield UserCon.getInstance(user_model);

				/*LOG*/
				yield classMap.get("UserLog").create({
					owner: user_model.id,
					type: "user-reset-password",
					log: `用户重置登录密码`,
					data: { /*为了确保安全，不保留任何密码信息*/ }
				});
				this.body = user;
			}],
			"/reset_permis_password": [{
				doc: {
					des: "用户重置二级密码",
					params: [{
						name: "[form.security_code]",
						type: "String",
						des: "验证码"
					}, {
						name: "[form.phone_number]",
						type: "String",
						des: "手机号码"
					}, {
						name: "[form.new_pwd]",
						type: "String",
						des: "新登录密码"
					}]
				},
				emit_with: ["form"]
			}, function*(data) {
				var redis_client = yield RedisClient.getClient();
				var form = data.form;
				var vcode = yield redis_client.thunk.get(`vcode-reset_permis_password-${form.phone_number}`);
				if (!vcode) {
					throwE("验证码已过期")
				}
				if (vcode !== form.security_code) {
					throwE("验证码错误")
				}
				var UserCon = classMap.get("User");
				var user_model = yield UserCon.findOne({
					phone_number: form.phone_number
				});
				if (!user_model) {
					throwE("找不到指定用户");
				}
				user_model.permis_password = form.new_pwd;
				yield user_model.save();
				var user = yield UserCon.getInstance(user_model);

				/*LOG*/
				yield classMap.get("UserLog").create({
					owner: user_model.id,
					type: "user-reset-permis_password",
					log: `用户重置二级密码`,
					data: { /*为了确保安全，不保留任何密码信息*/ }
				});
				this.body = user;
			}],
		},
		"delete": {
			"/login_out": [{
				doc: {
					des: "注销已经登录的用户"
				},
				emit_with: ["session"]
			}, function*(data, config) {
				this.session.user_loginer_id = null;
				this.body = "success"
			}]
		}
	};
	return routers;
}