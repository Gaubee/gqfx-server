exports.install = install;
var co = require("co");
var Context = require("../socket_handles/context");

function install(socket, waterline_instance, classMap) {
	"use strict";
	var routers = {
		"prefix": "/admin/user",
		"post": {
			"/create_with_member_type/:member_type_id": [{
				doc: {
					des: "创建用户，并授予特定会员类型",
				},
				emit_with: ["session", "params", "form"]
			}, function*(data) {
				var admin_loginer = yield this.admin_loginer;
				this.body = yield admin_loginer.createUserWithMemberType(data.params.member_type_id, data.form);
			}]
		},
		"put":{}
	};
	return routers;
};