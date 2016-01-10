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
			[
				"register_id",
				"password",
				"auth_status",
				"phone_number",
				"permis_passwor",
			].forEach(key => delete new_obj[key]);
			return super.update(new_obj);
		}
	}
};