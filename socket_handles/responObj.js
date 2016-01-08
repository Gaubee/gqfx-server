var myError = require("./responObj.error");
var refresh_html_template = fs.readFileSync(__dirname + "/refresh.html.template").toString();

function ResponObj(type, obj) {
	type = type.toLowerCase();
	//TODO:加入压缩、加密功能，客户端将自动解压、解密
	var result;
	switch (type) {
		case "error":
			result = {
				type: "error",
				info: new myError(obj)
			};
			break;
		case "object":
		case "json":
			result = {
				type: "json",
				info: obj
			};
			break;
		case "html":
			result = {
				type: "html",
				info: obj
			};
			break;
		case "refresh":
			if (typeof obj === "string") {
				obj = {
					refresh_url: obj
				}
			};
			result = refresh_html_template.format(obj);
			break;
		default:
			result = {
				type: type,
				info: String(obj)
			};
	};
	return result;
}
module.exports = ResponObj;