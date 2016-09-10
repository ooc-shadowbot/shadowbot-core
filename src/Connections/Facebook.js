"use strict";

const https      = require('https');
const Bot        = require('messenger-bot');
const Promise    = require('bluebird');

const Connection = require('../Connection');
const Message    = require('../Message');

class Facebook extends Connection {

	constructor(core) {
		super("Facebook", core);

		this._replyHandlers = {};
	}

	connect() {
		return new Promise((accept, reject) => {
			this._connection = new Bot({
				token:      this._core.settings.connections.facebook.token,
				verify:     this._core.settings.connections.facebook.verify,
				app_secret: this._core.settings.connections.facebook.app_secret
			});

			this._connection.on('error', err => this._handleError(err));
			this._connection.on('message', (payload, reply) => this._handleMessage(payload, reply));

			this._https = https.createServer({
				key:     this._core.settings.connections.https.key,
				cert:    this._core.settings.connections.https.certificate,
				ciphers: this._core.settings.connections.https.ciphers
			}, this._connection.middleware()).listen(this._core.settings.connections.facebook.port);

			this.log(`connected and ready for messages`);
			this.emit("connected");
			accept();
		});
	}

	disconnect() {
		this._https.close();
	}

	sendMessage(target, message) {
		let reply = this._getReplyHandler(target.getIdentifier());
		return (typeof reply === 'function') ? reply(`${message}`) : false;
	}

	sendAction(target, message, nick) {
		nick = nick || this._core.settings.username;
		let reply = this._getReplyHandler(target.getIdentifier());
		return (typeof reply === 'function') ? reply(`-${nickname} ${message}-`) : false;
	}

	sendNotice(target, message) {
		let reply = this._getReplyHandler(target.getIdentifier());
		return (typeof reply === 'function') ? reply(`[!!] ${message} [!!]`) : false;
	}

	sendRaw() {
		// Facebook doesn't support any form of raw command sending.
		return false;
	}

	isConnected() {
		return this._https.listening;
	}

	_getReplyHandler(identifier) {
		return message => {
			this._replyHandlers[identifier]({
				text: message
			});

			return true;
		}
	}

	_handleMessage(payload, reply) {
		let text = payload.message.text;

		this._connection.getProfile(payload.sender.id, (err, profile) => {
			if(err) return this._handleError(err);

			let username = (profile.first_name + profile.last_name[0]).replace(/^[a-zA-Z0-9-_]/g, '');
			this._replyHandlers[msg.getSenderIdentifier()] = reply;

			this.emit("message", new Message(this, username, false, message));
		});
	}

}

module.exports = Facebook;
