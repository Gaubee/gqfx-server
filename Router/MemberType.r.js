exports.install = install;
var co = require("co");

function install(socket, waterline_instance, classMap) {
	var routers = {
		"prefix": "/member_type",
		"get": {
			"/all": [{
				doc: {
					des: "取得所有会员类型",
					returns: [{
						type: "<Model.MemberType>List",
						des: "会员类型列表"
					}]
				},
				emit_with: ["session"]
			}, function*(data) {
				var MemberTypeCon = classMap.get("MemberType");
				this.body = yield MemberTypeCon.find();
			}]
		},
	};
	return routers;
};