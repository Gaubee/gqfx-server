// 资产管理
exports.install = install;
var co = require("co");

function install(classMap, RedisClient) {
	var proto = {
		//获取资产信息
		getAsset: co.wrap(function*() {
			var AssetCon = classMap.get("Asset");
			if (!this.model.asset) {
				var asset = yield AssetCon.create();
				this.model.asset = asset.id;
				yield this.model.save()
			} else {
				console.log(this.model.asset)
				asset = yield AssetCon.findOne(this.model.asset)
			}
			return asset;
		}),
		//充值
		_recharge: co.wrap(function*(amount) {
			amount = parseFloat(amount) || 0;
			var asset = yield this.getAsset();
			asset.balance += amount;
			return yield asset.save();
		})
	};
	return proto;
};