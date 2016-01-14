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
			var AssentCon = classMap.get("Assent");
			var assent = yield AssentCon.find(this.model.assent);
			if (assent.balance < amount) {
				throwE("余额不足，申请提现失败");
			}
		})
	};
	return proto;
};