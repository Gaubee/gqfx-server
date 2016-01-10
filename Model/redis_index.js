var redis = require("redis");
var co = require("co");
var thunkify = require('../lib/thunkify');

function install(cb) {
	var client = exports.client = redis.createClient();
	var client_err;

	client.on("error", function(err) {
		client_err = err;
		exports.install = after_install_err;

		var _group = ["OPEN", console.flagHead("Redis"), "FAIL :"].join(" ")
		console.group(_group);
		console.error(err);
		console.groupEnd(_group);
		cb(err);
	});

	client.on("connect", function() {
		exports.install = after_install_suc;

		var thunk = {};
		Object.keys(client.__proto__).forEach(function(method_name) {
			if (Function.isFunction(client[method_name])) {
				thunk[method_name] = thunkify(client[method_name]).bind(client);
			}
		});
		client.th = client.thunk = thunk;

		cb(null, client);
	});

	/*
	 * 连接对象只实例化一次
	 */
	exports.install = on_install;

	function on_install(cb) {
		client.on("error", cb)
		client.on("connect", function() {
			cb(null, client)
		});
	};

	function after_install_err(cb) {
		cb(client_err)
	};

	function after_install_suc(cb) {
		cb(null, client);
	};
};

exports.install = install;
exports.getClient = co.wrap(function*() {
	return yield exports.install;
});