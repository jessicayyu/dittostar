require('dotenv').config();

const snoowrap = require('snoowrap');
const Discord = require('discord.js');
const client = new Discord.Client();
const { prefix, subreddit } = require('./config.json');
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

function getModmail() {
    var timeNow = moment();
    return function() {
        r.getSubreddit(subreddit)
            .getNewModmailConversations({limit:5})
            .map((modmail) => {
                const timeCheck = moment(modmail.lastUserUpdate).isBefore(timeNow) || false;
                if (modmail.messages[0].author.name.isMod || timeCheck) { 
                    return; 
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
                        .setColor("#ff4500")
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
    var last;
    return function() {
        // if (bool) {
        //     options = { limit: 10, sort: "new", before: null };
        //     setTimeout(() => {
        //         options.limit = 5;
        //     }, 3000);
        // }
        r.getNew(subreddit, options)
            .then((posts) => {
                if (!options.before) {
                    options.before = posts[0].name;
                    last = posts[0].id;
                    console.log('empty before ' + posts[0].name + ' ' + last);
                    return;
                }
                let now = moment();
                if (now.minute() % 1 === 0) {
                    console.log('GA feed ' + now.format("MMM D h:mm:ssA") + ' ' + options.before + ' ' + last);
                }
                posts.map((post, i) => {
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
                        last = post.id;
                        if (now.minute() % 5 === 0) {
                            console.log('Updating before position');
                        }
                    }
                    return post;
                })
            })
            .catch(console.error);
    }
}

var modmailFeed = getModmail();
setTimeout(modmailFeed, 15000);
setInterval(modmailFeed, 180000);

var postFeed = checkPosts();
setTimeout(postFeed, 15000);
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
    if (message.content.includes('fuck')) {
        console.log('Swearing ' + message.author.username + ' ' + moment().format("MMM D h:mm:ssA"));
        var angryMori = ['ಠ___ಠ', ':<', '\\*cough\\*'];
        var msg = angryMori[rand(6)];
        if (msg) {
            message.channel.send(msg);
        }
        return
    }
    if (!message.content.startsWith(prefix) || message.author.bot) {
        return
    }
    var role;
    var arg = message.content.slice(1).split(' ');
    var cmd = arg[0];
    if (cmd === 'ping') {
        message.channel.send('pong!');
        console.log(message.content);
    } else if (cmd === 'raid') {
        if (cooldown.has(message.author.id)) {
            message.channel.send('Hey, slow down, please.');
            console.log('cooldown ' + cmd);
            return;
        } else {
            if (!message.guild.id === "232062367951749121") {
                return
            }
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
            if (!message.guild.id === "232062367951749121") {
                return
            }
            role = '657365039979692032';
            var findRole = message.member.roles.find(r => r.id === role);
            if (findRole) {
                message.member.removeRole(role)
                    .then(message.channel.send('Role removed!'));
            } else {
                message.member.addRole(role)
                    .then(message.channel.send('Role added!'));
            }
        }
    } else if (cmd === 'giveaways') {
        if (cooldown.has(message.author.id)) {
            message.channel.send('Hey, slow down, please.');
            console.log('cooldown ' + cmd);
            return;
        }
        postFeed(true);
        cooldown.add(message.author.id);
        setTimeout(() => {
            cooldown.delete(message.author.id);
        }, 180000);
    } else if (cmd === 'time') {
        if (!arg[1]) {
            message.channel.send("Umm... what? You want to know the time where?");
        }
        const zones = {
            sydney: "Australia/Sydney",
            amsterdam: "Europe/Amsterdam",
            tokyo: "Asia/Tokyo",
            california: "America/Los_Angeles",
            portland: "America/Los_Angeles",
            chicago: "America/Chicago",
            miami: "America/New_York"
        };
        let cmdArg = message.content.slice(prefix.length + cmd.length + 1); 
        var location = zones[cmdArg.toLowerCase()];
        if (!location) {
            message.channel.send("Sorry, I only know the time in Sydney, Amsterdam, Tokyo, Portland, Chicago, and Miami off the top of my head.");
            return;
        }
        axios.get("http://worldtimeapi.org/api/timezone/" + location)
            .then((response) => {
                console.log(response.data.datetime, location);
                var timeData = moment().utcOffset(response.data.datetime);
                let msg = "My phone says it's " + timeData.format("h:mm a") + " in " + cmdArg.slice(0,1).toUpperCase() + cmdArg.slice(1) + " right now, on " + timeData.format("dddd") + " the " + timeData.format("Do") + ".";
                message.channel.send(msg);
                var RNG = rand(4);
                if (RNG < 2) {
                    var sassArray = ["You could use your own phone, you know.", "You're already on the internet, just Google it."]
                    setTimeout(() => {
                        message.channel.send(sassArray[RNG]);
                    }, 2000);
                } 
            })
            .catch(console.error);
    }
});

client.login(TOKEN);
