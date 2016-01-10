exports.install = install;
var co = require("co");
var Context = require("../socket_handles/context");

function install(socket, waterline_instance, classMap) {
	"use strict";

	// 拓展ctx的方法
	Context.prototype.__defineGetter__("admin_loginer", co.wrap(function*() {
		console.log(this.session)
		if (!this._admin_loginer) {
			// var admin_loginer_id = this.session.admin_loginer_id;
			// var admin_loginer;
			// if (admin_loginer_id == undefined /*null/undefined*/ ||
			// 	!(admin_loginer = yield waterline_instance.collections.user.findOne(admin_loginer_id))
			// ) {
			// 	throwE("管理员未登录")
			// }
			// this._admin_loginer = yield classMap.get("Admin").getInstance(admin_loginer);

			var admin_loginer = yield classMap.get("Admin").getInstance({
				id: 1,
				admin_name: "Gaubee",
				password: "123456"
			});

			this._admin_loginer = admin_loginer;
		}
		return this._admin_loginer
	}));

	var routers = {
		"prefix": "/admin",
		"get": {
			"/verify_apply_users": [{
				doc: {},
				emit_with: ["query"]
			}, function*(data, config) {
				var admin_loginer = yield this.admin_loginer;
				var query = data.query;
				this.body = yield admin_loginer.getVerifyApplyUsers(query.num, query.page);
			}]
		},
		"put": {
			"/resolve_verifyapply_by_user_id/:user_id": [{
				doc: {},
				emit_with: ["session", "params"]
			}, function*(data) {
				var admin_loginer = yield this.admin_loginer;
				var user_id = data.params.user_id;
				this.body = yield admin_loginer.resolveVerifyApplyByUserId(user_id);
			}],
			"/reject_verifyapply_by_user_id/:user_id": [{
				doc: {},
				emit_with: ["session", "params"]
			}, function*(data) {
				var admin_loginer = yield this.admin_loginer;
				var user_id = data.params.user_id;
				this.body = yield admin_loginer.rejectVerifyApplyByUserId(user_id);
			}],
			"/withdraw_verify_result_by_user_id/:user_id": [{
				doc: {},
				emit_with: ["session", "params"]
			}, function*(data) {
				var admin_loginer = yield this.admin_loginer;
				var user_id = data.params.user_id;
				this.body = yield admin_loginer.withdrawVerifyResultByUserId(user_id);
			}],
		}
	}
	return routers;
}