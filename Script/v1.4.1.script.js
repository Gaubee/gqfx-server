var co = require("co");

var ScriptTools = require("./script_tools");
var backuper = ScriptTools.DbBackUp("1.4.1")

var run = co.wrap(function*(waterline_instance, classMap) {
	yield backuper.backup();
	/*
	 * 1.4.1 版本中
	 * Model.Asset 增加了申请提现相关的字段，需要刷新Asset表
	 * Model.MemberType 增加了价格字段，需要刷新MemberType表
	 */

	console.group("开始执行数据库升级");
	var tables = ["asset", "member_type"];
	var ps = tables.map(co.wrap(function*(table_name) {
		var Table = waterline_instance.collections[table_name];
		// var list = yield Table.find();
		var list = yield Table.destroy();
		console.flag(table_name, "移除数据", list.length, "条")

		var new_list = yield list.map(data => {
			return Table.create(data)
		});

		console.flag(table_name, "新增数据", new_list.length, "条")
	}));
	yield ps;
	console.groupEnd("数据库升级完成");
});
exports.run = run;

function onerror(err) {
	yield backuper.rollback();
}
exports.onerror = onerror;