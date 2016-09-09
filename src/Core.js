"use strict";

const events     = require('events');
const _          = require('underscore');
const Promise    = require('bluebird');
const util       = require('util');

const PluginHost = require('./PluginHost');

class Core extends events.EventEmitter {

	constructor(settings) {
		super();

		this.version = require('../package.json').version;
		process.title = "ShadowBot - version " + this.version;

		this.__isShadow = true;

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

		this.connections = [
			new (require('./Connections/IRC'))(this),
			new (require('./Connections/Facebook'))(this)
		];

		this.plugins = new PluginHost(this);
	}

	start() {
		let promises = [];

		this.connections.forEach(conn => {
			conn.on("message", message => {
				this.emit("message", message, (msg, nick) => message.getResponse().sendMessage(msg, nick));
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
			if(conn.name == name)
				connection = conn;
		});
		return connection;
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
		console.log(`[${level}][${source}] ${message}`);
	}

	_prepareArgumentForLogging(arg) {
		if(typeof arg === 'object' && typeof arg.getMessage === 'function') {
			arg = arg.getMessage();
		} else if(typeof arg !== 'string') {
			arg = util.inspect(arg);
		}

		return arg;
	}

}

module.exports = Core;
