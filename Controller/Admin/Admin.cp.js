exports.install = install;
var co = require("co");

function install(classMap, RedisClient) {
	var proto = {
		_checkLevel: function() {
			var levels_permis = [
				"顶级",
				"超级",
			];
			if (levels_permis.indexOf(this.model.level) === -1) {
				throwE("当前管理员权限不足")
			}
			return true;
		},
		createAdminWithLevel: co.wrap(function*(new_admin_info) {
			this._checkLevel();
			var AdminCon = classMap.get("Admin");
			var levels = [
				"财务",
				"会计",
				"普通",
			];
			if (levels.indexOf(new_admin_info.level) === -1) {
				throwE("新建管理员类型有误")
			}
			return yield AdminCon.create(new_admin_info);
		}),
		changeAdminPassword: co.wrap(function*(admin_id, new_password) {
			this._checkLevel();
			var AdminCon = classMap.get("Admin");
			var levels = [
				"财务",
				"会计",
				"普通",
			];
			var admin = yield AdminCon.findOne(admin_id, true);
			if (!admin) {
				throwE("找不到指定管理员")
			}
			if (levels.indexOf(admin.model.level) === -1) {
				throwE("要修改的管理员等级过高")
			}
			admin.model.password = new_password;
			yield admin.model.save();
			return admin;
		})
	}
	return proto;
};