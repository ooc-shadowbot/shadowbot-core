"use strict";

const Drawing = require('./Drawing');

class CommandHandler {

	constructor(name, helptext, handler, core) {
		this._name = name;
		this._helptext = helptext;
		this._handler = handler;
		this._core = core;

		this._core.interface.on(`command.${this._name}`, this._handler);
		this._core.interface.on(`command.help`, this._helpHandler.bind(this));
	}

	getName() {
		return this._name;
	}

	getHelpText() {
		return this._helptext;
	}

	destroy() {
		this._core.interface.off(`command.${this._name}`, this._handler);
	}

	_helpHandler(message, reply) {
		if(message.getCommandArgument(0) != this._name)
			return false;

		this._helptext.forEach(line => {
			if(typeof line == "string")
				return reply(line);

			reply(Drawing.table(line, {headers: false}));
		});
	}
}

module.exports = CommandHandler;
