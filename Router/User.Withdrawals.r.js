exports.install = install;
var co = require("co");
var Context = require("../socket_handles/context");
var RedisClient = require("../Model/redis_index");
var querystring = require("querystring");
var os = require("os");
var is_dev = os.type() !== "Linux";
var http = require("http");
var curl = function(url) {
	return new Promise(function(resolve, reject) {
		http.get(url, (res) => {
			var bufs = [];
			res.on("data", function(chunk) {
				bufs.push(chunk)
			});
			res.on("end", function() {
				resolve(Buffer.concat(bufs).toString());
			});
		}).on('error', reject);
	});
};
const wx_pay_prefix = "ONLINE_PAY_CB@";

function install(socket, waterline_instance, classMap) {
	"use strict";
	var routers = {
		"prefix": "/user/withdrawals",
		"get": {
			"/online_pay_callback/:key": [{
				doc: {
					des: "用户在线充值后的回调URL"
				},
				emit_with: ["params"]
			}, function*(data) {
				var key = data.params.key;
				if (!key) {
					Throw("ref", "params.key is null")
				}
				var redis_client = yield RedisClient.getClient();
				var pay_key = wx_pay_prefix + key;
				var pay_json_data = yield redis_client.thunk.GET([pay_key]);
				if (!pay_json_data) {
					Throw("ref", "params.key hasn't Reference Data");
				}
				try {
					pay_json_data = JSON.parse(pay_json_data.substr(wx_pay_prefix.length));
				} catch (e) {
					Throw("ref", "JSON_Data NO Work");
				}
				yield redis_client.thunk.DEL([pay_key]);
				var amount = pay_json_data.config.total_fee / 100 * /*微信手续费0.06%*/ 0.0006;

				this.body = yield user._recharge(amount, `用户使用微信充值，额度：${amount}`);
			}]
		},
		"post": {
			"/user/make_wx_shaoma_pay": [{
				doc: {
					des: "生成扫描支付订单",
					params: [{
						name: "amount",
						des: "充值金额"
					}],
					returns: [{
						name: "url",
						des: "扫描支付用的二维码",
						type: "string"
					}]
				},
				emit_with: ["session", "form"]
			}, function*(data) {
				var user_loginer = yield this.user_loginer;
				var url = "http://" + (is_dev ? "121.40.18.23" : "127.0.0.1") + ":4100/unifiedorderRequest?";
				var id_prefix = Math.random().toString(36).substr(2, 6);
				var qs_obj = {
					body: "用户微信充值",
					out_trade_no: id_prefix + user_loginer.id,
					total_fee: parseInt((data.form.amount * 100), 10),
					spbill_create_ip: "127.0.0.1",
					trade_type: "NATIVE",
					device_info: "WEB",
					product_id: id_prefix + data.form.amount
				};
				var qs = querystring.stringify(qs_obj);
				// console.log(url + qs);
				var res = yield curl(url + qs);
				res = JSON.parse(res);
				// console.log(res)
				if (res.codeUrl) {
					var redis_client = yield RedisClient.getClient();
					redis_client.thunk.SETEX([wx_pay_prefix + qs_obj.out_trade_no,
						60 * 30 /*半小时支付时间*/ ,
						JSON.stringify({
							config: qs_obj,
							pay_info: res
						})
					]);
					this.body = res.codeUrl;
				} else {
					Throw("syntax", "WeiXin 支付服务器出错")
				}
			}],
			"/apply": [{
				doc: {
					des: "用户申请提现",
					params: [{
						name: "[form.amount]",
						type: "float",
						des: "提现额度"
					}, {
						name: "[form.permis_password]",
						type: "string",
						des: "二级密码"
					}],
				},
				emit_with: ["session", "form"]
			}, function*(data) {
				var user_loginer = yield this.user_loginer;
				user_loginer._checkPermisPassword(data.form.permis_password);
				this.body = yield user_loginer.applyWithdrawals(data.form.amount);
			}]
		},
		"put": {
			"/confirm_arrive": [{
				doc: {
					des: "用户确认到帐",
					params: [
						/*{
												name: "[form.permis_password]",
												type: "string",
												des: "二级密码"
											}*/
					],
				},
				emit_with: ["session" /*, "form"*/ ]
			}, function*(data) {
				var user_loginer = yield this.user_loginer;
				// user_loginer._checkPermisPassword(data.form.permis_password);
				this.body = yield user_loginer.confirmWithdrawalsArrive();
			}]
		}
	};
	return routers;
};