// console.log(module)
require("gq-core/lib/global");
var co = require("co");
/*错误信息整理*/
var ModelMap = new Map();
fs.lsAll(__dirname + "/../Model").forEach(function(file_path) {
	if (file_path.endWith(".m.js")) {
		// Add the models to the waterline instance.
		var _collections = require(file_path);
		_collections.forEach(function(model) {
			ModelMap.set(model.identity, model)
		});
	};
});
global.GQFX_SERVER_MODEL_MAP = ModelMap;
// var a = require("sails-hook-validation");
var Module = require('module');
var _compile = Module.prototype._compile;
Module.prototype._compile = function(content, filename) {
	if (filename.indexOf("\\anchor\\lib\\match\\matchRule.js") !== -1) {
		content = content.replace(`util.format('"%s" validation rule failed for input: %s', ruleName, util.inspect(data))`,
			`(function(){
				var ruleNameMap = {
					"minLength":"最短长度"
				}
				if (ruleName === "minLength") {
					return "至少需要"+args[1]+"位的长度"
				}
				return util.format('"%s" 校验失败: %s', ruleName, util.inspect(data))
			}())`
		)
	} else if (filename.indexOf("\\waterline\\error\\WLValidationError.js") !== -1) {
		console.log(filename);

		content = content.replace(
				`this.details = util.format('Invalid attributes sent to %s:\\n',this.model)`,
				`var self = this;
			var _model = GQFX_SERVER_MODEL_MAP.get(this.model);
			var _model_validationMessages = _model.validationMessages||{};
			this.details = util.format('%s对象属性校验出错:\\n',_model.title||this.model)`
			).replace(
				`memo += ' • ' + attrName + '\\n';`,
				`memo += ' • ' + (_model.attributes[attrName].title||attrName) + '\\n';`
			)
			.replace(
				`memo += '   • ' + message + '\\n';`,
				`memo += '   • ' + (function(validationMessages){
					var res
					if (validationMessages) {
						self.invalidAttributes[attrName].some(function (rule_msg) {
							if (rule_msg.message === message) {
								res = validationMessages[rule_msg.rule]
								return true
							}
						})
					};
					return res;
				}(_model_validationMessages[attrName])||message) + '\\n';`
			)
	}
	return _compile.call(this, content, filename)
};
var waterline = require("../Model");
var Waterline = require("waterline");


waterline.install(co.wrap(function*(wl) {
	try {
		setTimeout(function() {
			process.exit(0)
		}, 1000);

		var user = yield waterline.collections.user.create({
			phone_number: "18046048662",
			// password: "123"
		});

		console.log(user);

	} catch (e) {
		// console.log(Object.keys(e));
		// console.log(e.model, e.invalidAttributes);
		// console.log(e.messages);
		console.error("QAQ", e);
		// console.log(e.invalidAttributes)
	}
}));