require('dotenv').config();

const snoowrap = require('snoowrap');
const Discord = require('discord.js');
const client = new Discord.Client();
const { prefix, subreddit, discordInvite, pokeGuild, theCompany } = require('./config.json');
const axios = require('axios');

const TOKEN = process.env.DISCORD_TOKEN;

var testingChannel;
var mainChannel;
var feedChannel;
client.on('ready', () => {
  let timeStart = new Date();
  if (timeStart.getMinutes() < 10) {
    timeStart = timeStart.getHours() + ':0' + timeStart.getMinutes();
  } else {
    timeStart = timeStart.getHours() + ':' + timeStart.getMinutes();
  }
  console.log(`Logged in as ${client.user.tag} at ${timeStart}`);
  testingChannel = getChannel("423338578597380106");
  mainChannel = getChannel("232062367951749121");
  feedChannel = getChannel("690017722821640199");
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
const Pokedex = require('pokedex.js');
const pokedex = new Pokedex('en');
const { getTypeWeaknesses } = require('poke-types');
const dex = require('./dex-helpers');
const watch = require('./watchers.js');
var cooldown = new Set();
var swear = {};

function getChannel(channel) {
  var target = null;
  var getChannelCounter = 0;
  return function () {
    while (!target) { 
      target = client.channels.get(channel);
      getChannelCounter++;
      console.log('Get channel attempt ' + getChannelCounter);
    }
    return target;
  }
}

function rand(max, min = 0) {
  return min + Math.floor(Math.random() * Math.floor(max));
}

var getModmail = function() {
  var timeNow = moment();
  return function() {
    r.getSubreddit(subreddit)
      .getNewModmailConversations({limit:5})
      .map((modmail) => {
        const timeCheck = moment(modmail.lastUserUpdate).isBefore(timeNow) || false;
        if (timeCheck) {
          return;
        } 
        if (modmail.messages[0].author.name.name !== "AutoModerator" && modmail.messages[0].author.name.isMod) { 
          return; 
        } 
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
          .setURL("https://mod.reddit.com/mail/all/" + modmail.id)
          .setAuthor("/u/" + modmail.participant.name, "https://i.imgur.com/AvNa16N.png", `https://www.reddit.com/u/${modmail.participant.name}`)
          .setColor("#ff4500")
          .setDescription(body + "\n" + timestamp);
        testingChannel().send(embed);
        timeNow = moment();
      })
      .catch(console.error);
  }
};

const postColors = {
  'giveaway': '#1a9eb4', 
  'hcgiveaway': '#c894de',
  'contest': '#f479b5',
  'mod': '#fd0100',
  'ddisc':'#ff7d4d',
  'question':'#2852bc',
  'info': '#cccccc',
};

const postLinkClasses = Object.keys(postColors);

var checkPosts = function() {
  var options = { limit:5, sort: "new"};
  var last;
  return function(bool = false) {
    if (bool) {
      options = { limit: 10, sort: "new"};
      last = "0";
      setTimeout(() => {
        options.limit = 5;
      }, 3000);
    }
    r.getNew(subreddit, options)
      .then((posts) => {
        if (!last) {
          last = posts[0].name;
          return;
        }
        let now = moment();
        if (now.minute() % 2 === 0) {
          console.log(now.format("MMM D h:mm A") + ' ' + 'GA feed ' + last);
        }
        posts.filter(post => (post.name > last && post.link_flair_css_class)).map((post, i) => {
          let timestamp = moment.utc(post.created_utc * 1000).fromNow();
          if (postLinkClasses.indexOf(post.link_flair_css_class) >= 0) {
            console.log("post title: " + post.title + "\nauthor: /u/" + post.author.name + "\n" + post.permalink + "\n" + timestamp + "\n");

            let embed = new Discord.RichEmbed()
              .setColor(postColors[post.link_flair_css_class])
              .setTitle(post.title)
              .setURL(post.url)
              .setAuthor("/u/" + post.author.name, "https://i.imgur.com/AvNa16N.png", `https://www.reddit.com/u/${post.author.name}`)
              .setThumbnail("https://i.imgur.com/71bnPgK.png")
              .setDescription(timestamp + " at [redd.it/" + post.id + "](https://redd.it/" + post.id + ")");
            if (['info','question'].indexOf(post.link_flair_css_class) >= 0) {
              testingChannel().send(embed);
              if (post.link_flair_css_class === 'info') { 
                mainChannel().send(embed);
                feedChannel().send(embed);
              }
            } else {
              mainChannel().send(embed);
              feedChannel().send(embed);
            }
          }
          if (!post.distinguished && !post.stickied) {
            let matchers = watch.checkKeywords(post.selftext, ["discord", "subscribe", "channel", "mod", "paypal", "ebay", "instagram", "twitter"]);
            if (matchers) {
              let body = post.selftext.length > 150 ? post.selftext.slice(0,150) + ". . .": post.selftext;
              console.log("Post has watched keyword: " + post.url);
              console.log(i, post.selftext.slice(0, 150));
              let embedWordFound = new Discord.RichEmbed()
                .setAuthor("/u/" + post.author.name, "https://i.imgur.com/AvNa16N.png", `https://www.reddit.com/u/${post.author.name}`)
                .setThumbnail("https://i.imgur.com/vXeJfVh.png")
                .setDescription(body + "\n[" + matchers + " mentioned at " + timestamp + "](https://redd.it/" + post.id + ")");
              testingChannel().send(embedWordFound);
            }
          }
          if (i === 0) {
            last = post.name;
          }
          return post;
        })
      })
      .catch(() => {
        console.error;
      });
  }
};

var modmailFeed = getModmail();
setTimeout(modmailFeed, 10000);
setInterval(modmailFeed, 180000);

var postFeed = checkPosts();
setTimeout(postFeed, 10000);
setInterval(postFeed, 90000);

var checkComments = function() {
  var options = { limit:20, sort: "new"};
  var last;
  return function() {
    r.getNewComments(subreddit, options)
      .then((comments) => {
        if (!last) {
          last = comments[0].id;
          return;
        }
        let now = moment();
        if (now.minute() % 1 === 0) {
          console.log(now.format("MMM D h:mm A") + ' comment feed ' + last);
        }
        comments.filter(comment => comment.id > last)
        .map((comment, i) => {
          let timestamp = moment.utc(comment.created_utc * 1000).local().format("MMM D h:mm A");
          if (!comment.distinguished) {
            let matchers = watch.checkKeywords(comment.body, ["mod","shiny","legend","mythical","paypal","ebay"]);
            if (matchers) {
              let body = comment.body.length > 150 ? comment.body.slice(0,150) + ". . .": comment.body;
              console.log("Comment has watched keyword: " + matchers + " " + comment.permalink);
              const embed = new Discord.RichEmbed()
                .setAuthor("/u/" + comment.author.name, "https://i.imgur.com/AvNa16N.png", `https://www.reddit.com/u/${comment.author.name}`)
                .setThumbnail("https://i.imgur.com/vXeJfVh.png")
                .setDescription(body + "\n[" + matchers + " mentioned at " + timestamp + "](https://www.reddit.com" + comment.permalink + ")");
              testingChannel().send(embed);
            } 
          }
          if (i === 0) {
            last = comment.id;
          }
          return comment;
        })
      })
      .catch(() => {
        console.error;
      });
  }
}

var commentFeed = checkComments();
setTimeout(commentFeed, 15000);
setInterval(commentFeed, 120000);

client.on('guildMemberAdd', member => {
  let channel = member.guild.channels.find(ch => ch.name === 'chat-main');
  if (member.guild.id === '633473228739837984') {
    channel = member.guild.channels.find(ch => ch.name === 'landing');
  } 
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
  if (member.guild.id === pokeGuild) {
    channel.send("By the way, could you change your server nickname to your Reddit username? The option is in the top-left next to the server name.");
  }
  console.log('New user joined server!' + member);
});

client.on('message', message => {
  if (message.type === 'GUILD_MEMBER_JOIN') {
    console.log(message.guild.id);
    if (message.guild.id !== pokeGuild && message.guild.id !== '633473228739837984') {
      return
    }
    message.delete();
  }
  if (message.author.id === '402601316830150656') {
    if (message.content.includes('server nickname')) {
      message.delete(90000);
    }
  }
  let mute = message.guild.roles.find(r => r.name === "mute");
  /* curse words censor */
  const censorArray = [/fuck/i, /cunt/i];
  const censorImmediately = [/fucks mori/i, /fucks?.*out.*mori/i, /nigger/i, /chink/i];
  if (watch.checkKeywordsRegex(message.content, censorArray) || watch.checkKeywordsRegex(message.content, censorImmediately)) {
    const angreh = client.emojis.find(emoji => emoji.name === "ping");
    const deeplyconcerned = client.emojis.find(emoji => emoji.name === "deeplyconcerned");
    const psy = client.emojis.find(emoji => emoji.name === "psy");
    const scream = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
    var angryMori = ['ಠ___ಠ', ':<', '\\*cough\\*', angreh, deeplyconcerned, psy, scream];
    var mildMori = [deeplyconcerned, psy, scream];
    var msg = angryMori[rand(16)];
    if (msg) {
      message.channel.send(`${msg}`);
    }
    if (watch.checkKeywordsRegex(message.content, censorImmediately)) {
      if (swear[message.author.id]) {
        swear[message.author.id] += 2;
      } else {
        swear[message.author.id] = 2;
      }
    }
    /* Mute if server matches */
    if (message.guild.id === pokeGuild || message.guild.id === theCompany) {
      if (swear[message.author.id] === 1) {
        var msg = angryMori[rand(5)];
        message.channel.send('\\*reaches for her hammer\\*');
      }
      if (swear[message.author.id] >= 2) {
        message.member.addRole(mute)
          .catch(console.error);
        watch.unmute(message, 180);
        const embed = new Discord.RichEmbed()
          .setAuthor(message.author.username + '#' + message.author.discriminator, message.author.avatarURL)
          .setDescription('Muted for swearing in ' + message.channel);
        if (message.guild.id === pokeGuild) { 
          testingChannel().send(embed);
        }
        message.channel.send(embed);
      }
      if (swear[message.author.id]) {
        swear[message.author.id] += 1;
      } else {
        swear[message.author.id] = 1;
      }
      console.log(message.author.username + ' swear ' + swear[message.author.id] + ' ' + moment().format("h:mm:ssA"));
      setTimeout(() => {
        delete swear[message.author.id];
      }, 300000);
    }
    return
  }
  /* Remove Discord invites */
  if ((message.content.includes('discord.gg') || message.content.includes('discord.com/invite')) && !message.content.includes(discordInvite)) {
    if (message.guild.id === pokeGuild) {
      let modCheck = message.member.roles.find(r => r.name === 'Moderator');
      if (!modCheck) {
        const embed = new Discord.RichEmbed()
          .setAuthor(message.author.username + '#' + message.author.discriminator, message.author.avatarURL)
          .setDescription(message.content + '\n **Discord invite link** in ' + message.channel);
        testingChannel().send(embed);
        message.delete();
        message.member.addRole(mute);
        watch.unmute(message, 180);
      }
    }
  }
  if (!message.content.startsWith(prefix) || message.author.bot) {
    return
  }
  var role;
  var arg = message.content.slice(1).split(/ +/);
  var cmd = arg[0];
  if (cmd === 'ping') {
    message.channel.send('pong!');
  } else if (cmd === 'raid') {
    if (cooldown.has(message.author.id)) {
      message.channel.send('Hey, slow down, please.');
      console.log('cooldown ' + cmd);
      return;
    } else {
      if (message.guild.id !== pokeGuild) {
        return
      }
      var role = "657365039979692032";
      let index;
      let star = '';
      if (Number(arg[1])) {
        index = prefix.length + cmd.length + 3;
        star = arg[1] + '★ ';
      } else {
        index = prefix.length + cmd.length + 1;
      }
      message.guild.roles.get(role).setMentionable(true)
        .then(() => {
          message.channel.send('<@&' + role + '> ' + star + message.content.slice(index))
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
      if (message.guild.id !== pokeGuild) {
        return
      }
      role = 'raid';
      var findRole = message.member.roles.find(r => r.name === role);
      if (findRole) {
        message.member.removeRole(findRole)
          .then(message.channel.send('Role removed!'))
          .catch(console.error);
      } else {
        role = message.guild.roles.find(r => r.name === role);
        message.member.addRole(role)
          .then(message.channel.send('Role added!'))
          .catch(console.error);
      }
    }
  } else if (cmd === 'giveaways') {
    var findRole = message.member.roles.find(r => r.name === "Moderator");
    if (!findRole) {
      message.channel.send("I don't have to take orders from *you*.");
      return;
    }
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
        var RNG = rand(6);
        if (RNG < 2) {
          var sassArray = ["You could use your own phone, you know.", "You're already on the internet, just Google it."]
          setTimeout(() => {
            message.channel.send(sassArray[RNG]);
          }, 2000);
        } 
      })
      .catch(console.error);
  } else if (cmd === 'dex') {
    let cmdArg = message.content.slice(prefix.length + cmd.length + 1); 
    let pkmn;
    if (Number(cmdArg)) { 
      pkmn = pokedex.id(Number(cmdArg)).get();
    } else {
      cmdArg = dex.capitalize(cmdArg);
      pkmn = pokedex.name(cmdArg).get();
    }
    pkmn = JSON.parse(pkmn);
    if (pkmn.length < 1) {
      message.channel.send('I dunno what Pokemon that is. Sorry.');
      return;
    } else if (pkmn[0].localId) {
      pkmn = pkmn[0].name.split(' ').join('').toLowerCase();
      message.channel.send(`https://www.serebii.net/pokedex-swsh/${pkmn}/`);
    } else {
      let padNum = pkmn[0].id;
      padNum = padNum.padStart(3, '0');
      message.channel.send(`#${pkmn[0].id} ${pkmn[0].name}: https://www.serebii.net/pokedex-sm/${padNum}.shtml`);
    }
  } else if (cmd === 'type') {
    let pkdexTypeRes;
    arg.shift();
    arg = dex.capitalize(arg);
    let typesArray = ["Normal", "Fire", "Fighting", "Water", "Flying", "Grass", "Poison", "Electric", "Ground", "Psychic", "Rock", "Ice", "Bug", "Dragon", "Ghost", "Dark", "Steel", "Fairy"];
    if (Number(arg)) {
      pkdexTypeRes = pokedex.id(Number(arg)).get();
      pkdexTypeRes = JSON.parse(pkdexTypeRes);
    } else if (typesArray.indexOf(arg.split(' ')[0]) >= 0) {
      let typeDuo = arg.split(' ');
      let typeChart = getTypeWeaknesses(typeDuo[0], typeDuo[1]);
      let typeDescript = dex.formatTypeOutput(typeChart);
      message.channel.send("**" + typeDuo.join('/') + '**\n' + typeDescript);
      return;
    } else {
      pkdexTypeRes = pokedex.name(arg).get();
      pkdexTypeRes = JSON.parse(pkdexTypeRes);
    }
    if (pkdexTypeRes.length === 0) {
      message.channel.send('Sorry, I don\'t get it');
      return;
    }
    pkdexTypeRes.forEach(typeResult => {
      let typeMessage = dex.multiFormTypes(typeResult);
      message.channel.send(typeMessage);
    })
  } else if (cmd === 'ability' || cmd === 'ha') {
    let pkdexTypeRes;
    arg.shift();
    arg = dex.capitalize(arg);
    if (Number(arg)) {
      pkdexTypeRes = pokedex.id(Number(arg)).get();
    } else {
      pkdexTypeRes = pokedex.name(arg).get();
    }
    pkdexTypeRes = JSON.parse(pkdexTypeRes);
    if (pkdexTypeRes.length === 0) {
      message.channel.send('Sorry, I\'m confused...');
      return;
    } 
    pkdexTypeRes.forEach(result => {
      let abilityArr = result.ability;
      let abilityText = [];
      let form = "";
      form = result.formName ? ": " + result.formName + "\n": "\n" ;
      for (let i = 0; i < abilityArr.length; i++) {
        if (abilityArr[i].hidden === true) {
          abilityText.unshift("HA: " + abilityArr[i].name);
        } else {
          abilityText.push(i + ": " + abilityArr[i].name)
        }
      }
      message.channel.send(`**#${result.id} ${result.name}${form}**` + abilityText.join(', '));
    })
  } else if (cmd === 'help') {
    const commandDex = {
      role: "[ raid ] - set your role to @raid for raid notifications",
      raid: "Ping the @raid notification group for Max Raid Battles", 
      time: "[ location name ] - Finds local time of any of the following: Amsterdam, Chicago, Miami, Portland, Sydney, Tokyo\nex: `!time Tokyo`",
      dex: "[ pokemon name ] - Get the Serebii link to that Pokemon's page",
      ability: "[ pokemon name ] - Get the abilities of the Pokemon species",
      ha: "[ pokemon name ] - Get the abilities of the Pokemon species",
      type: "[ pokemon name OR number OR typings ] - Get the type weaknesses for a Pokemon\nex: `!type water flying` or `!type gyarados`"
    };
    if (!arg[1]) {
      message.channel.send('Available commands are `role`, `raid`, `time`, `dex`, `ability`, `ha`, and `type`! Use `!help [command]` to get more info on the command.');
    } else {
      if (commandDex[arg[1]]) {
        message.channel.send(arg[1] + ' ' + commandDex[arg[1]]);
      } else {
        message.channel.send("Sorry, I don't understand.");
      }
    }
  }
});

client.login(TOKEN);
