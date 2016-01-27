// 资产管理
exports.install = install;
var co = require("co");

function install(classMap, RedisClient) {
	var proto = {
		//获取资产信息
		getAsset: co.wrap(function*() {
			var AssetCon = classMap.get("Asset");
			var asset;
			if (!this.model.asset || !(asset = yield AssetCon.findOne(this.model.asset.id || this.model.asset))) {
				var asset = yield AssetCon.create();
				this.model.asset = asset.id;
				yield this.model.save()
			}
			return asset;
		}),
		//充值
		_recharge: co.wrap(function*(amount, log_msg) {
			amount = parseFloat(amount) || 0;
			var asset = yield this.getAsset();
			asset.balance += amount;

			var res = yield asset.save();

			/*LOG*/
			yield classMap.get("UserLog").create({
				owner: this.model.id,
				type: "user-recharge",
				log: log_msg || `用户充值，额度：${amount}`,
				data: {
					amount: amount,
				}
			});
			return res;
		}),
		//升级
		/*
		 * amount充值的金额
		 * fee手续费
		 */
		_upgradeAssetLevel: co.wrap(function*(member_type_id, amount, fee) {
			amount = parseFloat(amount);
			amount = Number.isFinite(amount) ? amount : 0;
			fee = parseFloat(fee);
			fee = Number.isFinite(fee) ? fee : 0;
			// 获取会员类型
			var MemberTypeCon = classMap.get("MemberType");
			var member_type = yield MemberTypeCon.findOne(member_type_id);
			if (!member_type) {
				throwE("找不到指定会员类型")
			}

			// 获取用户资产
			var asset_modle = yield this.getAsset();
			if (asset_modle.level >= member_type.level) {
				throwE("账户当前等级高于目标等级，升级失败")
			}

			var old_asset_data = asset_modle.toJSON();
			// asset_modle.balance += 20000 * (member_type.level - asset_modle.level);
			var total_amount = member_type.price - amount + fee;
			if (asset_modle.balance < total_amount) {
				throwE("余额不足，升级失败")
			}

			asset_modle.level = member_type.level;
			asset_modle.car_flag = member_type.car_flag;
			asset_modle.balance -= total_amount;
			asset_modle.rebates_chain = member_type.rebates_chain;
			var res = yield asset_modle.save();

			var new_asset_data = asset_modle.toJSON();
			["id", "createdAt", "updatedAt"].forEach(key => {
				delete old_asset_data[key]
				delete new_asset_data[key]
			});
			/*LOG*/
			yield classMap.get("UserLog").create({
				owner: this.model.id,
				type: "user-upgrade-asset-level",
				log: `用户升级到“${member_type.car_flag}”`,
				data: {
					old_data: old_asset_data,
					new_data: new_asset_data,
					amount: amount,
					fee: fee
				}
			});
			return res;
		}),
		useBalanceToUpgradeAssetLevel: co.wrap(function*(member_type_id) {
			// 获取会员类型
			var MemberTypeCon = classMap.get("MemberType");
			var member_type = yield MemberTypeCon.findOne(member_type_id);
			if (!member_type) {
				throwE("找不到指定会员类型")
			}

			return yield this._upgradeAssetLevel(member_type_id, 0, 0)

		}),
	};
	return proto;
};