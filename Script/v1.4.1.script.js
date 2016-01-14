var co = require("co");

var old_db_name = "default.db";
var backup_db_name = "before_v1.4.1.db";
var db_tmp_root = __dirname + "/../.tmp/";

var run = co.wrap(function*(waterline_instance, classMap) {
	/*
	 * 1.4.1 版本中
	 * Model.Asset 增加了申请提现相关的字段，需要刷新Asset表
	 * Model.MemberType 增加了价格字段，需要刷新MemberType表
	 */
	if (!fs.existsSync(db_tmp_root + backup_db_name)) {
		var _group_name = ["备份数据库", old_db_name, "===>", backup_db_name].join(" ")
		console.group(_group_name);

		function _(done) {
			fs.createReadStream(db_tmp_root + old_db_name)
				.pipe(fs.createWriteStream(db_tmp_root + backup_db_name))
				.on("close", function() {
					done()
				}).on("error", done);
		};
		yield _;
		console.groupEnd("备份完成");
	}

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
	console.groupEnd("数据库升级失败");
	console.group("数据库开始回滚");

	fs.createReadStream(db_tmp_root + backup_db_name)
		.pipe(fs.createWriteStream(db_tmp_root + old_db_name))
		.on("close", function() {
			console.groupEnd("数据库回滚完成");
			process.exit(1);
		}).on("error", done);
}
exports.onerror = onerror;