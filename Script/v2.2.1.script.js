var co = require("co");

var ScriptTools = require("./script_tools");
var backuper = ScriptTools.DbBackUp("2.2.1");

var run = co.wrap(function*(waterline_instance, classMap) {
	yield backuper.backup();

	console.group("开始执行数据库升级");
	var tables = ["user_log","admin_log"];
	yield tables.map(co.wrap(function*(table_name) {
		var Table = waterline_instance.collections[table_name];
		// var list = yield Table.find();
		var list = yield Table.destroy();
		console.flag(table_name, "移除数据", list.length, "条")
		try {
			var new_list = yield list.map(data => {
				return Table.create(data)
			});
		} catch (e) {
			console.error(e);
			throw e;
		}

		console.flag(table_name, "新增数据", new_list.length, "条")
	}));
	console.groupEnd("数据库升级完成");
});
exports.run = run;

var onerror = co.wrap(function*(err) {
	yield backuper.rollback();
})
exports.onerror = onerror;