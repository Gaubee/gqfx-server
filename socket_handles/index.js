var co = require("co");
var tcp = require("gq-core/lib/tcp");
//初始化TCP连接
var socket = exports.tcp_socket = tcp.createClient({
	address: '0.0.0.0',
	family: 'IPv4',
	port: 4001
}, function() {
});
exports.install = install;

function install() {
	socket.handles = Object.create(null);
	return co(function*() {
		//INIT
		socket.msgInfo("router-init", {
			info: {
				author: "Gaubee",
				version: "1.0.0"
			},
			address: {
				host: "0.0.0.0",
				port: 1234
			},
			initKey: "GAUBEE-INIT-KEY-HASH"
		});

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