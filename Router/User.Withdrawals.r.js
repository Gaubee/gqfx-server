exports.install = install;
var co = require("co");
var Context = require("../socket_handles/context");
var RedisClient = require("../Model/redis_index");

function install(socket, waterline_instance, classMap) {
	"use strict";
	var routers = {
		"prefix": "/user/withdrawals",
		"get": {
			"/online_pay_callback/:key": [{
				doc: {
					des: "用户在线充值后的回调URL"
				},
				emit_with: ["params"]
			}, function*(data) {
				var key = data.params.key;
				if (!key) {
					Throw("ref", "params.key is null")
				}
				var redis_client = yield RedisClient.getClient();
				var pay_json_data = yield redis_client.thunk.GET([key]);
				const prefix = "ONLINE_PAY_CB@";
				if (!pay_json_data || pay_json_data.indexOf(prefix) === 0) {
					Throw("ref", "params.key hasn't Reference Data");
				}
				try {
					pay_json_data = JSON.parse(pay_json_data.substr(prefix.length));
				} catch (e) {
					Throw("ref", "JSON_Data NO Work");
				}
				this.body = pay_json_data;
			}]
		},
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
				user_loginer._checkPermisPassword(data.form.permis_password);
				this.body = yield user_loginer.applyWithdrawals(data.form.amount);
			}]
		},
		"put": {
			"/confirm_arrive": [{
				doc: {
					des: "用户确认到帐",
					params: [
						/*{
												name: "[form.permis_password]",
												type: "string",
												des: "二级密码"
											}*/
					],
				},
				emit_with: ["session" /*, "form"*/ ]
			}, function*(data) {
				var user_loginer = yield this.user_loginer;
				// user_loginer._checkPermisPassword(data.form.permis_password);
				this.body = yield user_loginer.confirmWithdrawalsArrive();
			}]
		}
	};
	return routers;
};