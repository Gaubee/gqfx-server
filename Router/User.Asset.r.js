exports.install = install;
var co = require("co");
var Context = require("../socket_handles/context");

function install(socket, waterline_instance, classMap) {
	"use strict";
	var routers = {
		"prefix": "/user/asset",
		"get": {
			"/info": [{
				doc: {
					des: "获取用户资产信息"
				},
				emit_with: ["session"]
			},function * (data) {
				var user_loginer = yield this.user_loginer;
				this.body = yield user_loginer.getAsset();
			}]
		}
	};
	return routers;
};