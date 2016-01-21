// Transfers 转账
exports.install = install;
var co = require("co");

function install(classMap, RedisClient) {
	var proto = {
		TransfersToUser: co.wrap(function*(user_phone_number, amount) {
			// 校验是否通过认证
			this._checkVerify();

			amount = parseFloat(amount) || 0;
			if (!amount || amount <= 0) {
				throwE("转账额度有误")
			}
			//收款者
			var payee = yield classMap.get("User").findOne({
				phone_number: user_phone_number
			}, true);
			if (!payee) {
				throwE("找不到指定收款人")
			}

			var asset = yield this.getAsset();
			var admin_config = yield classMap.get("Admin").getConfig();
			var fee = amount * admin_config.转账费率;
			var total_amount = fee + amount;

			if (asset.balance < total_amount) {
				throwE("余额不足，申请提现失败");
			}

			asset.balance -= total_amount;
			var res = yield asset.save();

			/*LOG*/
			yield classMap.get("UserLog").create({
				owner: this.model.id,
				type: "Transfers-To-User",
				log: "用户转账",
				data: {
					payee: {
						id: payee.model.id,
						model: "user"
					},
					amount: amount,
					fee: fee,
					total_amount: total_amount,
					associations: ["payee"]
				}
			});

			/*收款人收到金钱并记录*/
			var payee_asset = yield payee.getAsset();
			payee_asset.balance += amount;
			yield payee_asset.save();

			/*LOG*/
			yield classMap.get("UserLog").create({
				owner: this.model.id,
				type: "Receipt-from-user",
				log: "用户申请提现",
				data: {
					transfer: {
						id: this.model.id,
						model: "user"
					},
					amount: amount,
					fee: fee,
					total_amount: total_amount,
					associations: ["transfer"]
				}
			});

			return res;
		}),
	};
	return proto;
};