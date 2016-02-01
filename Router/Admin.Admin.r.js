exports.install = install;
var co = require("co");

function install(socket, waterline_instance, classMap) {
	"use strict";
	var routers = {
		"prefix": "/admin/admin",
		"get": {
			"/get_lowlevels_admins": [{
				doc: {
					des: "获取低级的管理员列表"
				},
				emit_with: ["session"]
			}, function*(data) {
				//等级检查
				var admin_loginer = yield this.admin_loginer;
				admin_loginer._checkLevel();

				var AdminCon = classMap.get("Admin");
				this.body = yield AdminCon.getAdminsWithLevel([
					"财务",
					"会计",
					"普通",
				]);
			}],
		},
		"post": {
			"/create_with_level": [{
				doc: {
					des: "顶级/超级管理员创建其它低级管理员",
					params: [{
						name: "[form.admin_name]",
						des: "新密码"
					},{
						name: "[form.password]",
						des: "新密码"
					},{
						name: "[form.level]",
						des: "【普通 财务 会计】"
					},]
				},
				emit_with: ["session", "form"]
			}, function*(data) {
				var admin_loginer = yield this.admin_loginer;
				var new_admin = yield admin_loginer.createAdminWithLevel(data.form);
				this.body = new_admin;
			}],
		},
		"put": {
			"/change_password/:admin_id": [{
				doc: {
					des: "修改指定管理员的密码",
					params: [{
						name: "[form.new_password]",
						des: "新密码"
					}]
				},
				emit_with: ["session", "form", "params"]
			}, function*(data) {
				var admin_loginer = yield this.admin_loginer;
				this.body = yield admin_loginer.changeAdminPassword(data.params.admin_id, data.form.new_password);
			}]
		},
	}
	return routers;
}