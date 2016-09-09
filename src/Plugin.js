"use strict";

const NodeVM = require('vm2').NodeVM;
const path   = require('path');
const fs     = require('fs');

const Interface    = require('./Interface');
const EventEmitter = require('./EventEmitter');

class Plugin extends EventEmitter {

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

	initialise(iface) {
		return new Promise((accept, reject) => {
			if(this._instance !== null)
				throw new Error("plugin has already been initialised");

			this._vm = new NodeVM({
				console: 'redirect',
				sandbox: {},
				require: {
					external: true,
					builtin: ['fs', 'path', 'events'],
					root: "./",
					context: 'sandbox',
					mock: {
						'shadowbot-core': {
							Interface: iface
						}
					},
					import: ['shadowbot-plugin-base']
				}
			});

			['log', 'info', 'warn', 'error', 'dir', 'trace'].forEach(type => {
				let eventName = `console.${type}`;
				this._vm.on(eventName, (function() {
					this.emit(eventName, arguments);
				}).bind(this));
			});

			try {
				let spawner = this._vm.run(`
					module.exports = path => {
						let __class = require(path);
						return new (__class)();
					};
				`, this.getPath());

				this._instance = spawner(this.getPath());
				accept(this._instance);
			} catch(e) {
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
