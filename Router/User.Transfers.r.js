exports.install = install;
var co = require("co");
var Context = require("../socket_handles/context");

function install(socket, waterline_instance, classMap) {
	"use strict";
	var routers = {
		"prefix": "/user/transfers",
		"post": {
			"/to_user/:phone_number": [{
				doc: {
					des: "用户转账",
					params: [{
						name: "[params.phone_number]",
						type: "string",
						des: "收款人的手机号码"
					}, {
						name: "[form.amount]",
						type: "float",
						des: "收款人将收到的金额"
					}],
					returns: [{
						type: "Model.Asset",
						des: "用户转账后的资产信息"
					}]
				},
				emit_with: ["session", "params", "form"]
			}, function*(data) {
				var user_loginer = yield this.user_loginer;
				user_loginer._checkPermisPassword(data.form.permis_password);
				this.body = yield user_loginer.TransfersToUser(data.params.phone_number, data.form.amount);
			}]
		},
	};
	return routers;
};