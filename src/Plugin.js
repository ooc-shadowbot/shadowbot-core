"use strict";

const events = require('events');
const vm     = require('vm');

class Plugin extends events.EventEmitter {

	constructor(name, path) {
		super();
		this._name = name;
		this._path = path;

		this._instance = null;
		this._context  = null;
	}

	initialise() {
		return new Promise((accept, reject) => {
			if(this._instance !== null)
				throw new Error("plugin has already been initialised");

			let loaded = () => {
				this._instance = this._context.__instance;

				delete this._context.__instance;
				delete this._context.__loaded;
				accept();
			};

			this._context = vm.createContext({
				__plugin: this,
				__loaded: loaded
			});

			vm.runInContext('var __instance = new (__plugin.getClass())(__loaded);', this._context);
		});
	}

	getName() {
		return this._name;
	}

	getPath() {
		return this._path;
	}

	getClass() {
		return require(this._path);
	}

	getInstance() {
		return this._instance;
	}

}

module.exports = Plugin;
