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
			lowercase: function(cb) {
				this.type = this.type.toLowerCase();
				cb(this.type);
			}
		},
		log: {
			type: "text"
		},
		data: {
			type: "json"
		}
	}
}];