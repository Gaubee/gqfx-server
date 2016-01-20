module.exports = [{
	title: "用户日志明细",
	identity: 'user_log',
	schema: true,
	connection: 'default',
	attributes: {
		owner: {
			model: "user",
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