var co = require("co");

function DbBackUp(version) {
	var old_db_name = "default.db";
	var backup_db_name = "before_v" + version + ".db";
	var db_tmp_root = __dirname + "/../.tmp/";
	var backuper = {
		backup: co.wrap(function*(argument) {
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
		}),
		rollback: co.wrap(function*(argument) {
			console.groupEnd("数据库升级失败");
			console.group("数据库开始回滚");

			fs.createReadStream(db_tmp_root + backup_db_name)
				.pipe(fs.createWriteStream(db_tmp_root + old_db_name))
				.on("close", function() {
					console.groupEnd("数据库回滚完成");
					process.exit(1);
				}).on("error", done);
		})
	};
	return backuper;
};
exports.DbBackUp = DbBackUp;