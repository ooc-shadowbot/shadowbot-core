"use strict";

const _       = require('underscore');
const Promise = require('bluebird');
const glob    = require('glob');
const path    = require('path');

const Drawing = require('./Drawing');
const Plugin  = require('./Plugin');

class PluginHost {

	constructor(core) {
		this._core = core;
		this._loadedPlugins = new Map();

		this._interceptRequireResolve();
	}

	unloadAll() {
		let plugins = [];
		this._loadedPlugins.forEach(plugin => plugins.push(this.unload(plugin)));
		return Promise.all(plugins);
	}

	unload(plugin) {
		if(plugin.getInstance())
			return plugin.destroy();

		return Promise.resolve();
	}

	loadAll() {
		this.unloadAll();

		let plugins = this._findPlugins();
		return Promise.map(plugins, plugin => {
			return Plugin.load(plugin, this._core).then(loaded => this.load(loaded));
		});
	}

	load(plugin) {
		if(this._loadedPlugins.has(plugin.getName())) {
			let existing = this._loadedPlugins.get(plugin.getName());
			if(existing.isLoaded()) {
				plugin._overridden = true;
				this._loadedPlugins.set(plugin.getName() + "-" + (Math.random() * 1e6 | 0), plugin);
				return Promise.resolve();
			}
		}

		this._loadedPlugins.set(plugin.getName(), plugin);
		return plugin.initialise(this._core.interface).catch(e => this._core.error("Plugins/" + plugin.getName(), e));
	}

	getLoadedPlugins() {
		return this._loadedPlugins;
	}

	getPlugin(name) {
		return this._loadedPlugins.get(name);
	}

	_findPlugins() {
		let plugins = [];

		// STEP 1: Find any local plugins - these override everything
		plugins = plugins.concat(glob.sync(this._core.settings.dataPath + '/plugins/*/package.json'));

		// STEP 2: Find any node_modules that belong in our ecosystem (excluding the base plugin!)
		plugins = plugins.concat(glob.sync('node_modules/shadowbot-plugin-!(base)/package.json'));
		
		return plugins;
	}

	_interceptRequireResolve() {
		const Module = require('module');
		let _load = Module._load;

		Module._load = (request, parent) => {
			if(request == 'shadowbot-core') {
				return {
					Interface: this._core.interface,
					Drawing: Drawing
				};
			}

			return _load(request, parent);
		};
	}

}

module.exports = PluginHost;
