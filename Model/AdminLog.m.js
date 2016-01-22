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