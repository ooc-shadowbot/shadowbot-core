"use strict";

const events = require('events');

class Connection extends events.EventEmitter {

	constructor(name, shadow) {
		super();
		this.name = name;
		this.shadow = shadow;

		this.log(`initialized connection handler`);
	}

	_handleError(err) {
		this.shadow.error(`Connection/${this.name}`, err);
	}

	log(message) {
		this.shadow.log(`Connection/${this.name}`, message);
	}

}

module.exports = Connection;
