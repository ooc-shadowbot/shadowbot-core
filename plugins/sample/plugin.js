"use strict";

const PluginBase = require('shadowbot-plugin-base');

class SamplePlugin extends PluginBase {

	constructor() {
		super();
		console.log("SamplePlugin constructed");
	}

	destroy() {
		console.log("SamplePlugin destroyed");
	}

}

module.exports = SamplePlugin;
