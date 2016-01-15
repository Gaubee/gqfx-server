var Waterline = require('waterline');
var sailsMemoryAdapter = require('sails-memory');
var sailsDiskAdapter = require('sails-disk');
var co = require("co");

// Create the waterline instance.
var waterline = new Waterline();

// Set up the storage configuration for waterline.
var config = {
	adapters: {
		'memory': sailsMemoryAdapter,
		'disk': sailsDiskAdapter,
	},

	connections: {
		default: {
			adapter: 'disk'
				// adapter: 'memory'
		}
	}
};

var install_w = new $$.When(1);
waterline.install = function(cb) {
	install_w.then(function(args) {
		cb(args[0])
	});
	waterline.install = function(cb) {
		install_w.then(function(args) {
			cb(args[0])
		});
	};

	console.group(console.flagHead("model-install"))
	fs.lsAll(__dirname).forEach(function(file_path) {
		if (file_path.endWith(".m.js")) {
			// Add the models to the waterline instance.
			try {
				var _collections = require(file_path);
				if (Array.isArray(_collections)) {
					_collections.forEach(_collection => waterline.loadCollection(
						Waterline.Collection.extend(
							waterline.buildAssociations(_collection))));
				} else {
					waterline.loadCollection(_collections);
				}
				console.log("安装", file_path.replace(__dirname, ""), "成功")
			} catch (e) {
				console.error(file_path);
				console.error(e);
			}
		}
	});
	console.groupEnd(console.flagHead("model-install"));

	waterline.initialize(config, function(err, ontology) {
		if (err) {
			console.error(err);
			return;
		}
		install_w.ok(0, ontology)
	});
};

waterline.ontology = co.wrap(function*() {
	function _(done) {
		waterline.install(function(ontology) {
			done(null, ontology)
		})
	};
	return yield _;
});
var _Model_Cache_;
waterline.getModel = co.wrap(function*(model_identity) {
	model_identity = model_identity.underlize();
	if (!_Model_Cache_) {
		var wl_ins = yield waterline.ontology();
		_Model_Cache_ = wl_ins.collections;
	}
	var classModel = _Model_Cache_[model_identity];
	return classModel;
});

waterline.buildAssociations = function(model) {
	model.associations = [];
	model.types = Object.mix(model.types, {
		title: function() {
			return true
		},
		md5_2_password: function(password) {
			return true
		},
		length: function(str, length) {
			return str.length === length
		},
	});
	Object.keys(model.attributes).forEach(function(attrName) {
		var attr = model.attributes[attrName];
		if (attr.model || attr.collection) {
			var assoc = {
				alias: attrName,
			};
			if (attr.model) {
				assoc.type = 'model';
				assoc.model = attr.model;
			} else {
				assoc.type = 'collection';
				assoc.collection = attr.collection;
			}
			model.associations.push(assoc);
		}
	});
	return model;
};
module.exports = waterline;