exports.install = install;
var co = require("co");
var Context = require("../socket_handles/context");

function install(socket, waterline_instance, classMap) {
	"use strict";
	var routers = {
		"prefix": "/user/withdrawals",
		"post": {
			"/apply": [{
				doc: {
					des: "用户申请提现",
					params: [{
						name: "[form.amount]",
						type: "float",
						des: "提现额度"
					}, {
						name: "[form.permis_password]",
						type: "string",
						des: "二级密码"
					}],
				},
				emit_with: ["session", "form"]
			}, function*(data) {
				var user_loginer = yield this.user_loginer;
				if (!data.form.permis_password) {
					throwE("需要二级密码")
				}
				user_loginer._checkPermisPassword(data.form.permis_password);
				this.body = yield user_loginer.applyWithdrawals(data.form.amount);
			}]
		},
		"put": {
			"/confirm_arrive": [{
				doc: {
					des: "用户确认到帐",
					params: [{
						name: "[form.permis_password]",
						type: "string",
						des: "二级密码"
					}],
				},
				emit_with: ["session", "form"]
			}, function*(data) {
				var user_loginer = yield this.user_loginer;
				user_loginer._checkPermisPassword(data.form.permis_password);
				this.body = yield user_loginer.confirmWithdrawalsArrive();
			}]
		}
	};
	return routers;
};