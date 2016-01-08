module.exports = JsonError;

function JsonError(errorMsg) {
	if (!(this instanceof JsonError)) {
		return new JsonError(errorMsg);
	}
	if (errorMsg.details) {
		errorMsg = errorMsg.details
	} else if (errorMsg.message) {
		errorMsg = errorMsg.message
	}

	this.errorMsg = errorMsg;
	this.errorTime = +new Date;
};
JsonError.prototype = {
	toString: function() {
		try {
			var result = JSON.stringify(this);
		} catch (e) {
			result = JSON.stringify(String(e));
		}
		return result;
	}
};