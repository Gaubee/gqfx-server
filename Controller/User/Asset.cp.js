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
				log: log_msg || "用户充值",
				data: {
					amount: amount,
				}
			});
			return res;
		})
	};
	return proto;
};