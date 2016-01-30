var path = require("path");
/*错误信息整理*/
var ModelMap = new Map();
fs.lsAll(__dirname).forEach(function(file_path) {
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
	if (filename.indexOf(["", "anchor", "lib", "match", "matchRule.js"].join(path.sep)) !== -1) {
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
	} else if (filename.indexOf(["", "waterline", "error", "WLValidationError.js"].join(path.sep)) !== -1) {
		console.log(filename);

		content = content.replace(
				`this.details = util.format('Invalid attributes sent to %s:\\n',this.model)`,
				`var self = this;
			var _model = GQFX_SERVER_MODEL_MAP.get(this.model);
			if (!_model) {
				console.flag("Model no defined", this.model);
				_model = {};
			}
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