"use strict";

const EventEmitter2 = require('eventemitter2').EventEmitter2;

class EventEmitter extends EventEmitter2 {

	constructor() {
		super({
			wildcard: true,
			maxListeners: 100
		});
	}

}

module.exports = EventEmitter;
