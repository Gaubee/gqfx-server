var co = require("co");
require("gq-core/lib/global");
var RedisClient = require("../Model/redis_index");
setTimeout(process.exit, 1000);

co(function*() {
	// console.log(Object.keys(client.__proto__))
	try {
		var client = yield RedisClient.getClient();
		var res = yield client.thunk.hset(["gaubee-test", "first", "Gaubee"]);
		console.log(res);
		var res = yield client.thunk.hset(["gaubee-test", "last", "Bangeel"]);
		console.log(res);
		var res = yield client.thunk.hset(["gaubee-test", "age", 1]);
		console.log(res);

		var res = yield client.thunk.hvals(["gaubee-test"]);
		console.log(res)
		var res = yield client.thunk.HGETALL(["gaubee-test"]);
		console.log(res)

	} catch (e) {
		console.log(e)
	}
});