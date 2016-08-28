"use strict";

const events = require('events');

class Message extends events.EventEmitter {

	constructor(connection, sender, context, message) {
		super();
		this._connection = connection;
		this._sender     = sender;
		this._context    = context;
		this._message    = message;
	}

	getSender() {
		return this._sender;
	}

	getResponse() {
		return this.getContext() || this._sender;
	}

	getConnection() {
		return this._connection;
	}

	getContext() {
		return this._context.isShadow() ? false : this._context;
	}

	getMessage() {
		return this._message;
	}

	getMessageSplit(splitter) {
		splitter = splitter || " ";
		return this._message.split(splitter);
	}

	isPrivate() {
		return this.getContext() === false;
	}

	isDirect() {
		let our_name = this._connection.shadow.settings.username;
		return this.isPrivate() || this._message.substr(0, our_name.length) == our_name;
	}

	isCommand() {
		return this._message[0] == this._connection.shadow.settings.commandChar;
	}

	getCommandName() {
		if(!this.isCommand())
			return false;

		let command = this.getMessageSplit();
		return command[0].substr(1);
	}

	getCommandArguments() {
		if(!this.isCommand())
			return false;

		let args = this.getMessageSplit();
		args.shift(args);
		return args;
	}

}

module.exports = Message;
