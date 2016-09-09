"use strict";

const Shadow     = require('shadowbot-core').Interface;
const PluginBase = require('shadowbot-plugin-base');

class PluginManager extends PluginBase {

	constructor() {
		super();
		console.log("SamplePlugin2 constructed");

		Shadow.on("message", this._handleMessage);
	}

	destroy() {
		console.log("SamplePlugin2 destroyed");
	}

	_handleMessage() {

	}

}

module.exports = PluginManager;
