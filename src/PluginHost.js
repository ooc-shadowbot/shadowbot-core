"use strict";

const events  = require('events');
const _       = require('underscore');
const Promise = require('bluebird');
const Plugin  = require('./Plugin.js')

class PluginHost extends events.EventEmitter {

	constructor(core) {
		super();

		this._core = core;
		this._loadedPlugins = new Map();
	}

	unloadAll() {
		let plugins = [];
		this._loadedPlugins.forEach(plugin => plugins.push(this.unload(plugin)));
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
		plugins.push(this.load(new Plugin("SamplePlugin", "plugins/sample/plugin.js")));
		return Promise.all(plugins);
	}

	load(plugin) {
		['log', 'info', 'warn', 'error', 'dir', 'trace'].forEach(type => {
			let eventName = `console.${type}`;
			plugin.on(`console.${type}`, args => this._core.log("Plugin/" + plugin.getName(), args, type));
		});

		this._loadedPlugins.set(plugin.getName(), plugin);

		return plugin.initialise();
	}

}

module.exports = PluginHost;
