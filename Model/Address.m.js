module.exports = [{
	title: "地址信息",
	identity: 'address',
	connection: 'default',
	attributes: {
		country: {
			type: "string",
			required: true,
			defaultsTo: "中华人民共和国"
		},
		province: {
			type: "string",
			required: true,
		},
		city: {
			type: "string",
		},
		district: {
			type: "string",
		},
		area: {
			type: "string",
		},
		details: {
			type: "string",
			required: true,
			maxLength: 50
		}
	}
}];