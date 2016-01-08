exports.install = install;
var co = require("co");

function install(socket, waterline_instance, classMap) {
	"use strict";

	socket.handles.routerRegister({
		method: "post",
		path: "/user/create",
		doc: {
			des: "创建用户"
		},
		emit_with: ["form"]
	}, co.wrap(function*(data, config) {
		var user = yield waterline_instance.collections.user.create(data.form);
		this.body = user;
	}));

	socket.handles.routerRegister({
		method: "post",
		path: "/user/login",
		doc: {
			des: "用户登录",
			params: [{
				name: "login_name",
				des: "可以用手机号码、昵称、注册号进行登录"
			}, {
				name: "password"
			}]
		},
		emit_with: ["form"]
	}, co.wrap(function*(data, config) {
		var loginer_info = data.form;

		if (!loginer_info.login_name || !(loginer_info.login_name = loginer_info.login_name.trim())) {
			throwE("登录帐号不可为空")
		}
		var loginer = yield waterline_instance.collections.user.findOne([{
			phone_number: loginer_info.login_name
		}, {
			user_name: loginer_info.login_name
		}, {
			register_id: loginer_info.login_name
		}]);
		if (!loginer) {
			throwE("找不到指定用户，请检查登录帐号")
		}
		if (!loginer_info.password || loginer.password !== $$.md5_2(loginer_info.password)) {
			throwE("登录密码错误")
		}
		this.session.loginer_id = loginer.id;
		this.body = loginer;
	}));

	socket.handles.routerRegister({
		method: "get",
		path: "/user/loginer",
		doc: {
			des: "获取已经登录的用户",
			params: []
		},
		emit_with: ["session"]
	}, co.wrap(function *(data, config) {
		console.log(data.emit_with)
		var loginer_id = this.session.loginer_id;
		var loginer;
		if (loginer_id === undefined ||
			!(loginer = yield waterline_instance.collections.user.findOne(loginer_id))
		) {
			throwE("用户未登录")
		}
		this.body = loginer;
	}));

	socket.handles.routerRegister({
		method: "post",
		path: "/user/register_from_recommender/:recommender_id",
		doc: {
			des: "推荐新用户注册",
			params: [{
				name: "user_name"
			}, {
				name: "password"
			}, {
				name: "confirm_password"
			}, ]
		},
		emit_with: ["params", "form"]
	}, co.wrap(function*(data, config) {
		var recommender_id = data.params.recommender_id;
		var recommender = yield waterline_instance.collections.user.findOne(recommender_id);
		if (!recommender) {
			throwE("找不到推荐人信息")
		}
		var register_user_info = data.form;
		// 校验密码正确与否
		if (register_user_info.confirm_password !== register_user_info.password) {
			throwE("两次输入的密码不正确")
		}
	}));
}