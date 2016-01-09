var path = require("path");

//遍历出所有Router模块
var events = {};
fs.lsAll(__dirname).forEach(file_path => {
	var _ext = ".r.js";
	if (file_path.endWith(_ext)) {
		var eventName = path.basename(file_path).replace(_ext, "");
		events[eventName] = require(file_path);
	}
});

exports.throwE = global.throwE = throwE;

function throwE(err) {
	if (err instanceof Error) {
		throw err
	} else {
		throw new Error(err)
	}
};

exports.install = install;

function install(waterline_instance, classMap, core_ip) {
	//安装Router-Handle模块
	require("../socket_handles").install(core_ip).then(function(socket) {
		socket.on("close", function() {
			console.flag("SOCKET CLOSE", "客户端与服务端连接关闭");
		});
		Object.keys(events).forEach(key => {
			console.group(console.flagHead("router-install"));
			console.log("安装", key, "完成")
			events[key].install(socket, waterline_instance, classMap)
			console.groupEnd(console.flagHead("router-install"));
		});
	}).catch((e) => {
		console.error(console.flagHead("ROUTER HANDLES"), "安装失败", e.stack);
	});
};