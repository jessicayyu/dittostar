require('dotenv').config();

const snoowrap = require('snoowrap');
const Discord = require('discord.js');
const client = new Discord.Client();
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

function getChannel(channel) {
    var target = null;
    var getChannelCounter = 0;
    return function () {
        while (!target) { 
            target = client.channels.get(channel);
            getChannelCounter++;
        }
        return target;
    }
}

function rand(max, min = 0) {
    return min + Math.floor(Math.random() * Math.floor(max));
}

function getModmail() {
    var options = { limit:5, sort: "unread"};
    var timeNow = null;
    return function() {
        r.getSubreddit('pokemongiveaway')
            .getNewModmailConversations({limit:5})
            .map((modmail) => {
                const timeCheck = moment(modmail.lastUserUpdate).isBefore(timeNow) || false;
                if (modmail.messages[0].author.name.isMod) { 
                    return; 
                } 
                if (timeCheck) {
                    return
                } else {
                    console.log("Subject: " + modmail.subject + "\nAuthor:" + modmail.participant.name + "\nhttps://mod.reddit.com/mail/all/" + modmail.id + "\nLast reply: " + modmail.messages[0].author.name.name + "\n ");
                    const timestamp = moment(modmail.messages[0].date).format("dddd, MMMM Do YYYY h:mmA");
                    let body = "";
                    if (modmail.messages[0].bodyMarkdown.length > 100) {
                        body = modmail.messages[0].bodyMarkdown.slice(0,100) + ". . .";
                    } else {
                        body = modmail.messages[0].bodyMarkdown;
                    }
                    const embed = new Discord.RichEmbed()
                        .setTitle("Modmail: " + modmail.subject)
                        .setAuthor("/u/" + modmail.participant.name, "https://i.imgur.com/AvNa16N.png", `https://www.reddit.com/u/${modmail.participant.name}`)
                        .setDescription(body + "\nhttps://mod.reddit.com/mail/all/" + modmail.id + "\n" + timestamp);
                    testingChannel().send(embed);
                    timeNow = moment();
                }
            })
            .catch(console.error);
    }
}

var checkPosts = function() {
    var options = { limit:5, sort: "new"};
    return function() {
        r.getNew('pokemongiveaway', options)
            .map((post, i) => {
                if (post.link_flair_css_class === "giveaway" || post.link_flair_css_class === "hcgiveaway" || post.link_flair_css_class === "contest" || post.link_flair_css_class === "mod" || post.link_flair_css_class === "ddisc") {
                    let timestamp = moment.utc(post.created_utc * 1000).fromNow();
                    console.log("post title: " + post.title + "\nauthor: /u/" + post.author.name + "\n" + post.permalink + "\n" + timestamp + "\n");
                    const embed = new Discord.RichEmbed()
                        .setTitle(post.title)
                        .setAuthor("/u/" + post.author.name, "https://i.imgur.com/AvNa16N.png", `https://www.reddit.com/u/${post.author.name}`)
                        .setThumbnail("https://i.imgur.com/71bnPgK.png")
                        .setDescription("https://www.reddit.com" + post.permalink + "\n" + timestamp);
                    mainChannel().send(embed);
                }
                if (i === 0) {
                    options.before = post.name;
                }
            })
            .catch(console.error);
    }
}

var modmailFeed = getModmail();
setTimeout(modmailFeed, 30000);
setInterval(modmailFeed, 180000);

var postFeed = checkPosts();
setTimeout(postFeed, 30000);
setInterval(postFeed, 120000);

client.on('guildMemberAdd', member => {
    const channel = member.guild.channels.find(ch => ch.name === 'chat-main');
    const greets = [
        `Hello, ${member}! So glad to have you here!`, 
        `Get back in the bag Neb--oh, hi ${member}!`, 
        `Let's have a champion time, ${member}! Ah ha ha, Leon is so corny, isn't he?`,
        `Joining us from Galar, ${member}?`,
        `It's dangerous to go alone, take this! \\*hands ${member} some expired coupons\\*`,
        `Hihi! Sword or Shield, ${member}? Or maybe another generation?`,
        `Hell~loo ${member}! Take a seat anywhere, this is the main room.`
    ];
    if (!channel) return;
    let greeting = greets[rand(6)];
    channel.send(greeting);
    console.log('New user joined server!' + member);
});

client.on('message', message => {
    if (message.type === "GUILD_MEMBER_JOIN") {
        message.delete();
    }
});

client.login(TOKEN);
