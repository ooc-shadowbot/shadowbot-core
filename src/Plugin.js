"use strict";

const path    = require('path');
const fs      = require('fs');
const decache = require('decache');

const EventEmitter = require('./EventEmitter');

class Plugin extends EventEmitter {

	constructor(name, pluginPath, pkg, core) {
		super();

		this._name = name;
		this._path = path.resolve(pluginPath);
		this._core = core;

		this._instance = null;

		this._package = pkg;

		this._overridden = false;
	}

	static load(packageFilePath, core) {
		return new Promise((accept, reject) => {
			fs.readFile(packageFilePath, 'utf8', (err, data) => {
				if(err) return reject(err);
				let json = {};

				try {
					json = JSON.parse(data);
				} catch(e) {
					return reject(e);
				}

				accept(new Plugin(json.name, path.dirname(packageFilePath), json, core));
			});
		});
	}

	initialise(iface) {
		return new Promise((accept, reject) => {
			if(this._instance !== null)
				throw new Error("plugin has already been initialised");

			try {
				decache(this.getPath());
				let __class = require(this.getPath());
				this._instance = new (__class)();

				accept(this._instance);
			} catch(e) {
				reject(e);
			}
		});
	}

	isLoaded() {
		return this._instance !== null;
	}

	isOverridden() {
		return this._overridden;
	}

	destroy() {
		this._instance._destroy();
		this._instance = null;
	}

	getName() {
		return this._name;
	}

	getAuthor() {
		let author = this._package.author;

		if(typeof author == 'string')
			return author;

		if(typeof author == 'object' && typeof author.name == 'string')
			return author.name;

		return "Unknown";
	}

	getPath() {
		return this._path;
	}

	getInstance() {
		return this._instance;
	}

	getSource() {
		if(this._path.startsWith(path.resolve(this._core.settings.dataPath)))
			return "[1] local data path";

		if(/node_modules(\\|\/)shadowbot-plugin-/.test(this._path))
			return "[2] node_modules";

		return "[3] built-in";
	}

	getSourceLevel() {
		if(this._path.startsWith(path.resolve(this._core.settings.dataPath)))
			return Plugin.SOURCE_LOCAL;

		if(/node_modules(\\|\/)shadowbot-plugin-/.test(this._path))
			return Plugin.SOURCE_MODULE;

		return Plugin.SOURCE_BUILT_IN;
	}

}

Plugin.SOURCE_LOCAL = 1;
Plugin.SOURCE_MODULE = 2;
Plugin.SOURCE_BUILT_IN = 3;

module.exports = Plugin;
