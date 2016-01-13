exports.install = install;
var co = require("co");

function install(classMap, RedisClient) {
	var proto = {
		createUserWithMemberType: co.wrap(function*(member_type_id, new_user, options) {

			var MemberTypeCon = classMap.get("MemberType");
			var member_type = yield MemberTypeCon.findOne(member_type_id);
			if (!member_type) {
				throwE("找不到指定会员类型")
			}
			var UserCon = classMap.get("User");
			var new_user = yield UserCon.create(new_user);
			var AssetCon = classMap.get("Asset");
			new_user.asset = yield AssetCon.clone(member_type); // clone
			return yield new_user.save();
		}),

	}
	return proto;
}