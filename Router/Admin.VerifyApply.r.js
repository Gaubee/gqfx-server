exports.install = install;
var co = require("co");
var Context = require("../socket_handles/context");

function install(socket, waterline_instance, classMap) {
	"use strict";
	var routers = {
		"prefix": "/admin/verify_apply",
		"get": {
			"/users": [{
				doc: {
					des: "申请认证的用户列表",
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
			}, function*(data, config) {
				var admin_loginer = yield this.admin_loginer;
				var query = data.query;
				console.log(query)
				this.body = yield admin_loginer.getVerifyApplyUsers(query.num, query.page, query.options);
			}],
		},
		"put": {
			"/resolve_by_user_id/:user_id": [{
				doc: {
					des: "用户申请认证 => 通过认证",
					params: [{
						name: "[params.user_id]",
						des: "用户ID"
					}],
					returns: [{
						type: "[Model.User]"
					}],
				},
				emit_with: ["session", "params"]
			}, function*(data) {
				var admin_loginer = yield this.admin_loginer;
				var user_id = data.params.user_id;
				this.body = yield admin_loginer.resolveVerifyApplyByUserId(user_id);
			}],
			"/reject_by_user_id/:user_id": [{
				doc: {
					des: "用户申请认证 => 驳回认证",
					params: [{
						name: "[params.user_id]",
						des: "用户ID"
					}],
					returns: [{
						type: "[Model.User]"
					}],
				},
				emit_with: ["session", "params"]
			}, function*(data) {
				var admin_loginer = yield this.admin_loginer;
				var user_id = data.params.user_id;
				this.body = yield admin_loginer.rejectVerifyApplyByUserId(user_id);
			}],
			"/withdraw_result_by_user_id/:user_id": [{
				doc: {
					des: "用户申请认证 => 撤销认证",
					params: [{
						name: "[params.user_id]",
						des: "用户ID"
					}],
					returns: [{
						type: "[Model.User]"
					}],
				},
				emit_with: ["session", "params"]
			}, function*(data) {
				var admin_loginer = yield this.admin_loginer;
				var user_id = data.params.user_id;
				this.body = yield admin_loginer.withdrawVerifyResultByUserId(user_id);
			}],
		},
	};
	return routers;
};