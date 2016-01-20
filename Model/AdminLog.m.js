module.exports = [{
	title: "商家日志明细",
	identity: 'admin_log',
	schema: true,
	connection: 'default',
	attributes: {
		owner: {
			model: "admin",
			required: true,
		},
		type: {
			type: "string",
			required: true,
		},
		log: {
			type: "text"
		},
		data: {
			type: "json"
		}
	}
}];