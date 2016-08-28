"use strict";

const irc           = require('irc');
const Promise       = require('bluebird');

const Connection    = require('../Connection');
const Message       = require('../Message');
const MessageTarget = require('../MessageTarget');

class IRC extends Connection {

	constructor(shadow) {
		super("IRC", shadow);
	}

	connect() {
		return new Promise((accept, reject) => {
			this._connection = new irc.Client(
				this.shadow.settings.connections.irc.hostname,
				this.shadow.settings.username,
				{
					userName: this.shadow.settings.username,
					realName: this.shadow.settings.username,
					port:     this.shadow.settings.connections.irc.port,
					secure:   !!this.shadow.settings.connections.irc.secure
				}
			);

			this._connection.on('error', err => this._handleError(err));
			this._connection.on('message', (from, to, message) => this._handleMessage(from, to, message));

			this._connection.on('registered', () => {
				this.log(`connected and ready for messages`);
				accept();
			});
		});
	}

	disconnect() {
		this._connection.close();
	}

	sendMessage(target, message, nick) {
		if(nick !== undefined && this.shadow.settings.connections.irc.supportsFakePrivMsg == true)
			return this.sendRaw("FAKEPRIVMSG", nick, target.getIdentifier(), message);

		return this._connection.say(target.getIdentifier(), `${message}`);
	}

	sendAction(target, message, nick) {
		if(nick !== undefined && this.shadow.settings.connections.irc.supportsFakePrivMsg == true)
			return this.sendRaw("FAKEPRIVMSG", nick, target.getIdentifier(), `\u0001ACTION ${message}\u0001`);

		return this._connection.say(target.getIdentifier(), `\u0001ACTION ${message}\u0001`);
	}

	sendNotice(target, message) {
		return this.sendRaw("NOTICE", target.getIdentifier(), message);
	}

	sendRaw() {
		return this._connection.send.apply(this._connection, arguments);
	}

	_handleMessage(from, to, text) {
		let context = new MessageTarget(this, to);
		let sender  = new MessageTarget(this, from);
		this.emit("message", new Message(this, sender, context, text));
	}

}

module.exports = IRC;
