module.exports = [{
	identity: 'user',
	connection: 'default',
	types: {
		is_phone: $$.phone,
		is_id_number: $$.id_card,
		is_url: $$.isUrl,
		is_bank_card: $$.bank_card,
		password: function(password) {
			if (this.password.length < 32) {
				this.password = $$.md5_2(password);
			}
			return true;
		}
	},
	attributes: { //PS：初步注册的时候只需要手机号码和密码，其它数据可以再后台进一步完善
		password: {
			type: "string",
			required: true,
			minLength: 6,
			// maxLength: 18,
			password: true,//统一格式化韦64位密码
		},
		/*
		 * 基本资料
		 */
		real_name: {
			type: "string",
			defaultsTo: "",
			// required: true,
			maxLength: 12
		},
		sex: {
			type: "string",
			"in": ["男", "女"],
			// defaultsTo: "男"
		},
		user_name: { //用户名、昵称
			type: "string",
			defaultsTo: "",
			// required: true,
			minLength: 2,
			maxLength: 12
		},
		register_id: {
			type: "string",
			required: true,
			defaultsTo: function() {
				return (Math.random().toString().substr(2) + Math.random().toString().substr(2)).substring(0, 8)
			},
			minLength: 4,
			maxLength: 11
		},
		auth_status: {
			type: "string",
			required: true,
			"in": ["未认证", "认证中", "已认证"],
			defaultsTo: "未认证"
		},
		phone_number: { //手机号码
			type: "string",
			is_phone: true,
			required: true,
		},
		backup_phone_number: { //手机号码
			type: "string",
			is_phone: true
		},
		email: { //邮箱
			type: "string",
			email: true
		},
		mailing_address: { //通讯地址、邮寄地址
			model: "address",
			// required: true
		},
		/*
		 * 认证信息
		 */
		id_number: {
			type: "string",
			is_id_number: true
		},
		id_photos: {
			type: "string",
			is_url: true
		},
		bank_card_account_name: {
			type: "string",
			maxLength: 12
		},
		bank: {
			type: "string",
			is_bank_card: true
		},
		recommender: {
			model: "user",
		}
	}
}, ]