exports.install = install;
var co = require("co");
var Context = require("../socket_handles/context");

function install(socket, waterline_instance, classMap) {
	"use strict";
	var routers = {
		"prefix": "/admin/user",
		"get": {
			"/list": [{
				doc: {
					des: "注册的用户列表",
					params: [{
						name: "[query.num]",
						can_null: true,
						type: "Number",
						des: "分页参数·每页显示的数量"
					}, {
						name: "[query.page]",
						can_null: true,
						type: "Number",
						des: "分页参数·页号"
					}, {
						name: "[query.options]",
						can_null: true,
						type: "Object",
						des: "用来增强描述、查询数据的配置。",
						attrs: [{
							name: "with_total_info",
							type: "Boolean",
							des: "返回的数据中会增加两个字段：total_num（总数量） total_page（总页数）"
						}, {
							name: "populate",
							type: "String, <String>List",
							des: "要填充的“外键”字段，也可以是多个（数组）。如果填写“*”，则意味则填充所有的外键字段"
						}]
					}],
					returns: [{
						name: "num",
						type: "Number",
						des: "当前页数据量"
					}, {
						name: "page",
						type: "Number",
						des: "当前页页号"
					}, {
						name: "list",
						type: "<Model.User>List",
						des: "用户数组数据"
					}]
				},
				emit_with: ["session", "query"]
			}, function*(data) {
				var admin_loginer = yield this.admin_loginer;
				var query = data.query;
				this.body = yield admin_loginer.getUsers(query.num, query.page, query.options)
			}]
		},
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
		"put": {}
	};
	return routers;
};