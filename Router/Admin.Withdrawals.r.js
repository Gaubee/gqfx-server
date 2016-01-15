exports.install = install;
var co = require("co");
var Context = require("../socket_handles/context");

function install(socket, waterline_instance, classMap) {
	"use strict";
	var routers = {
		"prefix": "/admin/withdrawals",
		"get": {
			"/apply_users": [{
				doc: {
					des: "申请提现的用户列表",
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
						type: "Array",
						des: "申请提现的用户以及申请的旁边信息",
						attrs: [{
							name: "user",
							type: "Model.User",
							des: "用户信息",
							attrs: [{
								name: "asset",
								type: "Model.Asset",
								des: "用户资产信息"
							}]
						}, {
							name: "applyAt",
							type: "DateString",
							des: "申请时间"
						}]
					}]
				},
				emit_with: ["session", "query"]
			}, function*(data) {
				var admin_loginer = yield this.admin_loginer;
				var query = data.query;
				this.body = yield admin_loginer.getWithdrawalsApplyUsers(query.num, query.page, query.options);
			}]
		},
		"post": {},
		"put": {
			"/pay_for_user/:user_id": [{
				doc: {
					des: "商家确认打款给申请提现的用户",
					params: [{
						name: "[params.user_id]",
						des: "用户ID"
					}]
				},
				emit_with: ["session", "params"]
			}, function*(data) {
				var admin_loginer = yield this.admin_loginer;
				this.body = yield admin_loginer.fulfillUserWithdrawalsApply(data.params.user_id);
			}]
		}
	}
	return routers;
};