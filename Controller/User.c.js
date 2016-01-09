exports.install = install;

var Base = require("./Base")

function install() {
	"use strict";
	return class User extends Base {
		toJSON() {
			var jsonObj = super.toJSON();
			delete jsonObj.password;
			return jsonObj;
		}
		update(new_obj) {
			delete new_obj.register_id;
			return super.update(new_obj);
		}
	}
};