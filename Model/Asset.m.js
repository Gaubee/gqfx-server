module.exports = [{
	title: "资产信息",
	identity: 'asset',
	schema: true,
	types: {
		rebates_chain: function() {
			if (Array.isArray(this.rebates_chain)) {
				this.rebates_chain.length = 9;
				this.rebates_chain = this.rebates_chain.map((rebates_chain_item) => {
					rebates_chain_item || (rebates_chain_item = {});
					return {
						// 返利值
						rebate_value: Math.max(0, parseFloat(rebates_chain_item.rebate_value) || 0),
						// 互助基金抽取率（从返利值中扣除）
						assist_absorb_rate: Math.range(0, parseFloat(rebates_chain_item.assist_absorb_rate) || 0, 1),
						// 股份分红率
						share_dividend: Math.range(0, parseFloat(rebates_chain_item.share_dividend) || 0, 1),
					}
				});
				return true;
			}
			return false;
		}
	},
	connection: 'default',
	attributes: {
		car_flag: {
			title: "车主称号",
			type: "text",
			required: true,
			defaultsTo: ""
		},
		stock: {
			type: "float",
			title: "股份",
			number: function(cb) {
				cb(isNaN(this.stock = parseFloat(parseFloat(this.stock).toFixed(4))));
			},
			defaultsTo: 0,
		},
		assist: {
			type: "float",
			title: "互助积金",
			number: function(cb) {
				cb(isNaN(this.assist = parseFloat(parseFloat(this.assist).toFixed(4))));
			},
			defaultsTo: 0,
		},
		balance: {
			type: "float",
			title: "余额",
			number: function(cb) {
				cb(isNaN(this.balance = parseFloat(parseFloat(this.balance).toFixed(4))));
			},
			defaultsTo: 0
		},
		rebates_chain: {
			title: "返利链",
			type: "array",
			rebates_chain: true,
		},
		/*
		 * 申请提现的相关数据
		 */
		apply_wd_status: {
			title: "申请提现的流程状态",
			type: "string",
			enum: ["用户未申请", "用户已申请", "商家已打款" /*,"用户确认收款"==用户未申请*/ ],
			defaultsTo: "用户未申请",
			required: true,
		},
		apply_wd_amount: {
			title: "申请提现的额度",
			type: "float",
			defaultsTo: 0,
			required: true,
		},
		apply_wd_totle_amount: {
			title: "历史申请提现的总和额度",
			type: "float",
			defaultsTo: 0,
			required: true,
		},
		apply_wd_fee_rate: {
			title: "提现手续费率",
			type: "float",
			defaultsTo: 0,
			max: 1,
			min: 0
		},
	}
}, ];