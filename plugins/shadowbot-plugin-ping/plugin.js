"use strict";

const Shadow     = require('shadowbot-core').Interface;
const PluginBase = require('shadowbot-plugin-base');

class PingPong extends PluginBase {

	constructor() {
		super();

		this.command("ping", [
			"Ping.. Pong.. Ping.. Pong"
		], this._cmdPing.bind(this));

		this.command("pong", [
			"Pong.. Ping.. Pong.. Ping"
		], this._cmdPong.bind(this));
	}

	_cmdPing(message, reply) {
		reply("Pong?");
	}

	_cmdPong(message, reply) {
		reply("Ping!");
	}

}

module.exports = PingPong;
