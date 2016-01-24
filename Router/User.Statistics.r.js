// Admin.Statistics.r.js getLogsStatistics
exports.install = install;
var co = require("co");
var Context = require("../socket_handles/context");

function install(socket, waterline_instance, classMap) {
	"use strict";
	var routers = {
		"prefix": "/user/statistics",
		"get": {
			"/from_user_log": [{
				doc: {
					des: "获取日志统计",
					params: [{
						name: "[query.form]",
						can_null: true,
						des: "开始时间",
						type: "Date"
					}, {
						name: "[query.to]",
						can_null: true,
						des: "结束时间",
						type: "Date"
					}, {
						name: "[query.store_to_session_key]",
						can_null: true,
						des: "保存到SESSION的KEY，供其它接口使用",
						type: "String"
					}],
					returns: [{
						name: "list",
						type: "Array",
						args: [{
							name: "owner"
						}, {
							name: "asset"
						}, {
							name: "type"
						}, {
							name: "type_name"
						}, {
							name: "amount"
						}, {
							name: "fee"
						}, {
							name: "createdAt"
						}, {
							name: "log_id"
						}, ]
					}, {
						name: "total_income",
						type: "Number",
						des: "总收入"
					}, {
						name: "total_outgo",
						des: "总支出",
						type: "Number"
					}]
				},
				emit_with: ["session", "query"]
			}, function*(data) {
				var user_loginer = yield this.user_loginer;
				var res = yield user_loginer.getLogsStatistics(data.query);
				if (data.query.store_to_session) {
					this.session.finance_excel = res;
				}
				this.body = res;
			}],
		},
	};
	return routers;
};