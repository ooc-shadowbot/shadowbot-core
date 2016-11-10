"use strict";

const Shadow     = require('shadowbot-core').Interface;
const Drawing    = require('shadowbot-core').Drawing;
const PluginBase = require('shadowbot-plugin-base');

class PluginManager extends PluginBase {

	constructor() {
		super();

		this.command("plugins", [
			"This tool is used to manage plugins and view their status.",
			[
				["list [all]", "list all plugins and their status"],
				["load",       "load a plugin"],
				["unload",     "unload a plugin"],
				["reload",     "reload a plugin"],
				["load-all",   "load all plugins"],
				["unload-all", "unload all plugins (this unloads the plugin manager too!!)"],
				["reload-all", "unload then reload all plugins"]
			]
		], this._cmdPlugins.bind(this));
	}

	_cmdPlugins(message, reply) {
		let commands = {
			"list":       this._cmdPluginsList,
			"load":       this._cmdPluginsLoad,
			"unload":     this._cmdPluginsUnload,
			"reload":     this._cmdPluginsReload,
			"load-all":   this._cmdPluginsLoadAll,
			"unload-all": this._cmdPluginsUnloadAll,
			"reload-all": this._cmdPluginsReloadAll
		};

		let command = message.getCommandArgument(0, "list");
		return commands[command] !== undefined ? commands[command](message, reply) : reply(`unknown command '${command}'.`);
	}

	_cmdPluginsList(message, reply) {
		let table = [];

		Shadow.getPluginHost().getLoadedPlugins().forEach(plugin => {
			let status = plugin.isLoaded() ? "loaded" : "unloaded";

			if(plugin.isOverridden()) {
				if(message.getCommandArgument(1, "") != "all")
					return false;
				status = "overridden";
			}

			table.push([plugin.getName(), plugin.getAuthor(), plugin.getSource(), status]);
		});

		table.unshift(["Plugin", "Author", "Source", "Status"]);
		reply(Drawing.table(table, {sort: 2}));
	}

	_cmdPluginsLoad(message, reply) {
		let plugin = Shadow.getPlugin(message.getCommandArgument(1, null));
		if(!plugin) return reply("invalid plugin name.");
		reply("attempting to load " + plugin.getName());
		Shadow.getPluginHost().load(plugin);
	}

	_cmdPluginsUnload(message, reply) {
		let plugin = Shadow.getPlugin(message.getCommandArgument(1, null));
		if(!plugin) return reply("invalid plugin name.");
		reply("attempting to unload " + plugin.getName());
		Shadow.getPluginHost().unload(plugin);
	}

	_cmdPluginsReload(message, reply) {
		let plugin = Shadow.getPlugin(message.getCommandArgument(1, null));
		if(!plugin) return reply("invalid plugin name.");
		reply("attempting to unload and reload " + plugin.getName());
		Shadow.getPluginHost().unload(plugin).then(Shadow.getPluginHost().load(plugin));
	}

	_cmdPluginsLoadAll(message, reply) {
		reply("attempting to load all plugins");
		Shadow.getPluginHost().loadAll();
	}

	_cmdPluginsUnloadAll(message, reply) {
		reply("attempting to unload all plugins");
		Shadow.getPluginHost().unloadAll();
	}

	_cmdPluginsReloadAll(message, reply) {
		reply("attempting to unload and reload all plugins");
		Shadow.getPluginHost().unloadAll().then(Shadow.getPluginHost().loadAll());
	}

}

module.exports = PluginManager;
