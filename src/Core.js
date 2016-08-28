"use strict";

const events     = require('events');
const _          = require('underscore');

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
			"dataPath": "./.data/",
			"commandChar": "!"
		});

		this.settings = settings;

		this.connections = [
			new (require('./Connections/IRC'))(this),
			new (require('./Connections/Facebook'))(this)
		];

		this.plugins = new PluginHost();

		let plugin = new (require('./Plugin'))("test", "../plugins/sample/plugin");
		this.plugins.load(plugin);
	}

	start() {
		let promises = [];

		this.connections.forEach(conn => {
			conn.on("message", message => {
				this.emit("message", message, (msg, nick) => message.getResponse().sendMessage(msg, nick));
			});
			promises.push(conn.connect());
		});

		Promise.all(promises).then(() => {
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
		this.log(source, `[!!!] ${err}`);
	}

	log(source, message) {
		console.log(`[${source}] ${message}`);
	}

}

module.exports = Core;
