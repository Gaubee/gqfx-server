module.exports = [{
	title: "发放分红记录",
	identity: 'dividend',
	schema: true,
	connection: 'default',
	attributes: {
		amount: {
			type: "float",
			required: true
		}
	}
}, {
	title: "用户发放到的分红记录",
	identity: 'dividend_item',
	schema: true,
	connection: 'default',
	attributes: {
		amount: {
			type: "float",
			required: true,
		},
		owner: {
			model: "user",
			required: true,
		},
		from: {
			model: "dividend",
			required: true,
		}
	}
}];