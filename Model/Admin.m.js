module.exports = [{
	identity: 'admin',
	schema: true,
	connection: 'default',
	attributes: {
		admin_name: {
			type: "string",
			required: true
		},
		password: {
			type: "string",
		}
	}
}];