"use strict";

const irc           = require('irc');
const Promise       = require('bluebird');

const Connection    = require('../Connection');
const Message       = require('../Message');
const MessageTarget = require('../MessageTarget');

class IRC extends Connection {

	constructor(core) {
		super("IRC", core);
		this._d = Date.now();
	}

	connect() {
		return new Promise((accept, reject) => {
			this._connection = new irc.Client(
				this._core.settings.connections.irc.hostname,
				this._core.settings.username,
				{
					userName: this._core.settings.username,
					realName: this._core.settings.username,
					port:     this._core.settings.connections.irc.port,
					secure:   !!this._core.settings.connections.irc.secure
				}
			);

			this._connection.on('error', err => this._handleError(err));
			this._connection.on('message', (from, to, message) => this._handleMessage(from, to, message));

			this._connection.on('registered', () => {
				this.log(`connected and ready for messages`);
				this.emit('connected');
				accept();
			});

			this._connection.on('abort', () => {
				this.log(`failed to maintain connection to irc server, aborting.`);
				this.emit('disconnected');
			});
		});
	}

	disconnect() {
		this._connection.disconnect();
		this.emit('disconnected');
	}

	sendMessage(target, message, nick) {
		if(nick !== undefined && this._core.settings.connections.irc.supportsFakePrivMsg == true)
			return this.sendRaw("FAKEPRIVMSG", nick, target.getIdentifier(), message);

		return this._connection.say(target.getIdentifier(), `${message}`);
	}

	sendAction(target, message, nick) {
		if(nick !== undefined && this._core.settings.connections.irc.supportsFakePrivMsg == true)
			return this.sendRaw("FAKEPRIVMSG", nick, target.getIdentifier(), `\u0001ACTION ${message}\u0001`);

		return this._connection.say(target.getIdentifier(), `\u0001ACTION ${message}\u0001`);
	}

	sendNotice(target, message) {
		return this.sendRaw("NOTICE", target.getIdentifier(), message);
	}

	sendRaw() {
		return this._connection.send.apply(this._connection, arguments);
	}

	isConnected() {
		return this._connection.conn.readyState == 'open';
	}

	_handleMessage(from, to, text) {
		let context = new MessageTarget(this, to);
		let sender  = new MessageTarget(this, from);
		this.emit("message", new Message(this, sender, context, text));
	}

}

module.exports = IRC;
