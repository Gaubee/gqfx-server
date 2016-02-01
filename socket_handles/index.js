var co = require("co");
try {
	var tcp = require("gq-core/lib/tcp");
	//配置不显示group的字段
	tcp.config.hidden_groups["success:router-register"] = true;
} catch (e) {
	tcp = require("GQ-core/tcp")
	tcp.config.hiddenFlags.add("success:router-register");
}

exports.install = install;

function install(ip) {
	var address = {
		host: ip,
		family: 'IPv4',
		port: 4001
	};
	//初始化TCP连接
	var socket = exports.tcp_socket = tcp.createClient(address, function() {
		console.log(socket.address())
	});
	socket.handles = Object.create(null);
	return co(function*() {
		var package_json = require("../package.json");
		//INIT
		socket.msgInfo("router-init", {
			info: {
				name: package_json.name,
				author: package_json.author,
				version: package_json.version,
				description: package_json.description,
			},
			address: {
				host: "0.0.0.0",
				port: 4001
			},
			initKey: "GAUBEE-INIT-KEY-HASH"
		});
		//RE-CONNECT
		// socket.on("close", function re_con() {
		// 	setTimeout(function() {
		// 		tcp.net.connect(address, function() {
		// 			require("../index").run()
		// 		}).on("error", re_con);
		// 	}, 1000)
		// });

		yield new Promise(function(resolve, reject) {
			socket.onMsgSuccess("router-init", function(data, done) {
				console.log("路由初始化成功");
				done();
				resolve();
			});
			socket.onMsgError("router-init", function(data, done) {
				console.log("路由初始化失败");
				done();
				reject(new Error("路由初始化失败"));
			});
		});

		//初始化成后，安装其余模块
		require("./router").install(socket);
		return socket;
	});
};