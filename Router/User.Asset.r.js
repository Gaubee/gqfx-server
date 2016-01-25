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
			}, function*(data) {
				var user_loginer = yield this.user_loginer;
				this.body = yield user_loginer.getAsset();
			}]
		},
		"put": {
			"/upgrade_asset_level/:member_type_id": [{
				doc: {
					des: "用户升级会员类型",
					params: [{
						name: "[params.member_type_id]",
						des: "会员类型ID"
					}, {
						name: "[form.permis_password]",
						des: "二级密码"
					}]
				},
				emit_with: ["session", "params", "form"]
			}, function*(data) {
				var user_loginer = yield this.user_loginer;
				user_loginer._checkPermisPassword(data.form.permis_password);
				this.body = yield user_loginer.useBalanceToUpgradeAssetLevel(data.params.member_type_id);
			}]
		}
	};
	return routers;
};