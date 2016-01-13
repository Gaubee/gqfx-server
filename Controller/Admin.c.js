exports.install = install;

var co = require("co");

var Base = require("./Base");
var classMap = require("./index").classMap;
var RedisClient = require("../Model/redis_index");

function install() {
	"use strict";
	class Admin extends Base {

	};

	fs.lsAll(__dirname + "/Admin").forEach(file_path => {
		var _ext = ".cp.js";
		console.log(file_path)
		if (file_path.endWith(_ext)) {
			console.flag("Install Contrill Proto", file_path);
			Admin.prototype.$extends(require(file_path).install(classMap, RedisClient))
		}
	});

	return Admin
}