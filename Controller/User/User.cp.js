// 子级用户的创建与查看
exports.install = install;
var co = require("co");

function install(classMap, RedisClient) {
	var proto = {
		//创建子用户
		createUserWithMemberType: co.wrap(function*(member_type_id, new_user_info, options) {
			// 获取会员类型
			var MemberTypeCon = classMap.get("MemberType");
			var member_type = yield MemberTypeCon.findOne(member_type_id);
			if (!member_type) {
				throwE("找不到指定会员类型")
			}

			// 获取用户资产
			var asset_modle = yield this.getAsset();
			if (asset_modle.balance < member_type.price) {
				throwE("账户余额不足");
			}
			// 创建子用户
			new_user_info.recommender = this.model.id;
			var new_user_model = yield this.constructor.create(new_user_info);

			// 创建子用户的资产
			var AssetCon = classMap.get("Asset");
			new_user_model.asset = (yield AssetCon.clone(member_type)).id;
			yield new_user_model.save();

			// 扣除用户资产，用于创建子用户的资产
			asset_modle.balance -= member_type.price;
			yield asset_modle.save();

			// 设定推荐者
			new_user_model.recommender = this.model.id;
			yield new_user_model.save();

			// 资产回馈返利链
			var new_user = yield this.constructor.getInstance(new_user_model);
			yield new_user.initRecommender();

			return new_user;
		}),
		// 初始化推荐者，一次性，不可修改
		// 根据返利链，将新用户的资产进行返利分配
		initRecommender: co.wrap(function*(recommender_id) {
			if (!(recommender_id || (recommender_id = this.model.recommender))) {
				throwE("用户无推荐者，无法执行返利")
			}
			// 获取资产信息中的返利链配置
			var asset = yield this.getAsset();
			if (Array.isArray(asset.rebates_chain)) {
				var UserCon = this.constructor;
				var UserModel = yield UserCon.getModel();
				var total_length = asset.rebates_chain.length;
				var recommender_list = Array(total_length).join('|').split('|'); // 推荐者链

				recommender_list.forEach(function(v, index) {
					// console.log(arguments)
					if (index === 0) {
						recommender_list[0] = co.wrap(function*() {
							return yield UserModel.findOne(recommender_id).populate("asset");
						});
						return
					}
					recommender_list[index] = co.wrap(function*() {
						var current_user = yield recommender_list[index - 1]();
						if (current_user && current_user.recommender) {
							return yield UserModel.findOne(current_user.recommender).populate("asset");
						}
					})
				});

				yield asset.rebates_chain.map(co.wrap(function*(rebates_chain_item, index) {
					if (!rebates_chain_item) {
						return
					}
					var current_recommender = yield recommender_list[index]();
					if (!current_recommender) {
						return
					}
					// 根据股份划分等级，股份低的话，无法享有返利
					if (current_recommender.asset.level >= asset.level) {
						current_recommender = yield UserCon.getInstance(current_recommender);
						yield current_recommender._rechargeFromRebatesChain([{
							key: "assist",
							amount: rebates_chain_item.rebate_value * (1 - rebates_chain_item.assist_absorb_rate)
						}, {
							key: "balance",
							amount: rebates_chain_item.rebate_value * rebates_chain_item.assist_absorb_rate
						}]);
					}
				}))
			}

			// 完成整个返利链的返利，保存推荐者信息
			this.model.recommender = recommender_id;
			return yield this.save();
		}),
		// 接受来自返利链的金额
		/*
		[{
			key: "assist",
			amount: 300
		},{
			key: "balance",
			amount: 900
		}]
		 */
		_rechargeFromRebatesChain: co.wrap(function*(key_and_amount_array) {
			var asset = yield this.getAsset();
			key_and_amount_array.forEach(key_and_amount => {
				asset[key_and_amount.key] += key_and_amount.amount;
			});
			yield asset.save();
		}),
	};
	return proto;
};