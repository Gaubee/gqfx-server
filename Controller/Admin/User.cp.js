exports.install = install;
var co = require("co");

function install(classMap, RedisClient) {
	var proto = {
		getUsers: co.wrap(function*(num, page, options) {
			console.log("options", options)
			num = parseInt(num, 10) || 0;
			page = parseInt(page, 10) || 0;
			var start = num * page;
			var end = num * (page + 1) - 1;
			var res = {};
			options || (options = {});

			var UserCon = classMap.get("User");
			var UserModel = yield UserCon.getModel();

			// 查询标准对象
			var criteria = null;

			// 初始化查询对象
			var find_query = UserModel.find();
			if (criteria) {
				find_query.where(criteria);
			}
			if (num) {
				find_query.limit(num).skip(start);
			}

			// 填充外部字段
			if (Array.isArray(options.populate)) {
				options.populate.forEach(foreignKey => find_query.populate(foreignKey));
			} else if (String.isString(options.populate)) {
				if (options.populate === "*") {
					find_query.populateAll();
				} else {
					find_query.populate(options.populate);
				}
			}

			var userModelList = yield find_query;

			res.num = num || userModelList.length;
			res.page = page;
			res.list = userModelList;

			// 分页信息
			if (options.with_total_info) {
				var total_num = parseInt(yield UserModel.count(criteria));
				if (num && total_num) {
					var total_page = Math.ceil(total_num / num);
				} else {
					total_page = 1;
				}
				res.total_num = total_num;
				res.total_page = total_page;
			}

			return res;
		}),
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
		changeUserStatus: co.wrap(function*(user_id, status) {
			var UserCon = classMap.get("User")
			var UserModel = yield UserCon.getModel();
			return yield UserModel.update(user_id, {
				status: status
			});
		})
	}
	return proto;
}