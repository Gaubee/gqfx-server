var co = require("co");

var ScriptTools = require("./script_tools");
var backuper = ScriptTools.DbBackUp("2.5.0");

var run = co.wrap(function*(waterline_instance, classMap) {
	yield backuper.backup();

	console.group("开始执行数据库升级");
	var UserModel = waterline_instance.collections.user;
	var AssetModel = waterline_instance.collections.asset;
	// var list = yield AssetModel.find();
	var list = yield AssetModel.destroy();
	console.flag("asset", "移除数据", list.length, "条")
	try {
		var new_list = [];
		yield list.map(co.wrap(function*(data) {
			var owner = yield UserModel.findOne({
				asset: data.id
			});
			if (owner) {
				data.owner = owner.id;
				new_list.push(yield AssetModel.create(data));
			}
		}));
	} catch (e) {
		console.error(e);
		throw e;
	}

	console.flag("asset", "新增数据", new_list.length, "条")
	console.groupEnd("数据库升级完成");
});
exports.run = run;

var onerror = co.wrap(function*(err) {
	yield backuper.rollback();
})
exports.onerror = onerror;