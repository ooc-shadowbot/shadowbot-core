"use strict";

const EventEmitter = require('./EventEmitter');

class Interface extends EventEmitter {

	constructor(core) {
		super();
		this._core = core;
	}

	getUser(name) {
		return null;
	}

}

module.exports = Interface;
