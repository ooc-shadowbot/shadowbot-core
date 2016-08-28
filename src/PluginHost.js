"use strict";

const events  = require('events');
const _       = require('underscore');
const Promise = require('bluebird');

class PluginHost extends events.EventEmitter {

	constructor() {
		super();

		this.loadedPlugins = new Map();
	}

	unloadAll() {
		let plugins = [];
		this._loadedPlugins.forEach(plugin => this.unload(plugin));
		return Promise.all(plugins);
	}

	unload(plugin) {
		if(plugin.getInstance())
			return plugin.getInstance().destroy();

		return Promise.reject("plugin not loaded");
	}

	loadAll() {
		this.unloadAll();

		let plugins = [];
		// load plugins here?
		plugins.push("path/to/plugin");
		return Promise.all(plugins);
	}

	load(plugin) {
		return plugin.initialise();
	}

}

module.exports = PluginHost;
