//加载全局拓展
try {
	require("gq-core/lib/global");
} catch (e) {
	require("GQ-core");
}
var co = require("co");

exports.run = run;

function run() {
	var address_index;
	if ((address_index = process.argv.indexOf("--address")) !== -1) {
		var with_ip = process.argv[address_index + 1];
		console.flag("address", with_ip)
	}
	//安装Model层
	require("./Model").install(function(waterline_instance) {
		//初始化控制层
		require("./Controller").install(waterline_instance, co.wrap(function*(waterline_instance, classMap) {

			//查询版本对应的脚本并执行
			var package_json = require("./package.json");
			var script_file_name = "v" + package_json.version + ".script.js";
			var script_file_path = __dirname + "/Script/" + script_file_name;
			if (fs.existsSync(script_file_path)) {
				console.flag("RUN SCRIPT", script_file_name);
				var script_module = require(script_file_path);
				yield script_module.run(waterline_instance, classMap).then(init_router, function(e) {
					console.flag("RUN SCRIPT ERROR", script_file_name);
					console.error(e);
					Function.isFunction(script_module.onerror) && script_module.onerror(e);
				});
			} else {
				var ScriptTools = require("./Script/script_tools");
				var backuper = ScriptTools.DbBackUp(require("./package.json").version)
				yield backuper.backup();

				init_router();
			}

			//初始化路由层
			function init_router() {
				try {
					require("./Router").install(waterline_instance, classMap, with_ip);
				} catch (e) {
					console.error(e.stack)
				}
			}

		}));
	});
};
if (process.argv.indexOf("--with-server") !== -1) {
	require("gq-core").run().then(run).catch(e => console.error(e.stack));
} else {
	run();
}