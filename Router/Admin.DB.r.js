exports.install = install;
var co = require("co");
var Context = require("../socket_handles/context");

function install(socket, waterline_instance, classMap) {
	"use strict";
	var routers = {
		"prefix": "/admin/db",
		"get": {},
		"post": {

		},
		"put": {
			// "/refresh/all": [{
			// 	doc: {
			// 		des: "刷新所有表的所有数据",
			// 	},
			// 	emit_with: ["session"]
			// }, function*(data) {

			// }]
		},
		"delete": {

		}
	}
	return routers;
}