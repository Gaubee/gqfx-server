var path = require("path");
var classMap = exports.classMap = new Map();

//遍历出所有Controller模块
var controllers = {};
fs.lsAll(__dirname).forEach(file_path => {
	var _ext = ".c.js";
	if (file_path.endWith(_ext)) {
		var eventName = path.basename(file_path).replace(_ext, "");
		controllers[eventName] = require(file_path);
	}
});

exports.install = install;

function install(waterline_instance, callback) {
	Object.keys(controllers).forEach(key => {
		console.group(console.flagHead("controller-install"));
		console.log("安装", key, "完成")
		classMap.set(key, controllers[key].install(waterline_instance));
		console.groupEnd(console.flagHead("controller-install"));
	});
	callback(waterline_instance, classMap);
};