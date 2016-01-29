exports.install = install;
var co = require("co");

function install(classMap, RedisClient) {
	var proto = {
		getUsers: co.wrap(function*(num, page, options) {
			num = parseInt(num, 10) || 0;
			page = parseInt(page, 10) || 0;
			var start = num * page;
			var end = num * (page + 1) - 1;
			var res = {};
			options || (options = {});

			var UserCon = classMap.get("User");
			var UserModel = yield UserCon.getModel();

			// 查询标准对象
			var criteria = options.where;

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
		//用户查询
		searchUsers: co.wrap(function*(search_options) {
			if (!search_options) {
				return [];
			}
			var UserCon = classMap.get("User");
			var UserModel = yield UserCon.getModel();
			var res = {};

			//执行查询
			var criteria = search_options.criteria;
			try {
				criteria = JSON.parse(criteria, function(k, v) {
					if (typeof v === "object" && Object.keys(v).length !== 0) {
						return v;
					}
					if (v || v === 0 || v === false) {
						return v;
					}
				});
				console.log(criteria)
			} catch (e) {
				throwE("criteria parse Error, " + e.message);
			}

			var find_query = UserModel.find(criteria);
			var userModelList = yield find_query;
			// console.log(criteria,userModelList)

			//过滤查询结果，把空的查询结果给过滤掉
			if (Array.isArray(criteria.joins)) {
				criteria.joins.forEach(join => {
					userModelList = userModelList.filter(userModel => userModel[join.child])
				})
			}
			console.log(search_options)


			var num = parseInt(search_options.num, 10) || 0;
			var page = parseInt(search_options.page, 10) || 0;
			var start = num * page;
			var end = num * (page + 1) - 1;
			// 分页信息
			if (search_options.with_total_info) {
				var total_num = userModelList.length;
				if (num && total_num) {
					var total_page = Math.ceil(total_num / num);
				} else {
					total_page = 1;
				}
				res.total_num = total_num;
				res.total_page = total_page;
			}
			//分页切片
			userModelList = userModelList.page(num, page);
			res.num = num || userModelList.length;
			res.page = page;
			res.list = userModelList;

			return res;
		}),
		createUserWithMemberType: co.wrap(function*(member_type_id, new_user_info, options) {

			var MemberTypeCon = classMap.get("MemberType");
			var member_type = yield MemberTypeCon.findOne(member_type_id);
			if (!member_type) {
				throwE("找不到指定会员类型")
			}
			var UserCon = classMap.get("User");
			var new_user = yield UserCon.create(new_user_info);
			var AssetCon = classMap.get("Asset");
			member_type.owner = new_user.id;
			new_user.asset = yield AssetCon.clone(member_type); // clone
			var res = yield new_user.save();

			/*LOG*/
			yield classMap.get("AdminLog").create({
				owner: this.model.id,
				type: "admin-create-user-with-membertype",
				log: `管理员创建新会员：${new_user.phone_number}，${member_type.car_flag}`,
				data: {
					new_user: {
						id: new_user.id,
						model: "user"
					},
					associations: ["new_user"]
				}
			});
			return res;
		}),
		changeUserStatus: co.wrap(function*(user_id, status) {
			var UserCon = classMap.get("User")
			var UserModel = yield UserCon.getModel();
			return yield UserModel.update(user_id, {
				status: status
			});
		}),
		getUserById: co.wrap(function*(user_id, is_to_ins) {
			var user = yield classMap.get("User").findOne(user_id, is_to_ins);
			if (!user) {
				throwE("找不到指定用户")
			}
			return user
		}),
		// 给用户充值
		rechargeForUser: co.wrap(function*(user_id, amount) {
			var user = yield this.getUserById(user_id, true);
			return yield user._recharge(amount);
		}),
		// 获取用户返利链上的用户
		getRecommenderChain: co.wrap(function*(user_id, length) {
			length = parseInt(length, 10) || Infinity;
			var res = [];
			var UserCon = classMap.get("User");
			var UserModel = yield UserCon.getModel();
			var recommender_id = user_id;
			var user;
			do {
				user = yield UserModel.findOne(recommender_id).populate("asset");
				if (!user) {
					if (user_id === recommender_id) { //传进来的可能是手机号码
						user = yield UserModel.findOneByPhone_number(recommender_id).populate("asset");
					}
					if (!user) {
						break
					}
				}
				res.push(user);
				recommender_id = user.recommender;
			} while (recommender_id);
			return res;
		}),
		// 发放红利
		payDividends: co.wrap(function*(amount, task_id) {
			/*LOG*/
			yield classMap.get("AdminLog").create({
				owner: this.model.id,
				type: "pay-Dividends",
				log: "发放红利",
				data: {
					amount: amount,
					task_id: task_id
				}
			});
			// 所有用户以及资本信息拿出来
			yield all_users = classMap.get("User").find({}, true);
			// 统计已经发放的所有股份
			var all_stock = 0;
			var shareholder_list = [];
			yield all_users.map(co.wrap(function*(user) {
				var asset = yield user.getAsset();
				if (asset && asset.stock) {
					all_stock += asset.stock;
					shareholder_list.push({
						user: user,
						asset: asset
					})
				}
			}));
			// 均分红利
			yield shareholder_list.map(function(user) {
				return
			});
		}),
	}
	return proto;
}