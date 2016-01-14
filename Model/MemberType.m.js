var AssetModels = require("./Asset.m.js");
/*
 * 会员类型
 * 会员类型指定的是AssetModel的模板
 * 可以克隆成AssetModel
 */
var MemberModel = AssetModels[0].$deepClone();
MemberModel.title = "会员类型"
MemberModel.identity = "member_type";
MemberModel.attributes.car_flag.unique = true; //唯一
MemberModel.attributes.price = {
	title: "标价",
	type: "float",
	defaultsTo: 0,
}
module.exports = [MemberModel];