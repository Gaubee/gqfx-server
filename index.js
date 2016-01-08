//加载全局拓展
require("gq-core/lib/global");

function run() {
	//安装Model层
	require("./Model").install(function(waterline_instance) {
		//初始化控制层
		require("./Controller").install(waterline_instance, function(classMap) {
			//初始化路由层
			require("./Router").install(waterline_instance, classMap);
		});

	});
};
if (process.argv.indexOf("--with-server") !== -1) {
	require("gq-core").run().then(run).catch(console.error);
} else {
	run();
}