"use strict";

class SamplePlugin {
	
	constructor() {
		console.log("SamplePlugin constructed");
	}

	destroy() {
		console.log("SamplePlugin destroyed");
	}

}

module.exports = SamplePlugin;
