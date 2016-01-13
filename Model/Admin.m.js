module.exports = [{
	identity: 'admin',
	schema: true,
	connection: 'default',
	attributes: {
		status: {
			type: "string",
			enum: ["冻结", "正常"],
			defaultsTo: "正常"
		},
		level: {
			type: "string",
			enum: ["顶级"],
			defaultsTo: "顶级"
		},
		/* 基础信息 */
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
			md5_2_password: function(cb) {
				if (this.password.length < 32) {
					this.password = $$.md5_2(this.password);
				}
				cb(this.password);
			}
		}
	}
}];