"use strict";

const Shadow     = require('shadowbot-core').Interface;
const Drawing    = require('shadowbot-core').Drawing;
const PluginBase = require('shadowbot-plugin-base');

class ConnectionManager extends PluginBase {

	constructor() {
		super();

		this.command("connections", [
			"This tool is used to manage connections and view their current status.",
			[
				["list",       "list all connections and their status"],
				["disconnect", "disconnect from a connection"],
				["connect",    "connect to a connection"],
				["reconnect",  "disconnect then reconnect to a connection"]
			]
		], this._cmdConnections.bind(this));
	}

	_cmdConnections(message, reply) {
		let commands = {
			"list":       this._cmdConnectionsList,
			"disconnect": this._cmdConnectionsDisconnect,
			"connect":    this._cmdConnectionsConnect,
			"reconnect":  this._cmdConnectionsReconnect
		};

		let command = message.getCommandArgument(0, "list");
		return commands[command] !== undefined ? commands[command](message, reply) : reply(`unknown command '${command}'.`);
	}

	_cmdConnectionsList(message, reply) {
		let table = [["Connection", "Status"]];

		Shadow.getConnections().forEach(conn => {
			table.push([conn.getName(), conn.isConnected() ? "connected" : "disconnected"]);
		});

		reply(Drawing.table(table));
	}

	_cmdConnectionsDisconnect(message, reply) {
		let connection = Shadow.getConnection(message.getCommandArgument(1, null));
		if(!connection) return reply("invalid connection name.");
		reply("attempting to disconnect from " + connection.getName());
		connection.disconnect();
	}

	_cmdConnectionsConnect(message, reply) {
		let connection = Shadow.getConnection(message.getCommandArgument(1, null));
		if(!connection) return reply("invalid connection name.");
		reply("attempting to connect to " + connection.getName());
		connection.connect();
	}

	_cmdConnectionsReconnect(message, reply) {
		let connection = Shadow.getConnection(message.getCommandArgument(1, null));
		if(!connection) return reply("invalid connection name.");
		reply("attempting to disconnect then reconnect to " + connection.getName());
		connection.disconnect();
		connection.connect();
	}

}

module.exports = ConnectionManager;
