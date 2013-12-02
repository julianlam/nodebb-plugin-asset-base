var	handlebars = require('handlebars'),
	fs = require('fs'),
	path = require('path'),
	async = require('async'),

	clients = [],
	templates = {},
	Assets = {};

Assets.init = function() {
	fs.readFile(path.join(__dirname, './templates/assetBlock.hbs'), function(err, templateHTML) {
		templates.assetBlock = handlebars.compile(templateHTML.toString());
	});
};

Assets.addClient = function(clientObj) {
	if (clientObj.id && clientObj.method) {
		clientObj.lib = module.parent.require(clientObj.id + '/library');
		clients.push(clientObj);

		if (clientObj.callback) {
			clientObj.callback(null);
		} else {
			return true;
		}
	} else {
		if (clientObj.callback) {
			clientObj.callback(new Error('id-or-method-missing'));
		} else {
			return false;
		}
	}
};

Assets.buildFooter = function(postContent, callback) {
	var	assetsArr = [];

	async.reduce(clients, postContent, function(postContent, clientObj, next) {
		clientObj.method(postContent, function(err, newAssets) {
			assetsArr = assetsArr.concat(newAssets);
			next(err, postContent);
		});
	}, function(err) {
		callback(err, !err ? postContent + templates.assetBlock({
			assets: assetsArr
		}) : undefined);
	});
};

Assets.init();
module.exports = {
	addClient: Assets.addClient,
	buildFooter: Assets.buildFooter
};