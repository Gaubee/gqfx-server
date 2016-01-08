exports.install = install;
var co = require("co");

function install(socket, waterline_instance, classMap) {
	socket.handles.routerRegister({
		method: "get",
		path: "/user",
		doc: {}
	}, function(data, config, returnData) {
		return co(function*() {
			returnData({
				body: "Hello " + (`<b>${data.query.name}</b>` || "<i>UNKNOWN</i>")
			});
		});
	});
	socket.handles.routerRegister({
		method: "get",
		path: "/user/:name",
		doc: {}
	}, function(data, config, returnData) {
		return co(function*() {
			returnData({
				body: "Hello " + (`<b>${data.params.name}</b>` || "<i>UNKNOWN</i>")
			});
		});
	});
}