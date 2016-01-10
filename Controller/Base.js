"use strict";
var co = require("co");
var waterline = require("../Model");

// var classMap = require("./index").classMap;
class Base {
	constructor(model) {
		var self = this;
		return co(function*() {
			if (model &&
				Function.isFunction(model.toObject) &&
				Function.isFunction(model.save) &&
				Function.isFunction(model.destroy) &&
				Function.isFunction(model.validate) &&
				Function.isFunction(model.toJSON)
			) {
				self.model = model;
			} else {
				if (model && model.id) {
					var classModel = yield waterline.getModel(self.constructor.name);
					self.model = yield classModel.findOne(model.id)
				} else {
					self.model = yield classModel.create(model)
				}
			}
			return self;
		});

	}
	static getInstance(instance_data) {
		return new this(instance_data);
	}
	static find(query_data, is_to_instance) {
		var self = this;
		var model_identity = this.name;
		return co(function*() {
			var classModel = yield waterline.getModel(model_identity);
			var userModelList = yield classModel.find(query_data);
			if (is_to_instance) {
				userModelList = yield userModelList.map(userModel => self.getInstance(userModel));
			}
			return userModelList;
		})
	}
	static findOne(query_data, is_to_instance) {
		var self = this;
		var model_identity = this.name;
		return co(function*() {
			var classModel = yield waterline.getModel(model_identity);
			var userModel = yield classModel.findOne(query_data);
			if (is_to_instance) {
				userModel = yield self.getInstance(userModel);
			}
			return userModel;
		})
	}

	// 会被JSON.stringify调用
	toJSON() {
		//USE Waterline method 
		//waterline\lib\waterline\model\lib\defaultMethods\toObject.js
		return this.model.toObject();
	}

	save() {
		return this.model.save();
	}

	destroy() {
		var self = this;
		return co(function*() {
			yield self.model.destroy();
			self.model = null
		});
	}

	update(new_obj) {
		var self = this;
		return co(function*() {
			// 删除系统自带的
			delete new_obj.id;
			delete new_obj.createdAt;
			delete new_obj.updatedAt;
			for (var key in new_obj) {
				if (new_obj.hasOwnProperty(key) && !Function.isFunction(self.model[key])) {
					self.model[key] = new_obj[key];
				}
			}
			yield self.model.save();

			// 要走数据库的数据整理模块，所以需要重新取一次
			var classModel = yield waterline.getModel(self.constructor.name);
			self.model = yield classModel.findOne(self.model.id);
			return self;
		});
	}
};

module.exports = Base;