// Logs 日志
exports.install = install;
var co = require("co");

function install(classMap, RedisClient) {
	var proto = {
		getUserLogs: co.wrap(function*(num, page, options) {
			num = parseInt(num, 10) || 0;
			page = parseInt(page, 10) || 0;
			var start = num * page;
			var end = num * (page + 1) - 1;
			var res = {};
			options || (options = {});

			var UserLogCon = classMap.get("UserLog");
			var UserLogModel = yield UserLogCon.getModel();

			var criteria = options.where;

			// 初始化查询对象
			if (options.sort) {
				var find_query = UserLogModel.find({
					sort: options.sort
				});
			} else {
				find_query = UserLogModel.find();
			}
			if (criteria) {
				find_query.where(criteria);
			}
			if (num) {
				find_query.limit(num).skip(start);
			}

			find_query.populate("owner")


			var userLogModelList = yield find_query;

			res.num = num || userLogModelList.length;
			res.page = page;
			res.list = userLogModelList;

			// 分页信息
			if (options.with_total_info) {
				var total_num = parseInt(yield UserLogModel.count(criteria));
				if (num && total_num) {
					var total_page = Math.ceil(total_num / num);
				} else {
					total_page = 1;
				}
				res.total_num = total_num;
				res.total_page = total_page;
			}

			return res;
		}),
		getAdminLogs: co.wrap(function*(num, page, options) {
			num = parseInt(num, 10) || 0;
			page = parseInt(page, 10) || 0;
			var start = num * page;
			var end = num * (page + 1) - 1;
			var res = {};
			options || (options = {});

			var AdminLogCon = classMap.get("AdminLog");
			var AdminLogModel = yield AdminLogCon.getModel();

			var criteria = options.where;

			// 初始化查询对象
			if (options.sort) {
				var find_query = AdminLogModel.find({
					sort: options.sort
				});
			} else {
				find_query = AdminLogModel.find();
			}
			if (criteria) {
				find_query.where(criteria);
			}
			if (num) {
				find_query.limit(num).skip(start);
			}


			var adminLogModelList = yield find_query;

			res.num = num || adminLogModelList.length;
			res.page = page;
			res.list = adminLogModelList;

			// 分页信息
			if (options.with_total_info) {
				var total_num = parseInt(yield AdminLogModel.count(criteria));
				if (num && total_num) {
					var total_page = Math.ceil(total_num / num);
				} else {
					total_page = 1;
				}
				res.total_num = total_num;
				res.total_page = total_page;
			}

			return res;
		})
	};
	return proto;
};