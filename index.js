var util       = require('util'),
	events     = require('events'),
	irc        = require('irc'),
	fs         = require('fs'),
	contextify = require('contextify'),
	datastore  = require('nedb'),
	utilities  = require('./utilities.js'),
	_          = require('underscore');

var SIRC       = require('./sirc.js'),
    SFB        = require('./sfb.js');

var pluginContext = {};
pluginContext.Plugin = function() { };

module.exports = ShadowBot = function(settings) {
	var instance = this;
	var events = {};
	this.on = function(eventName, callback, context) {
		context = context || instance;
		events[eventName] = events[eventName] || [];
		events[eventName].push({callback: callback, context: context});
	};

	this.off = function(eventName, callback, context) {
		if(!events[eventName])
			return;

		for(var i = 0, length = events[eventName].length; i < length; i++) {
			if(events[eventName][i] && events[eventName][i].callback == callback && events[eventName][i].context == context)
				events[eventName][i] = undefined;
		}
	};

	this.fire = function(eventName, _) {
		var args = Array.prototype.slice.call(arguments, 1);
		if(events["event"]) {
			for(var i = 0, length = events["event"].length; i < length; i++) {
				events["event"][i].callback.call(events["event"][i].context, eventName, args);
			}
		}

		if(!events[eventName])
			return;

		for(var i = 0, length = events[eventName].length; i < length; i++) {
			if(events[eventName][i] && events[eventName][i].callback && events[eventName][i].context)
				events[eventName][i].callback.apply(events[eventName][i].context, args);
		}
	}


	this.loadedPlugins = {};

	this.irc = new SIRC(this, settings);
	this.fb  = new SFB(this, settings);

	this.setupCoreEvents();

	this.utilities = utilities;
	this.helpers = {};
	this.database = this.createDatastore("shadowbot");

	this.isConnected = false;
};


ShadowBot.prototype.log = function(message, channel) {
	channel = channel || this.settings.debugChannel;
	if(typeof message !== "string")
		message = util.inspect(message);

	console.log(message.replace("\\\n", "\n"));
	if(this.isConnected)
		this.irc.sendMessage(channel, "[LOG] " + message);
	return true;
};

ShadowBot.prototype.close = function(message) {
	message = message || "Restarting for unknown reasons.";
	this.irc.close(message);
	this.fire('close', message);
	// save all DB's and unload all modules!
	process.exit(0);
};

ShadowBot.prototype.setupCoreEvents = function() {
	var instance = this;
	process.on('message', function(message) {
		if(message.from === "supervisor" && message.cmd === "saveExit")
			instance.close(message.rebootMessage);
	});

	process.on('SIGTERM', function() { instance.close("Signal Terminated."); });
	process.on('SIGINT', function() { instance.close("Closed by CTRL+C."); });

	process.on('uncaughtException', function(err) {
		instance.log("--------------- Uncaught Exception ---------------");
		instance.log(util.inspect(err));
		instance.log(util.inspect(err.stack));
		instance.fire('error', err);
	});

	this.irc.ircConnection.addListener('error', function(message) {
		instance.log("IRC error: " + JSON.stringify(message));
		instance.fire('error', message);
	});

	var ircEvents = ["message", "error", "motd", "names", "topic", "join", "part", "quit", "kick", "kill", "notice", "ping", "pm", "ctcp", "ctcp-notice", "ctcp-version", "nick", "invite", "+mode", "-mode", "whois", "channellist_start", "channellist_item", "channellist", "raw", "registered"];
	var ircEvent = function(name) {
		return function() { instance.fire.apply(instance, ["irc " + name].concat(_.toArray(arguments))); };
	};
	for(var event in ircEvents) {
		this.irc.ircConnection.addListener(ircEvents[event], ircEvent(ircEvents[event]));
	}

	var pluginBouncers = {};
	var makePluginBouncer = function(filename) {
		return _.debounce(function() {
			instance.loadPlugin(filename);
		}, 1000, true);
	};
	fs.watch(this.settings.dataPath + "/plugins/", function(event, filename) {
		if(filename && filename[0] != "." && (event == "change" || event == "rename")) {
			if(!pluginBouncers[filename])
				pluginBouncers[filename] = makePluginBouncer(filename);

			setTimeout(pluginBouncers[filename], 1000);
		}
	});
};

ShadowBot.prototype.loadPlugins = function(callback) {
	var instance = this;
	for(var plugin in this.loadedPlugins) {
		try {
			this.loadedPlugins[plugin].instance.close();
		} catch(e) { }
		this.loadedPlugins[plugin] = undefined;
	}

	this.loadedPlugins = {};

	var plugins = fs.readdirSync(this.settings.dataPath + "/plugins/");
	for(var plugin in plugins) {
		plugin = plugins[plugin];
		if(plugin.toString().indexOf(".js") === -1)
			continue;

		this.loadPlugin(plugin.toString());
	}
};

ShadowBot.prototype.createDatastore = function(database) {
	var ds = new datastore({filename: this.settings.dataPath + "/" + database + ".db", autoload: true});
	ds.__isDatastore = true;
	return ds;
};

ShadowBot.prototype.createPluginContext = function(pluginContent, database) {
	var instance = this;
	pluginContent = pluginContent || "Plugin.Name = 'Fake Plugin'; Plugin.Version = '0.0.0a'; Plugin.Contributors = [];";

	process.env.DISPLAY = ":0";
	var context = contextify({
		require: require,
		process: process,
		setTimeout: setTimeout,
		clearTimeout: clearTimeout,
		setInterval: setInterval,
		clearInterval: clearInterval,
		Buffer: Buffer,
		__filename: __filename,
		__dirname: __dirname,
		module: {exports: {}},
		console: {
			log: function() { instance.log.call(instance, arguments); },
			shadow: function() { instance.log.call(instance, arguments, "#shadowacre"); }
		},

		expose: function(obj, method) { return function() { return obj[method].apply(obj, arguments); }; },
		Plugin: function() { },

		irc: irc,
		_: _
	});

	context.global = context.getGlobal();
	context.exports = context.module.exports;

	context.run(pluginContent);
	context.Plugin.prototype.shadow = this;
	context.Plugin.prototype.database = null;
	context.Plugin.prototype.__isPlugin = true;
	context.Plugin.prototype.database = database ? this.createDatastore(database) : null;

	if(!context.Plugin.prototype.close)
		context.Plugin.prototype.close = function() { };

	if(!context.Plugin.prototype.initialise)
		context.Plugin.prototype.initialise = function() { };

	if(!context.Plugin.prototype.initialize)
		context.Plugin.prototype.initialize = function() { };

	if(typeof context.Plugin !== "function") {
		throw new Error("not a valid 'function' plugin.");
	} else if(typeof context.Plugin.Name !== "string") {
		throw new Error("plugin doesn't define a name.");
	} else if(typeof context.Plugin.Version !== "string") {
		throw new Error("plugin doesn't define a version.");
	} else if(typeof context.Plugin.Contributors !== "object") {
		throw new Error("plugin doesn't define a list of contributors.");
	}

	context.run("var instance = new Plugin();");
	context.run("instance.initialise();instance.initialize();");
	return context;
};

ShadowBot.prototype.loadPlugin = function(plugin) {
	if(this.loadedPlugins[plugin] !== undefined) {
		try {
			this.loadedPlugins[plugin].run("instance.close();");
		} catch(e) { }
		this.loadedPlugins[plugin] = undefined;
	}
	try {
		this.loadedPlugins[plugin] = this.createPluginContext(fs.readFileSync(this.settings.dataPath + "/plugins/" + plugin).toString(), plugin.replace(".js", ""));
		return true;
	} catch(err) {
		this.log("error loading plugin '" + plugin + "': ");
		this.log(util.inspect(err));
		this.log(util.inspect(err.stack));
	}
	return false;
};
