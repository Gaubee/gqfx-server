// Admin.Statistics.r.js getLogsStatistics
exports.install = install;
var co = require("co");
var Context = require("../socket_handles/context");

function install(socket, waterline_instance, classMap) {
	"use strict";
	var routers = {
		"prefix": "/admin/statistics",
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
				// console.log("data.query:", yield socket.redisExec("GET",["admin-finance_excel"]))
				var admin_loginer = yield this.admin_loginer;
				var res = yield admin_loginer.getLogsStatistics(data.query);

				yield socket.redisExec("SET", ["admin-finance_excel", JSON.stringify(res)])

				this.body = res
			}],
			"/get_history_clearing_logs_statistics_name": [{
				doc: {
					des: "获取历史的结算报表数据名"
				},
				emit_with: ["session"]
			}, function*(data) {
				var admin_loginer = yield this.admin_loginer;
				this.body = yield admin_loginer.getHistoryClearingLogsStatisticsName();
			}],
			"/get_history_clearing_logs_statistics_data/:name": [{
				doc: {
					des: "获取指定报表数据"
				},
				emit_with: ["session", "params"]
			}, function*(data) {
				var admin_loginer = yield this.admin_loginer;
				this.body = yield admin_loginer.getHistoryClearingLogsStatisticsData(data.params.name);
			}],
			"/_get_rebates_chain_logs/:from/:to": [{
				doc: {
					des: "⚠ 获取推荐链的返利日志信息",
					params: [{
						name: "[params.from]",
						type: "UserLog<type=user-create-user-with-membertype>.id"
					}, {
						name: "[params.to]",
						type: "UserLog<type=user-create-user-with-membertype>.id"
					}]
				},
				emit_with: ["params"]
			}, function*(data) {
				var from = parseInt(data.params.from) || 0;
				var to = Math.max(parseInt(data.params.to) || from, from);
				var UserLogCon = classMap.get("UserLog");
				var UserLogModel = yield UserLogCon.getModel();
				var new_user_log_before = yield UserLogModel.findOne({
					id: {
						"<": from
					},
					type: "user-create-user-with-membertype",
					sort:"id DESC"
				});
				var id_limit = {
					">": new_user_log_before ? new_user_log_before.id : 0,
					"<": to
				};
				console.log(id_limit);
				var rebates_chain_logs = yield UserLogModel.find({
					id: id_limit,
					type: "user-recharge-from-rebates-chain",
				});

				this.body = rebates_chain_logs;

			}]
		},
		"post": {
			"/clearing_logs_statistics": [{
				doc: {
					des: "手动结算"
				},
				emit_with: ["session"]
			}, function*(data) {
				var admin_loginer = yield this.admin_loginer;
				this.body = yield admin_loginer.clearingLogsStatistics();
			}]
		}
	};
	return routers;
};