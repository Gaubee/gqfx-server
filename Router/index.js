var path = require("path");
var co = require("co");

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
		// 默认的Router安装器
		socket.routerInstaller = function RouterInstaller(routers) {
			var prefix = routers.prefix || "";
			Object.keys(routers).forEach(method => {
				if (["get", "post", "put", "delete"].indexOf(method.toLowerCase()) === -1) {
					return
				}
				var router = routers[method];
				Object.keys(router).forEach(path => {
					var register_info = {
						path: prefix + path,
						method: method
					};
					var config = router[path];
					if (config.length >= 2) {
						register_info = register_info.$mix(config[0]);
						var router_handle = config[1]
					} else {
						var router_handle = config[0]
					}
					router_handle = co.wrap(router_handle);
					socket.handles.routerRegister(register_info, router_handle);
				});
			});
		};

		socket.on("close", function() {
			console.flag("SOCKET CLOSE", "客户端与服务端连接关闭");
		});

		Object.keys(events).forEach(key => {
			console.group(console.flagHead("router-install"));

			console.log("安装", key, "完成")
			var routers = events[key].install(socket, waterline_instance, classMap);
			routers && socket.routerInstaller(routers);

			console.groupEnd(console.flagHead("router-install"));
		});

	}).catch((e) => {
		console.error(console.flagHead("ROUTER HANDLES"), "安装失败", e.stack);
	});
};