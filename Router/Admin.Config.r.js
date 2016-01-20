exports.install = install;
var co = require("co");
var Context = require("../socket_handles/context");

function install(socket, waterline_instance, classMap) {
	"use strict";
	var config_keys = classMap.get("Admin").config_keys
	var routers = {
		"prefix": "/admin/config",
		"get": {
			"": [{
				doc: {
					des: "获取管理员全局配置",
					params: [],
					returns: config_keys
				},
				emit_with: ["session"]
			}, function*(data) {
				var admin_loginer = yield this.admin_loginer;
				this.body = yield admin_loginer.getConfig()
			}],
		},
		"put": {
			"": [{
				doc: {
					des: "⚠ 直接给用户增加余额",
					params: config_keys.map(key => {
						return {
							name: "[form." + key.name + "]",
							type: key.type,
							can_null: true
						}
					}),
					returns: config_keys,
				},
				emit_with: ["session", "form"]
			}, function*(data) {
				var admin_loginer = yield this.admin_loginer;
				this.body = yield admin_loginer.setConfig(data.form);
			}]
		}
	};
	return routers;
};