"use strict";

const EventEmitter = require('./EventEmitter');

class Interface extends EventEmitter {

	constructor(core) {
		super();
		this._core = core;
	}

	registerCommandHandler(name, helptext, handler) {
		this._core.registerCommandHandler(name, helptext, handler);
	}

	unregisterCommandHandler(name) {
		this._core.unregisterCommandHandler(name);
	}

	registerMessageHandler(regex, handler) {
		this._core.registerMessageHandler(regex, handler);
	}

	unregisterMessageHandler(regex) {
		this._core.unregisterMessageHandler(regex);
	}

	getUser(name) {
		return null;
	}

	getConnection(name) {
		return this._core.getConnection(name);
	}

	getConnections() {
		return this._core.getConnections();
	}

	getPlugin(name) {
		return this.getPluginHost().getPlugin(name);
	}

	getPluginHost() {
		return this._core.plugins;
	}

}

module.exports = Interface;
