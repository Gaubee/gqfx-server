exports.install = install;
var co = require("co");
var Context = require("../socket_handles/context");

function install(socket, waterline_instance, classMap) {
	"use strict";

	// 拓展ctx的方法
	Context.prototype.__defineGetter__("admin_loginer", co.wrap(function*() {
		console.log(this.session)
		if (!this._admin_loginer) {
			var admin_loginer_id = this.session.admin_loginer_id;
			var admin_loginer;
			if (admin_loginer_id == undefined /*null/undefined*/ ||
				!(admin_loginer = yield classMap.get("Admin").findOne(admin_loginer_id, true))
			) {
				throwE("管理员未登录")
			}
			this._admin_loginer = admin_loginer;
		}
		return this._admin_loginer
	}));

	var routers = {
		"prefix": "/admin",
		"get": {
			"/loginer": [{
				doc: {
					des: "获取已经登录的管理员",
				},
				emit_with: ["session"]
			}, function*(data) {
				this.body = yield this.admin_loginer;
			}]
		},
		"post": {
			"/create": [{
				doc: {
					des: "⚠ 直接创建管理员",
				},
				emit_with: ["form"]
			}, function*(data) {
				var AdminCon = classMap.get("Admin");
				var admin = yield AdminCon.getInstance(data.form);
				this.body = admin;
			}],
			"/login": [{
				doc: {
					des: "管理员登录",
					params: [{
						name: "[query.login_name]",
					}, {
						name: "[query.password]",
					}, {
						name: "v_code"
					}]
				},
				emit_with: ["session", "form"]
			}, function*(data, config) {
				var loginer_info = data.form;

				var v_code = this.session.VerificationCode;
				//校验完后就马上删除验证码
				this.session.VerificationCode = null;
				if (v_code !== loginer_info.v_code) {
					throwE("验证码有误");
				}

				var AdminCon = classMap.get("Admin");
				var loginer = yield AdminCon.findOne({
					admin_name: loginer_info.login_name
				});
				if (!loginer) {
					throwE("找不到指定管理员，请检查登录帐号")
				}
				if (!loginer_info.password || loginer.password !== $$.md5_2(loginer_info.password)) {
					throwE("登录密码错误")
				}
				this.session.admin_loginer_id = loginer.id;
				this.body = loginer;
			}],
		},
		"put": {
			"/update_password": [{
				doc: {
					des: "高级管理员修改自己密码",
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
				var admin_loginer = yield this.admin_loginer;
				admin_loginer._checkLevel();
				this.body = yield admin_loginer.changePassword(data.form.old_password, data.form.new_password);
			}],
		},
		"delete": {
			"/login_out": [{
				doc: {
					des: "管理员退出登录",
				},
				emit_with: ["session"]
			}, function*(data, config) {
				this.session.admin_loginer_id = null;
				this.body = "success"
			}],
		}
	}
	return routers;
}