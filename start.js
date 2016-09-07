"use strict";

const MessageTarget = require('./src/MessageTarget.js');

const ShadowBot = require('./src/Core.js');
const fs = require('fs');

var shadow = new ShadowBot({
	"connections": {
		"irc": {
			"hostname": "irc.ld-cdn.com",
			"port": 6667,
			"secure": false,
			"supportsFakePrivMsg": true
		},
		"facebook": {
			token:      'EAACiDjM4rrMBALvxWIXNQdMkKJlKE9tDX1eBwKGTaUFfLQKLRdPZCEhns2Vz1RUJmF12RbDk6VEhd9fTbj19ArtVTdZBQxiE6KlZCwIcCnkJZBlD1gKzZCkzdENU3wHVB2QVh8VtkQfaZCGvGiO7WTOV2ZCO5yYqck7ZAynhNtDcCAZDZD',
			verify:     'some_cryptic_token_for_securiteh',
			app_secret: '0b7183c8ee2a07da33acca20756316ce',
			port:       21111
		},
		"https": {
	        //key: fs.readFileSync('/home/node/instance-data/node/node-remote.key'),
	        //certificate: fs.readFileSync('/home/node/instance-data/node/node-remote.pem.chain'),
			ciphers: "ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:DHE-DSS-AES128-GCM-SHA256:kEDH+AESGCM:ECDHE-RSA-AES128-SHA256:ECDHE-ECDSA-AES128-SHA256:ECDHE-RSA-AES128-SHA:ECDHE-ECDSA-AES128-SHA:ECDHE-RSA-AES256-SHA384:ECDHE-ECDSA-AES256-SHA384:ECDHE-RSA-AES256-SHA:ECDHE-ECDSA-AES256-SHA:DHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA:DHE-DSS-AES128-SHA256:DHE-RSA-AES256-SHA256:DHE-DSS-AES256-SHA:DHE-RSA-AES256-SHA:AES128-GCM-SHA256:AES256-GCM-SHA384:AES128-SHA256:AES256-SHA256:AES128-SHA:AES256-SHA:AES:CAMELLIA:DES-CBC3-SHA:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!aECDH:!EDH-DSS-DES-CBC3-SHA:!EDH-RSA-DES-CBC3-SHA:!KRB5-DES-CBC3-SHA"
		}
	},
	"username": "Sh4dow",
	"dataPath": "./.data",
	"commandChar": "!"
});

shadow.on('message', (message, reply) => {
	console.log("getConnection().name",          message.getConnection().name);
	console.log("getSender().getIdentifier()",   message.getSender().getIdentifier());
	console.log("getResponse().getIdentifier()", message.getResponse().getIdentifier());
	console.log("getContext().getIdentifier()",  message.getContext().getIdentifier());
	console.log("getMessage()",                  message.getMessage());
	console.log("getMessageSplit()",             message.getMessageSplit());
	console.log("getMessageSplit('-')",          message.getMessageSplit('-'));
	console.log("getCommandName()",              message.getCommandName());
	console.log("getCommandArguments()",         message.getCommandArguments());
	console.log("isPrivate()",                   message.isPrivate());
	console.log("isDirect()",                    message.isDirect());
	console.log("isCommand()",                   message.isCommand());

	message.getResponse().sendMessage("test");
	reply(message.getMessage());
});

shadow.on('error', (err, source) => {
	let irc = shadow.getConnection("IRC");
	let bots = new MessageTarget(irc, "#bots");
	irc.sendMessage(bots, `[!!!][${source}] ${err}`);
})

shadow.start().then(() => {
	let irc = shadow.getConnection("IRC");
	irc.sendRaw("MODE", shadow.settings.username, "+B");
	irc.sendRaw("VHOST", "nsa", "nsa");
	irc.sendRaw("JOIN", "#bots");
	//irc.sendRaw("JOIN", "#shadowacre");

	let shadowacre = new MessageTarget(irc, "#shadowacre");
	irc.sendMessage(shadowacre, "ShadowBot - version " + shadow.version + ". Misbehaving? /msg R4wizard");
});
