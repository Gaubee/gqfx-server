exports.install = install;

var co = require("co");

var Base = require("./Base");
var waterline = require("../Model");
var classMap = require("./index").classMap;
var RedisClient = require("../Model/redis_index");

function install() {
	"use strict";
	class AdminLog extends Base {

	};
	return AdminLog
};