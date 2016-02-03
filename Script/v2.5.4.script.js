var co = require("co");

var ScriptTools = require("./script_tools");
var backuper = ScriptTools.DbBackUp("2.5.4");

var run = co.wrap(function*(waterline_instance, classMap) {
	yield backuper.backup();

	console.group("开始执行数据库升级");
	var UserModel = waterline_instance.collections.user;
	var list = yield UserModel.destroy();
	console.flag("user", "移除数据", list.length, "条")
	var new_list = yield list.map(co.wrap(function*(data, index) {
		try {
			if (String.isString(data.id_photos)) {
				data.id_photos = [data.id_photos]
			}
			return yield UserModel.create(data);
		} catch (e) {
			console.error(e);
			throw e;
		}
	}));

	console.flag("user", "新增数据", new_list.length, "条")
	console.groupEnd("数据库升级完成");
});
exports.run = run;

var onerror = co.wrap(function*(err) {
	yield backuper.rollback();
})
exports.onerror = onerror;