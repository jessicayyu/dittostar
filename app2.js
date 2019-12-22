require('dotenv').config();

const snoowrap = require('snoowrap');
const Discord = require('discord.js');
const client = new Discord.Client();
const { prefix } = require('./config.json');
const axios = require('axios');

const TOKEN = process.env.DISCORD_TOKEN;

var testingChannel;
var mainChannel;
client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    testingChannel = getChannel("423338578597380106");
    mainChannel = getChannel("232062367951749121");
});

const r = new snoowrap({
    userAgent: 'MoriConnect',
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    username: process.env.REDDIT_USER,
    password: process.env.REDDIT_PASS
});

const moment = require('moment');
moment().format();

var cooldown = new Set();

function getChannel(channel) {
    var target = null;
    var getChannelCounter = 0;
    return function () {
        while (!target) { 
            target = client.channels.get(channel);
            getChannelCounter++;
            console.log(getChannelCounter);
        }
        return target;
    }
}

function rand(max, min = 0) {
    return min + Math.floor(Math.random() * Math.floor(max));
}

client.on('message', message => {
    if (!message.content.startsWith(prefix) || message.author.bot) {
        return
    }
    var arg = message.content.slice(1).split(' ');
    var cmd = arg[0];
    if (cmd === 'ping') {
        message.channel.send('pong!');
    } else if (cmd === 'raid') {
        if (cooldown.has(message.author.id)) {
            message.channel.send('Hey, slow down, please.');
            console.log('cooldown');
            return;
        } else {
            var role = "657365039979692032";
            const index = prefix.length + cmd.length + 1;
            message.guild.roles.get(role).setMentionable(true)
                .then(() => {
                    message.channel.send('<@&' + role + '> ' + message.content.slice(index))
                        .then(() => {
                            message.guild.roles.get(role).setMentionable(false);
                        });
                    cooldown.add(message.author.id);
                    setTimeout(() => {
                        cooldown.delete(message.author.id);
                    }, 15000);
                });
        }
    } else if (cmd === 'role') {
        if (arg[1] === 'raid') {
           var findRole = message.member.roles.find(r => r.id === '657365039979692032');
           if (findRole) {
                message.member.removeRole('657365039979692032')
                    .then(message.channel.send('Role removed!'));
           } else {
                message.member.addRole('657365039979692032')
                    .then(message.channel.send('Role added!'));
           }
        }
    }
});

client.login(TOKEN);
