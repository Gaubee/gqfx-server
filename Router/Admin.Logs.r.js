exports.install = install;
var co = require("co");
var Context = require("../socket_handles/context");

function install(socket, waterline_instance, classMap) {
	"use strict";
	var routers = {
		"prefix": "/admin/logs",
		"get": {
			"/user": [{
				doc: {
					des: "获取用户日志",
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
							name: "where",
							type: "Object",
							des: "查询条件"
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
						type: "<Model.UserLog>List",
						des: "用户日志数组数据"
					}]
				},
				emit_with: ["session", "query"]
			}, function*(data) {
				var admin_loginer = yield this.admin_loginer;
				var query = data.query;
				this.body = yield admin_loginer.getUserLogs(query.num, query.page, query.options);
			}],
			"/admin": [{
				doc: {
					des: "获取管理员日志",
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
							name: "where",
							type: "Object",
							des: "查询条件"
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
						type: "<Model.UserLog>List",
						des: "管理员日志数组数据"
					}]
				},
				emit_with: ["session", "query"]
			}, function*(data) {
				var admin_loginer = yield this.admin_loginer;
				var query = data.query;
				this.body = yield admin_loginer.getAdminLogs(query.num, query.page, query.options);
			}],
		},
	};
	return routers;
};