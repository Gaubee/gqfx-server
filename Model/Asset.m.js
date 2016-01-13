module.exports = [{
	title: "资产信息",
	identity: 'asset',
	schema: true,
	types: {
		rebates_chain: function() {
			console.log(Array.isArray(this.rebates_chain))
			if (Array.isArray(this.rebates_chain)) {
				this.rebates_chain.length = 9;
				this.rebates_chain = this.rebates_chain.map((rebates_chain_item) => {
					console.log(rebates_chain_item,{
						// 返利值
						rebate_value: Math.max(0, parseFloat(rebates_chain_item.rebate_value) || 0),
						// 互助基金抽取率（从返利值中扣除）
						assist_absorb_rate: Math.range(0, (parseFloat(rebates_chain_item.assist_absorb_rate) || 0), 1),
						// 股份分红率
						share_dividend: Math.range(0, parseFloat(rebates_chain_item.share_dividend) || 0, 1),
					},'----')
					return {
						// 返利值
						rebate_value: Math.max(0, parseFloat(rebates_chain_item.rebate_value) || 0),
						// 互助基金抽取率（从返利值中扣除）
						assist_absorb_rate: Math.range(0, parseFloat(rebates_chain_item.assist_absorb_rate) || 0, 1),
						// 股份分红率
						share_dividend: Math.range(0, parseFloat(rebates_chain_item.share_dividend) || 0, 1),
					}
				});
				console.log(this.rebates_chain)
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
		},
		stock: {
			type: "float",
			title: "股份",
			defaultsTo: 0
		},
		assist: {
			type: "float",
			title: "互助积金",
			defaultsTo: 0
		},
		balance: {
			type: "float",
			title: "余额",
			defaultsTo: 0
		},
		rebates_chain: {
			title: "返利链",
			type: "array",
			rebates_chain: true,
		}
	}
}, ];