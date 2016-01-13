module.exports = [{
	identity: 'user',
	schema: true,
	connection: 'default',
	types: {
		is_phone: $$.phone,
		is_id_number: $$.id_card,
		is_url: $$.isUrl,
		is_bank_card: $$.bank_card,
	},
	attributes: { //PS：初步注册的时候只需要手机号码和密码，其它数据可以再后台进一步完善
		status: {
			type: "string",
			enum: ["冻结", "正常"],
			defaultsTo: "正常"
		},
		password: {
			title: "登录密码",
			type: "string",
			required: true,
			minLength: 6,
			// maxLength: 18,
			md5_2_password: function(cb) { //统一格式化韦64位密码
				if (this.password.length < 32) {
					this.password = $$.md5_2(this.password);
				}
				cb(this.password);
			},
		},
		permis_password: {
			title: "二级密码",
			type: "string",
			minLength: 6,
			md5_2_password: function(cb) { //统一格式化韦64位密码
				if (!this.permis_password) {
					this.permis_password = this.password;
				}
				if (this.permis_password.length < 32) {
					this.permis_password = $$.md5_2(this.permis_password);
				}
				cb(this.permis_password);
			},
		},
		/*
		 * 基本资料
		 */
		real_name: {
			title: "姓名",
			type: "string",
			defaultsTo: "",
			// required: true,
			maxLength: 12
		},
		sex: {
			title: "性别",
			type: "string",
			enum: ["男", "女"],
			// defaultsTo: "男"
		},
		user_name: { //用户名、昵称
			title: "昵称",
			type: "string",
			defaultsTo: function() {
				return (Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2)).substring(0, 6)
			},
			// required: true,
			minLength: 2,
			maxLength: 12,
			// primaryKey: true, //主键
			// index: true, //索引
			unique: true, //唯一
		},
		register_id: {
			title: "注册号",
			type: "string",
			required: true,
			defaultsTo: function() {
				return (Math.random().toString().substr(2) + Math.random().toString().substr(2)).substring(0, 8)
			},
			minLength: 4,
			maxLength: 11,
			// primaryKey: true, //主键
			// index: true, //索引
			unique: true, //唯一
		},
		auth_status: {
			title: "未认证",
			type: "string",
			required: true,
			enum: ["未认证", "认证中", "已认证"],
			defaultsTo: "未认证"
		},
		phone_number: { //手机号码
			title: "联系手机",
			type: "string",
			is_phone: true,
			required: true,
			// primaryKey: true, //主键
			// index: true, //索引
			unique: true, //唯一
		},
		backup_phone_number: { //手机号码
			title: "备用手机",
			type: "string",
			is_phone: true
		},
		email: { //邮箱
			title: "电子邮箱",
			type: "string",
			email: true
		},
		mailing_address: { //通讯地址、邮寄地址
			title: "通讯地址",
			model: "address",
			// required: true
		},
		user_head_url: {
			title: "个人头像",
			type: "string",
			is_url: true
		},
		/*
		 * 认证信息
		 */
		id_number: {
			title: "身份证号码",
			type: "string",
			is_id_number: true
		},
		id_photos: {
			title: "身份证照片",
			type: "string",
			is_url: true
		},
		bank_card_account_name: {
			title: "银行卡开户名",
			type: "string",
			maxLength: 12
		},
		bank: {
			title: "开户银行",
			type: "string",
		},
		bank_card_number: {
			title: "银行卡号",
			type: "string",
			is_bank_card: true
		},
		recommender: {
			title: "注册推荐人",
			model: "user",
		},
		/*
		 * 外部信息
		 */
		asset: {
			title: "资产信息",
			model: "asset"
		}
	}
}, ]