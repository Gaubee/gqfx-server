require("gq-core/lib/global");
var tcp = require("gq-core/lib/tcp");
var co = require("gq-core/node_modules/co");
var http = require("http");
setTimeout(process.exit, 4000);
var router_handles = new Map();

var socket = tcp.createClient({
	address: '0.0.0.0',
	family: 'IPv4',
	port: 4001
});
socket.handles = Object.create(null);

function JsonError(errorMsg) {
	if (!(this instanceof JsonError)) {
		return new JsonError(errorMsg);
	}
	if (errorMsg.details) {
		errorMsg = errorMsg.details
	} else if (errorMsg.message) {
		errorMsg = errorMsg.message
	}

	this.errorMsg = errorMsg;
	this.errorTime = +new Date;
};
JsonError.prototype = {
	toString: function() {
		try {
			var result = JSON.stringify(this);
		} catch (e) {
			result = JSON.stringify(String(e));
		}
		return result;
	}
};
var myError = JsonError
var refresh_html_template = `<html><meta http-equiv="refresh" content="0;url={refresh_url}"></html>`

function ResponObj(type, obj) {
	type = type.toLowerCase();
	//TODO:加入压缩、加密功能，客户端将自动解压、解密
	var result;
	switch (type) {
		case "error":
			result = {
				type: "error",
				info: new myError(obj)
			};
			break;
		case "object":
		case "json":
			result = {
				type: "json",
				info: obj
			};
			break;
		case "html":
			result = {
				type: "html",
				info: obj
			};
			break;
		case "refresh":
			if (typeof obj === "string") {
				obj = {
					refresh_url: obj
				}
			};
			result = refresh_html_template.format(obj);
			break;
		default:
			result = {
				type: type,
				info: String(obj)
			};
	};
	return result;
}

function Context(socket, data_info, register_config) {

	register_config.emit_with.forEach((key, index) => {
		data_info[key] = data_info.emit_with[index]
	});

	this.socket = socket;
	this.data_info = data_info;
	this.set_cookies = [];
	this.session = data_info.session || (data_info.session = {});

	var ctx = this;
	this.w = $$.When(1, function() {
		socket.handles.returnData(data_info.task_id, {
			status: ctx._status,
			set_cookies: ctx.set_cookies.length && ctx.set_cookies,
			response_type: ctx.response_type,
			body: ResponObj(ctx.body_type || typeof ctx._body, ctx._body),
			session: ctx.session
		});
	});
};

Context.prototype = {
	get status() {
		return this._status
	},
	set status(val) {
		this._status = parseInt(val);
	},
	cookies: (function() {
		var ctx = this;
		return {
			set: function() {
				ctx.set_cookies.push(Array.slice(arguments));
			},
			get: function() {

			}
		}
	}),
	get body() {
		return this._body;
	},
	set body(val) {
		this._body = val;
		this.w.ok(0);
	},
	get type() {
		return this.response_type
	},
	set type(val) {
		this.response_type = val
	}
};

co(function*() {
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
			console.error(console.flagHead("emit-task"),
				e instanceof Object ?
				(e.toString !== Error.prototype.toString ?
					e :
					e.stack /*如果有重写了toString方法，就用重写的，否则直接打印堆栈*/ ) :
				e);
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

	function init(cb) {
		socket.msgInfo("router-init", {
			info: {
				name: "TEST-name",
				author: "TEST-author",
				version: "TEST-version",
				description: "TEST-description",
			},
			address: {
				host: "0.0.0.0",
				port: 4001
			},
			initKey: "TEST-INIT-KEY-HASH"
		});
		socket.onMsgSuccess("router-init", function(data, done) {
			console.log("路由初始化成功");
			cb();
		});
		socket.onMsgError("router-init", function(data, done) {
			console.log("路由初始化失败");
			cb(new Error("路由初始化失败"));
		});
	}
	yield init;

	console.log("开始注册路由")
		/* TEST */
	socket.handles.routerRegister({
		method: "get",
		path: "/test_test_test",
		emit_with: ["query"]
	}, co.wrap(function*(data) {
		console.log(data.query)
		this.body = data.query
	}));


	setTimeout(function() {
		http.get("http://localhost:4100/test_test_test?name=gaubee", function(res) {
			res.on("data", function(chunk) {
				console.log("结果是：", chunk.toString())
			});
		});
	}, 1000)
}).catch(e => console.error);