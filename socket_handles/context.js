var ResponObj = require("./responObj");
module.exports = Context;

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
}