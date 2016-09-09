"use strict";

const EventEmitter = require('./EventEmitter');

class Connection extends EventEmitter {

	constructor(name, core) {
		super();
		this.name = name;
		this._core = core;

		this.log(`initialized connection handler`);
	}

	_handleError(err) {
		this._core.error(`Connection/${this.name}`, err);
	}

	log(message) {
		this._core.log(`Connection/${this.name}`, message);
	}

}

module.exports = Connection;
