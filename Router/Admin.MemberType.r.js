exports.install = install;
var co = require("co");
var Context = require("../socket_handles/context");

function install(socket, waterline_instance, classMap) {
	var routers = {
		"prefix": "/admin/member_type",
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
				var admin_loginer = yield this.admin_loginer;
				this.body = yield admin_loginer.getAllMembertype();
			}]
		},
		"post": {
			"/create": [{
				doc: {
					des: "创建会员类型",
					params: [{
						name: "[form]",
						type: "Model.MemberType"
					}],
					returns: [{
						type: "Model.MemberType"
					}]
				},
				emit_with: ["session", "form"]
			}, function*(data) {
				var admin_loginer = yield this.admin_loginer;
				this.body = yield admin_loginer.createMemberType(data.form)
			}]
		},
		"put": {
			"/update/:member_type_id": [{
				doc: {
					des: "修改会员类型",
					params: [{
						name: "[form]",
						type: "Model.MemberType"
					}, {
						name: "[params.member_type_id]",
						des: "要修改的会员类型的ID"
					}]
				},
				emit_with: ["session", "params", "form"]
			}, function*(data) {
				var admin_loginer = yield this.admin_loginer;
				this.body = yield admin_loginer.updateMemberType(data.params.member_type_id, data.form)
			}]
		},
		"delete": {
			"/remove/:member_type_id": [{
				doc: {
					des: "删除会员类型",
					params: [{
						name: "[params.member_type_id]",
						des: "要删除的会员类型的ID"
					}],
					returns: [{
						type: "<Model.MemberType>List",
						des: "被删除的会员类型列表，PS：这里传入的是ID，所以顶多被删除一个对象，如果没得删，返回的就是空数组"
					}]
				},
				emit_with: ["session", "params"]
			}, function*(data) {
				var admin_loginer = yield this.admin_loginer;
				this.body = yield admin_loginer.removeMemberType(data.params.member_type_id);
			}]
		}
	};
	return routers;
};