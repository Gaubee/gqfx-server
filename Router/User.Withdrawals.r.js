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
					}],
				},
				emit_with: ["session", "form"]
			}, function*(data) {
				var user_loginer = yield this.user_loginer;
				this.body = yield user_loginer.applyWithdrawals(data.form.amount);
			}]
		},
		"put": {
			"/confirm_arrive": [{
				doc: {
					des: "用户确认到帐",
				},
				emit_with: ["session"]
			}, function*(data) {
				var user_loginer = yield this.user_loginer;
				this.body = yield user_loginer.confirmWithdrawalsArrive();
			}]
		}
	};
	return routers;
};