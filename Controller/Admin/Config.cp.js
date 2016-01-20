exports.install = install;
var co = require("co");

function install(classMap, RedisClient, Constructor) {
	var config_keys = Constructor.config_keys = [{
		name: "提现费率",
		type: "Number"
	}, {
		name: "转账费率",
		type: "Number"
	}, {
		name: "分红积分化比例",
		type: "Number"
	}, ];
	var proto = {
		setConfig: co.wrap(function*(config) {
			var redis_client = yield RedisClient.getClient();
			yield config_keys.map(function(key) {
				if (config.hasOwnProperty(key.name)) {
					return redis_client.thunk.hset(["Admin-Config", key.name, config[key.name] /**/ ])
				}
			});
			return yield this.getConfig();
		}),
		getConfig: co.wrap(function*() {
			var redis_client = yield RedisClient.getClient();
			var config = (yield redis_client.thunk.HGETALL(["Admin-Config"]))||{};
			config_keys.forEach(function(key) {
				if (key.type === "Number") {
					config[key.name] = parseFloat(config[key.name]) || 0;
				}
				if (key.type === "Integer") {
					config[key.name] = parseInt(config[key.name]) || 0;
				}
			});
			return config;
		}),
	}
	return proto;
}