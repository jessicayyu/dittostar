require('dotenv').config();

const snoowrap = require('snoowrap');
const Discord = require('discord.js');
const client = new Discord.Client();
const { subreddit, discordInvite } = require('./config.json');
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

const db = require('./db.js');
const moment = require('moment');
moment().format();

const dex = require('./dex-helpers');
const watch = require('./watchers.js');
var cooldown = new Set();
var swear = {};
const mori = require('./dialogue.json');
// const pokeJobs = require('./pokejobs.json');

const prefix = '$';

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
  var arg = message.content.slice(1).split(/ +/);
  var cmd = arg[0];
  let cmdArg = message.content.slice(prefix.length + cmd.length + 1); 
  var location, msg;
  if (cmd === 'time') {
    if (!arg[1]) {
      message.channel.send("Umm... what? You want to know the time where?");
    }
    const zones = mori.timeZones;
    if (message.mentions.users.size) {
      let userID = message.mentions.users.first().id;
      userID = userID.toString();
      db.Member.findOne({userid: userID}, function (err, data) {
        if (err) return console.error(err);
        if (data === null) return console.log(data);
        location = data.timezone;
        watch.timezoneCheck(location, message);
      })
    } else {
      location = zones[cmdArg.toLowerCase()];
      watch.timezoneCheck(location, message);
    }
  } else if (cmd === 'set') {
    if (arg[1] === 'fc') {
      let fcText = message.content.slice(prefix.length + 7);
      db.writeField('friendcode', fcText, message);
    }
  }
});

var getModqueue = function() {
    var timeNow = moment();
    return function() {
      r.getSubreddit(subreddit)
        .getModqueue({limit:5})
        .map((modmail) => {
          const timeCheck = moment(modmail.lastUserUpdate).isBefore(timeNow) || false;
          if (timeCheck) {
            // return;
          } 
          console.log(modmail);
        //   console.log("Subject: " + modmail.subject + "\nAuthor:" + modmail.participant.name + "\nhttps://mod.reddit.com/mail/all/" + modmail.id + "\nLast reply: " + modmail.messages[0].author.name.name + "\n ");
        //   const timestamp = moment(modmail.messages[0].date).format("dddd, MMMM Do YYYY h:mmA");
        //   let body = "";
        //   if (modmail.messages[0].bodyMarkdown.length > 100) {
        //     body = modmail.messages[0].bodyMarkdown.slice(0,100) + ". . .";
        //   } else {
        //     body = modmail.messages[0].bodyMarkdown;
        //   }
        //   const embed = new Discord.RichEmbed()
        //     .setTitle("Modmail: " + modmail.subject)
        //     .setURL("https://mod.reddit.com/mail/all/" + modmail.id)
        //     .setAuthor("/u/" + modmail.participant.name, "https://i.imgur.com/AvNa16N.png", `https://www.reddit.com/u/${modmail.participant.name}`)
        //     .setColor("#ff4500")
        //     .setDescription(body + "\n" + timestamp);
        //   testingChannel().send(embed);
          timeNow = moment();
        })
        .catch(console.error);
    }
};

// var modqueueFeed = getModqueue();
// setTimeout(modqueueFeed, 3000);
// setInterval(modqueueFeed, 60000);

client.login(TOKEN);
