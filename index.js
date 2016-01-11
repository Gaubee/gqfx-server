//加载全局拓展
require("gq-core/lib/global");

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
		require("./Controller").install(waterline_instance, function(waterline_instance, classMap) {
			//初始化路由层
			require("./Router").install(waterline_instance, classMap, with_ip);
		});
	});
};
if (process.argv.indexOf("--with-server") !== -1) {
	require("gq-core").run().then(run).catch(console.error);
} else {
	run();
}