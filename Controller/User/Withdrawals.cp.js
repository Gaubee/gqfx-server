// Withdrawals 提款
exports.install = install;
var co = require("co");

function install(classMap, RedisClient) {
	var proto = {
		// 申请提现
		applyWithdrawals: co.wrap(function*(amount) {
			amount = parseFloat(amount) || 0;
			if (!amount || amount <= 0) {
				throwE("申请的提款额度有误")
			}
			var asset = yield this.getAsset();
			if (asset.balance < amount) {
				throwE("余额不足，申请提现失败");
			}
			if (asset.apply_wd_status !== "用户未申请") {
				if (asset.apply_wd_status === "用户已申请") {
					throwE("用户已经申请提现")
				}
				if (asset.apply_wd_status === "商家已打款") {
					throwE("商家已打款，请先确认收款后再进行申请")
				}
				throwE("用户申请提现的状态值有误，无法申请提现")
			}

			var redis_client = yield RedisClient.getClient();
			yield redis_client.thunk.ZADD(["Admin.WithdrawalsApply", Date.now(), this.model.id]);

			asset.apply_wd_status = "用户已申请";
			asset.balance -= amount;
			asset.apply_wd_amount = amount;
			return yield asset.save();
		}),
		//确认申请提现到帐
		confirmWithdrawalsArrive: co.wrap(function*() {
			var asset_model = yield this.getAsset();
			if (asset_model.apply_wd_status !== "商家已打款") {
				if (asset_model.apply_wd_status === "用户已申请") {
					throwE("商家未打款")
				}
				if (asset_model.apply_wd_status === "用户未申请") {
					throwE("用户未申请提现")
				}
				throwE("用户申请提现的状态值有误，无法确认提现到帐")
			}
			asset_model.apply_wd_status = "用户未申请";
			asset_model.apply_wd_totle_amount += asset_model.apply_wd_amount;
			asset_model.apply_wd_amount = 0;
			return yield asset_model.save();
		})
	};
	return proto;
};