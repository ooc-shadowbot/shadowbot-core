"use strict";

const events = require('events');

class MessageTarget extends events.EventEmitter {

	constructor(connection, identifier) {
		super();
		this._connection = connection;
		this._identifier = identifier;
	}

	getConnection() {
		return this._connection;
	}

	getIdentifier() {
		return this._identifier;
	}

	isShadow() {
		let our_name = this._connection.shadow.settings.username;
		return this.getIdentifier().substr(0, our_name.length) == our_name;
	}

	isAuthenticated() {
		return false;
	}

	sendAction(action, nick) {
		this._connection.sendAction(this, action, nick);
	}

	sendMessage(message, nick) {
		this._connection.sendMessage(this, message, nick);
	}

}

module.exports = MessageTarget;
