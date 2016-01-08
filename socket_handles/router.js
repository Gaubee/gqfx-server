var co = require("co");
var ResponObj = require("./responObj");
var Context = require("./context");

var router_handles = exports.router_handles = new Map();

exports.install = install;

function install(socket) {
	//注册
	socket.handles.routerRegister = function(register_info, handle_fun) {
		router_handles.set(`[${register_info.method.toLowerCase()}]${register_info.path}`, {
			config: register_info,
			handle: handle_fun
		});
		socket.msgInfo("router-register", register_info);
	};
	socket.onMsgSuccess("router-register", function(data, done) {
		var register_info = data.info;
		var _handle_id = `[${register_info.method.toLowerCase()}]${register_info.path}`;
		var _router_handle = router_handles.get(_handle_id);
		if (_router_handle) {
			_router_handle.config = register_info;
			console.log("路由注册成功", _handle_id);
		} else {
			console.error("未知错误 >>> 路由注册成功", _handle_id)
		}
		done();
	});
	socket.onMsgError("router-register", function(data, done) {
		console.error("路由注册失败", data.info);
		done();
	});

	//触发
	socket.onMsgInfo("emit-task", function(data, done) {
		console.flag("CLIENT:emit-task", data);

		var data_info = data.info;

		function returnData(data, type) {
			data.body = ResponObj(type || typeof data, data)
			socket.handles.returnData(data_info.task_id, data);
		};
		co(function*() {
			// 发送任务所需的数据
			var _handle_id = `[${data_info.method.toLowerCase()}]${data_info.path}`;
			var _router_handle = router_handles.get(_handle_id);
			if (_router_handle) {
				_router_handle.config.emit_with.forEach((key, index) => {
					data_info[key] = data_info.emit_with[index]
				});
				yield _router_handle.handle.call(new Context(socket, data_info, _router_handle.config), data_info, _router_handle.config);
			} else {
				console.error(console.flagHead("emit-task"), "找不到处理函数：", _handle_id)
			}
		}).then(done).catch(e => {
			console.error(console.flagHead("emit-task"), e.stack);
			socket.handles.returnData(data_info.task_id, {
				status: 502,
				body: ResponObj("error", e)
			});
			done();
		});
	});
	//数据返回
	socket.handles.returnData = function(task_id, data) {
		socket.msgInfo("return-task", {
			task_id: task_id,
			return_data: data
		});
	};

	socket.onMsgSuccess("return-task", function(data, done) {
		console.log("路由触发成功");
		done();
	});
	socket.onMsgError("return-task", function(data, done) {
		console.error("路由触发失败", data.info);
		done();
	});

	// 延迟请求时长
	// 暂时不受处理这部分

};