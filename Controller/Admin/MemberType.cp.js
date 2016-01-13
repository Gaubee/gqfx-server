exports.install = install;
var co = require("co");

function install(classMap, RedisClient) {
	var proto = {
		getAllMembertype: co.wrap(function*() {
			var MemberTypeCon = classMap.get("MemberType");
			return yield MemberTypeCon.find();
		}),
		createMemberType: co.wrap(function*(new_member_type_data) {
			var MemberTypeCon = classMap.get("MemberType");
			var member_type_model = yield MemberTypeCon.create(new_member_type_data);
			return member_type_model;
		}),
		updateMemberType: co.wrap(function*(member_type_id, new_member_type_data) {
			var MemberTypeCon = classMap.get("MemberType");
			var member_type = yield MemberTypeCon.findOne(member_type_id, true);
			return yield member_type.update(new_member_type_data)
		}),
		removeMemberType: co.wrap(function*(member_type_id) {
			var MemberTypeCon = classMap.get("MemberType");
			return yield MemberTypeCon.remove(member_type_id);
		})
	}
	return proto;
}