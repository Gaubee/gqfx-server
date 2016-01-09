exports.install = install;
var co = require("co");
var qiniu = require("../lib/qiniu");

function install(socket, waterline_instance, classMap) {
	"use strict";
	socket.handles.routerRegister({
		method: "post",
		path: "/upload/image/base64",
		doc: {
			des: "单张图片上传",
			params: [{
				name: "img_base64",
				type: "Base64",
				des: "要上传图片的BASE64格式的数据，格式为 data:png;base64,QAQ=="
			}]
		},
		emit_with: ["form"]
	}, co.wrap(function*(data) {
		var base64_data = data.form.img_base64;
		if (!base64_data) {
			throwE("参数错误")
		}
		var matches = base64_data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
		if (matches.length !== 3) {
			throwE("数据格式错误")
		}
		var file_type = matches[1];
		if (file_type.indexOf("image\/") !== 0) {
			throwE("上传的文件不是图片类型")
		}
		var file_buffer = new Buffer(matches[2], 'base64');
		var qiniu_ret = yield qiniu.uploadBuff(file_buffer);
		this.body = qiniu_ret[0];
		console.log(this.body)
	}));
};