"use strict";

const events  = require('events');
const _       = require('underscore');
const Promise = require('bluebird');
const glob    = require('glob');

const Plugin  = require('./Plugin');

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

		let plugins = this._findPlugins();

		return Promise.map(plugins, plugin => {
			return Plugin.load(plugin).then(loaded => this.load(loaded));
		});
	}

	load(plugin) {
		['log', 'info', 'warn', 'error', 'dir', 'trace'].forEach(type => {
			let eventName = `console.${type}`;
			plugin.on(`console.${type}`, args => this._core.log("Plugin/" + plugin.getName(), args, type));
		});

		if(this._loadedPlugins.has(plugin.getName()))
			return Promise.resolve();

		this._loadedPlugins.set(plugin.getName(), plugin);

		return plugin.initialise();
	}

	_findPlugins() {
		let plugins = [];

		// STEP 1: Find any local plugins - these override everything
		plugins = plugins.concat(glob.sync(this._core.settings.dataPath + '/*/package.json'));

		// STEP 2: Find any node_modules that belong in our ecosystem
		plugins = plugins.concat(glob.sync('node_modules/shadowbot-plugin-*/package.json'));

		// STEP 3: Find any built-in plugins
		plugins = plugins.concat(glob.sync('plugins/*/package.json'));

		return plugins;
	}

}

module.exports = PluginHost;
