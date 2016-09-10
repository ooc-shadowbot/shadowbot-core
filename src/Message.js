"use strict";

class Message {

	constructor(connection, sender, context, message) {
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
		let our_name = this._connection._core.settings.username;
		return this.isPrivate() || this._message.substr(0, our_name.length) == our_name;
	}

	isCommand() {
		let cmd_char = this._connection._core.settings.commandChar;
		return this._message.substr(0, cmd_char.length) == cmd_char;
	}

	getCommandName() {
		if(!this.isCommand())
			return false;

		let cmd_char = this._connection._core.settings.commandChar;
		let command = this.getMessageSplit();
		return command[0].substr(cmd_char.length);
	}

	getCommandArguments() {
		if(!this.isCommand())
			return false;

		let args = this.getMessageSplit();
		args.shift(args);
		return args;
	}

	getCommandArgument(index, defval = null) {
		if(!this.isCommand())
			return defval;

		let args = this.getCommandArguments();
		if(index < 0 || index >= args.length)
			return defval;

		return args[index];
	}

}

module.exports = Message;
