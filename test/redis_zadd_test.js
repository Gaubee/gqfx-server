var co = require("co");
var redis = require("redis");
var thunkify = require('../lib/thunkify');
var client = redis.createClient();
setTimeout(process.exit, 1000);

co(function*() {
	// console.log(Object.keys(client.__proto__))
	yield thunkify(client.zadd).bind(client)(["gaubee.test", 5, "E", 6, "F", 7, "G"]);

	// client.zadd(["gaubee.test", 1, "A", 2, "B", 4, "D", 3, "C"], function(err, res) {
	// 	console.log(err)
	// 	console.log(res)
	// });
	// client.ZRANGE(["gaubee.test", 0, -1], function(err, res) {
	// 	console.log(err)
	// 	console.log(res)
	// });
	var num = 3;
	var page = 1;
	var start = num * page;
	var end = num * (page + 1) - 1;
	var res = yield thunkify(client.ZRANGE).bind(client)(["gaubee.test", start, end,"WITHSCORES"]);
	console.log(res,start, end)
});