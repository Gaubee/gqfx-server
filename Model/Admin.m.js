module.exports = [{
	identity: 'admin',
	schema: true,
	connection: 'default',
	attributes: {
		admin_name: {
			title: "管理员帐号名",
			type: "string",
			required: true
		},
		password: {
			title: "登录密码",
			type: "string",
			required: true,
			minLength: 6,
			md5_2_password: function() {
				if (this.password.length < 32) {
					this.password = $$.md5_2(this.password);
				}
				cb(this.password);
			}
		}
	}
}];