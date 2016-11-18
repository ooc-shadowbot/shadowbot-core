"use strict";

class MessageHandler {

	constructor(regex, handler, core) {
		this._regex = regex;
		this._handler = handler;
		this._core = core;

		this._core.interface.on(`message`, (message, reply) => {
			let matches = message.match(regex);
			if(matches)
				this._handler(message, matches, reply);
		});
	}

	getRegex() {
		return this._regex;
	}

	destroy() {
		this._core.interface.off(`message`, this._handler);
	}

}

module.exports = MessageHandler;
