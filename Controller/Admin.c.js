exports.install = install;

var co = require("co");

var Base = require("./Base");
var classMap = require("./index").classMap;
var RedisClient = require("../Model/redis_index");

function install() {
	"use strict";
	class Admin extends Base {

		static setConfig(config) {
			var self = this;
			return co(function*() {
				var redis_client = yield RedisClient.getClient();
				yield config_keys.map(function(key) {
					if (config.hasOwnProperty(key.name)) {
						return redis_client.thunk.hset(["Admin-Config", key.name, config[key.name] /**/ ])
					}
				});
				return yield self.getConfig();
			})
		}
		static getConfig() {

			return co(function*() {
				var redis_client = yield RedisClient.getClient();
				var config = (yield redis_client.thunk.HGETALL(["Admin-Config"])) || {};
				config_keys.forEach(function(key) {
					if (key.type === "Number") {
						config[key.name] = parseFloat(config[key.name]) || 0;
					}
					if (key.type === "Integer") {
						config[key.name] = parseInt(config[key.name]) || 0;
					}
				});
				return config;
			})
		}

		static getAdminsWithLevel(levels) {
			return Admin.find({
				level: levels
			}, true)
		}

		toJSON() {
			var jsonObj = super.toJSON();
			[
				"password",
			].forEach(key => delete jsonObj[key]);
			return jsonObj;
		}

	};
	var config_keys = Admin.config_keys = [{
		name: "提现费率",
		type: "Number"
	}, {
		name: "转账费率",
		type: "Number"
	}, {
		name: "分红积分化比例",
		type: "Number"
	}, {
		name: "before_clearing_point",
		type: "Number"
	}, {
		name: "clearing_point",
		type: "Number"
	}, ];

	fs.lsAll(__dirname + "/Admin").forEach(file_path => {
		var _ext = ".cp.js";
		if (file_path.endWith(_ext)) {
			console.flag("Install Contrill Proto", file_path);
			Admin.prototype.$extends(require(file_path).install(classMap, RedisClient, Admin))
		}
	});

	return Admin
}