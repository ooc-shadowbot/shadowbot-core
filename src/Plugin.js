"use strict";

const events = require('events');
const NodeVM = require('vm2').NodeVM;
const path   = require('path');
const fs     = require('fs');

class Plugin extends events.EventEmitter {

	constructor(name, pluginPath) {
		super();
		this._name = name;
		this._path = path.resolve(pluginPath);

		this._instance = null;
		this._context  = null;
	}

	static load(packageFilePath) {
		return new Promise((accept, reject) => {
			fs.readFile(packageFilePath, 'utf8', (err, data) => {
				if(err) return reject(err);
				let json = "";

				try {
					json = JSON.parse(data);
				} catch(e) {
					return reject(e);
				}

				accept(new Plugin(json.name, path.dirname(packageFilePath)));
			});
		});
	}

	initialise() {
		return new Promise((accept, reject) => {
			if(this._instance !== null)
				throw new Error("plugin has already been initialised");

			let loaded = instance => {
				this._instance = instance;
				accept();
			};

			let sandbox = {
				__plugin: this,
				__loaded: loaded
			};

			this._vm = new NodeVM({
				console: 'redirect',
				sandbox: sandbox,
				require: {
					external: true,
					builtin: ['fs', 'path'],
					root: "./",
					context: 'sandbox'
				}
			});

			['log', 'info', 'warn', 'error', 'dir', 'trace'].forEach(type => {
				let eventName = `console.${type}`;
				this._vm.on(eventName, (function() {
					this.emit(eventName, arguments);
				}).bind(this));
			});

			try {
				this._vm.run(`
					let __class = require(__plugin.getPath());
					let __instance = new (__class)();
					__loaded(__instance);
				`, this.getPath());
			} catch(e) {
				console.log(e);
				this.emit('console.error', e);
				reject(e);
			}
		});
	}

	destroy() {
		throw new Error("destruction of plugins isn't implimented yet");
	}

	getName() {
		return this._name;
	}

	getPath() {
		return this._path;
	}

	getInstance() {
		return this._instance;
	}

}

module.exports = Plugin;
