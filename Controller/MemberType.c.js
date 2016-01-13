exports.install = install;

var co = require("co");

var Base = require("./Base");
var classMap = require("./index").classMap;
var RedisClient = require("../Model/redis_index");

function install() {
	"use strict";
	class MemberType extends Base {

	};
	return MemberType;
};