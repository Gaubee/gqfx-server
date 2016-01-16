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
			}],
			"/recommender_chain/:user_id": [{
				doc: {
					des: "获取用户的返利链上的用户",
					params: [{
						name: "[params.user_id]",
						des: "起点的用户"
					}],
					returns: [{
						name: "<Model.User>List",
						des: "推荐者链用户集"
					}]
				},
				emit_with: ["session", "params"]
			}, function*(data) {
				var admin_loginer = yield this.admin_loginer;
				this.body = yield admin_loginer.getRecommenderChain(data.params.user_id);
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
			}],
			"/login_as_user/:user_id": [{
				doc: {
					des: "管理员直接登录成某用户",
					params: [{
						name: "[params.user_id]",
						des: "要登录的用户ID"
					}]
				},
				emit_with: ["session", "params"]
			}, function*(data) {
				var admin_loginer = yield this.admin_loginer;
				this.session.user_loginer_id = data.params.user_id;
				this.body = yield this.user_loginer;
			}]
		},
		"put": {
			"/recharge_for_user/:user_id": [{
				doc: {
					des: "⚠ 直接给用户增加余额",
					params: [{
						name: "[form.amount]",
						type: "float",
						des: "充值的额度"
					}],
					returns: [{
						type: "[Model.Asset]"
					}],
				},
				emit_with: ["session", "params", "form"]
			}, function*(data) {
				var admin_loginer = yield this.admin_loginer;
				this.body = yield admin_loginer.rechargeForUser(data.params.user_id, data.form.amount);
			}]
		}
	};
	return routers;
};