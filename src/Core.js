"use strict";

const _              = require('underscore');
const Promise        = require('bluebird');
const util           = require('util');

const EventEmitter   = require('./EventEmitter');
const PluginHost     = require('./PluginHost');
const Interface      = require('./Interface');
const CommandHandler = require('./CommandHandler');
const MessageHandler = require('./MessageHandler');

class Core extends EventEmitter {

	constructor(settings) {
		super();

		this.version = require('../package.json').version;
		process.title = "ShadowBot - version " + this.version;

		_.defaults(settings, {
			"connections": {
				"irc": {
					"hostname": "irc.example.org",
					"port": 6667,
					"secure": false,
					"debugChannel": "#bots",
					"supportsFakePrivMsg": false
				},
				"facebook": {
					token:      "none",
					verify:     "none",
					app_secret: "none",
					port:       21111
				},
				"https": {
			        key: false,
			        certificate: false,
					ciphers: "ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:DHE-DSS-AES128-GCM-SHA256:kEDH+AESGCM:ECDHE-RSA-AES128-SHA256:ECDHE-ECDSA-AES128-SHA256:ECDHE-RSA-AES128-SHA:ECDHE-ECDSA-AES128-SHA:ECDHE-RSA-AES256-SHA384:ECDHE-ECDSA-AES256-SHA384:ECDHE-RSA-AES256-SHA:ECDHE-ECDSA-AES256-SHA:DHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA:DHE-DSS-AES128-SHA256:DHE-RSA-AES256-SHA256:DHE-DSS-AES256-SHA:DHE-RSA-AES256-SHA:AES128-GCM-SHA256:AES256-GCM-SHA384:AES128-SHA256:AES256-SHA256:AES128-SHA:AES256-SHA:AES:CAMELLIA:DES-CBC3-SHA:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!aECDH:!EDH-DSS-DES-CBC3-SHA:!EDH-RSA-DES-CBC3-SHA:!KRB5-DES-CBC3-SHA"
				}
			},
			"username": "Shadow",
			"dataPath": "./.data",
			"commandChar": "!"
		});

		this.settings = settings;

		this._interceptConsole();

		this.connections = [
			new (require('./Connections/IRC'))(this),
			new (require('./Connections/Facebook'))(this)
		];

		this.commands = new Map();
		this.messages = new Map();

		this.interface = new Interface(this);
		this.plugins = new PluginHost(this);

		this.onAny((...args) => {
			try {
				this.interface.emit.apply(this.interface, args);
			} catch(e) {
				this.error("Plugin", e);
			}
		});

		this.interface.on('error', (...args) => {
			this.emit.apply(this, args);
		});
	}

	start() {
		let promises = [];

		this.connections.forEach(conn => {
			conn.on("message", message => {
				let reply = (msg, nick) => message.getResponse().sendMessage(msg, nick);

				if(message.isCommand())
					this.emit("command." + message.getCommandName(), message, reply);

				this.emit("message", message, reply);
			});

			conn.on("connected", () => {
				this.emit(conn.getName().toLowerCase() + '.connected', conn);
			});

			conn.on("disconnected", () => {
				this.emit(conn.getName().toLowerCase() + '.disconnected', conn);
			});
			promises.push(conn.connect());
		});

		promises.push(this.plugins.loadAll());

		return Promise.all(promises).then(() => {
			this.log("Core", `all connection handlers successfully started`);
			this.emit("connect");
		});
	}

	getConnection(name) {
		let connection = null;
		this.connections.forEach(conn => {
			if(conn.name.toLowerCase() == name.toLowerCase())
				connection = conn;
		});
		return connection;
	}

	getConnections() {
		return this.connections;
	}

	getPlugin(name) {
		return this.plugins.getPlugin(name);
	}

	getLoadedPlugins() {
		return this.plugins.getLoadedPlugins();
	}

	stop() {
		this.connections.forEach(conn => conn.disconnect());
	}

	error(source, err) {
		err = this._prepareArgumentForLogging(err);
		this.log(source, `[!!!] ${err}`);
		this.emit('error', err, source);
	}

	log(source, message, level) {
		level = level || "info";

		if(['info', 'warn', 'error'].indexOf(level) === -1)
			level = "info";

		message = this._prepareArgumentForLogging(message);
		this._log(`[${level}][${source}] ${message}`);
		this.emit("log", level, source, message);
	}

	registerCommandHandler(name, helptext, handler) {
		if(this.commands.has(name))
			throw new Error(`command ${name} is already registered.`);

		this.commands.set(name, new CommandHandler(name, helptext, handler, this));
	}

	unregisterCommandHandler(name) {
		this.commands.get(name).destroy();
		this.commands.delete(name);
	}

	registerMessageHandler(regex, handler) {
		if(this.messages.has(regex))
			throw new Error(`message ${regex} is already registered.`);

		this.messages.set(regex, new MessageHandler(regex, handler, this));
	}

	unregisterMessageHandler(regex) {
		this.messages.get(regex).destroy();
		this.messages.delete(regex);
	}

	_prepareArgumentForLogging(arg) {
		if(typeof arg === 'object' && typeof arg.getMessage === 'function') {
			arg = arg.getMessage();
		} else if(typeof arg !== 'string') {
			arg = util.inspect(arg);
		}

		return arg;
	}

	_interceptConsole() {
		this._log = console.log;

		['log', 'info', 'warn', 'error', 'dir', 'trace'].forEach(type => {
			const stock = console[type];

			const intercept = (function() {
				const args = Array.prototype.slice.call(arguments);

				const source = this._findSourceInStack();

				this.log(source, args.join(' '), type);

				stock.apply(args);
			}).bind(this);

			console[type] = intercept;
		});
	}

	_findSourceInStack() {
		let source = "unknown";

	    try {
	        let err = new Error();
	        Error.prepareStackTrace = function (err, stack) { return stack; };

			// first lets use the nearest non-shadow stack location and strip away any shadow path
			let root = require('path').resolve(__dirname + "\\..");
			source = err.stack[2].getFileName().replace(root + "\\", "").replace(root + "/", "");

			// now lets loop and try and find the applicable calling plugin
			err.stack.forEach(i => {
				this.plugins.getLoadedPlugins().forEach(p => {
					if(i.getFileName().indexOf(p.getPath()) === 0)
						source = "Plugin/" + p.getName();
				});
			});
	    } catch (err) {}

		return source;
	}

}

module.exports = Core;
