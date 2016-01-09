var qiniu = require("qiniu");
var thunkify = require("./thunkify");
// var thunkify = require("thunkify");
//初始化配置
qiniu.conf.ACCESS_KEY = 'x2AujEgid31kflvGvHoYqVpT4G3pIfVKb72h0Dfa';
qiniu.conf.SECRET_KEY = 'zVWddMrnj2170Sux7MExyCiNTW-KF4FBzOjrQYcU';

var scope = "gqfx";
var callbackUrl = null;
var callbackBody = null;
var returnUrl = null;
var returnBody = '{\
"key": $(key),\
"size": $(fsize),\
"info": $(imageInfo),\
"mime": $(mimeType),\
"imageAve": $(imageAve)\
}';
var asyncOps = null;
var endUser = null;
var expires = null;

var putPolicy = new qiniu.rs.PutPolicy(scope, callbackUrl, callbackBody, returnUrl, returnBody, asyncOps, endUser, expires);

var extra = new qiniu.io.PutExtra();
/*//测试结果中得出结论，cb的第一个参数默认是err参数，如果非空，则当成错误来出来进行抛出
function _test(uptoken, filePath, extra, cb){
	console.log("?????");
	cb("????xxx",null,{name:"hehehehe"},null);
}
var test = thunkify(_test);*/
// var putFileWithoutKey = thunkify(qiniu.io.putFileWithoutKey);

// putFileWithoutKey(uptoken,"../_temp/10704-b01s6e.bmp",extra)(function (err,ret) {
// 	console.log(arguments);
// });

//下载
var qiniuKoa = {
	upload: thunkify(function(filePath, cb) {
		var uptoken = putPolicy.token();
		qiniu.io.putFileWithoutKey(uptoken, filePath, extra, cb);
	}),
	uploadBuff: thunkify(function(body, cb) {
		var uptoken = putPolicy.token();
		qiniu.io.putWithoutKey(uptoken, body, extra, cb);
	})
};
module.exports = qiniuKoa;