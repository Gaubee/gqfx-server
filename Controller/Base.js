"use strict";
var co = require("co");

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
					var wl_ins = yield waterline.ontology();
					var classModel = wl_ins.collections[self.constructor.name.unberlize()];
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
		// 删除系统自带的
		delete new_obj.id;
		delete new_obj.createdAt;
		delete new_obj.updatedAt;
		for (var key in new_obj) {
			if (new_obj.hasOwnProperty(key) && !Function.isFunction(this.model[key])) {
				this.model[key] = new_obj[key];
			}
		}
		return this.model.save();
	}
};

module.exports = Base;