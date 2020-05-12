require('dotenv').config();

const snoowrap = require('snoowrap');
const Discord = require('discord.js');
const client = new Discord.Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'] });
const { prefix, subreddit, discordInvite, pokeGuild, theCompany } = require('./config.json');
const axios = require('axios');

const TOKEN = process.env.DISCORD_TOKEN;

var testingChannel;
var mainChannel;
var feedChannel;

client.on('error', console.error);

client.on('ready', () => {
  let timeStart = new Date();
  if (timeStart.getMinutes() < 10) {
    timeStart = timeStart.getHours() + ':0' + timeStart.getMinutes();
  } else {
    timeStart = timeStart.getHours() + ':' + timeStart.getMinutes();
  }
  console.log(`Logged in as ${client.user.tag} at ${timeStart}`);
  testingChannel = getChannel('423338578597380106');
  mainChannel = getChannel('232062367951749121');
  feedChannel = getChannel('690017722821640199');
  let emojiChannel = client.channels.get('399407103959236618');
  emojiChannel.fetchMessages({around: '658214917027004436', limit: 1})
    .catch(console.error);
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
const Pokedex = require('pokedex.js');
const pokedex = new Pokedex('en');
const { getTypeWeaknesses } = require('poke-types');
const dex = require('./dex-helpers');
const watch = require('./watchers.js');
var cooldown = new Set();
var swear = {};
const mori = require('./dialogue.json');
const pokeJobs = require('./pokejobs.json');



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

/* RNG: random number generator */
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
            let matchers = watch.checkKeywords(post.selftext, ["shiny","legend","discord", "subscribe", "channel", "mod", "paypal", "ebay", "instagram", "twitter", "youtube"]);
            if (matchers) {
              let body = post.selftext.length > 150 ? post.selftext.slice(0,150) + ". . .": post.selftext;
              console.log("Post has watched keyword: " + post.url);
              console.log(i, post.selftext.slice(0, 150));
              let embedWordFound = new Discord.RichEmbed()
                .setAuthor("/u/" + post.author.name, "https://i.imgur.com/AvNa16N.png", `https://www.reddit.com/u/${post.author.name}`)
                .setTitle(post.title)
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
      .catch(console.error);
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
              let linkID = comment.link_id.split('_')[1];
              r.getSubmission(linkID).fetch()
                .then((submission) => {
                  return submission.link_flair_css_class;
                })
                .then((flair) => {
                  if (matchers.includes('mod') || postLinkClasses.indexOf(flair) < 0) {
                    let body = comment.body.length > 150 ? comment.body.slice(0,150) + ". . .": comment.body;
                    console.log("Comment match: " + matchers + " " + comment.permalink);
                    const embed = new Discord.RichEmbed()
                      .setAuthor("/u/" + comment.author.name, "https://i.imgur.com/AvNa16N.png", `https://www.reddit.com/u/${comment.author.name}`)
                      .setThumbnail("https://i.imgur.com/vXeJfVh.png")
                      .setDescription(body + "\n[" + matchers + " mentioned at " + timestamp + "](https://www.reddit.com" + comment.permalink + "?context=5)");
                    testingChannel().send(embed);
                  }
                })
                .catch(console.error);
            } 
          }
          if (i === 0) {
            last = comment.id;
          }
          return comment;
        })
      })
      .catch(console.error);
  }
}

var commentFeed = checkComments();
setTimeout(commentFeed, 15000);
setInterval(commentFeed, 120000);

var pushPost = function(ids) {
  ids.forEach(id => {
    if (id !== '' && id.match(/\w{6}/i)) {
      r.getSubmission(id).fetch()
        .then((post) => {
          let timestamp = moment.utc(post.created_utc * 1000).fromNow();
          let embed = new Discord.RichEmbed()
            .setColor(postColors[post.link_flair_css_class])
            .setTitle(post.title)
            .setURL(post.url)
            .setAuthor("/u/" + post.author.name, "https://i.imgur.com/AvNa16N.png", `https://www.reddit.com/u/${post.author.name}`)
            .setThumbnail("https://i.imgur.com/71bnPgK.png")
            .setDescription(timestamp + " at [redd.it/" + post.id + "](https://redd.it/" + post.id + ")");
          mainChannel().send(embed);
          feedChannel().send(embed);
        })
        .catch(console.error);
    } else {
      console.log(`${id} not a valid post`)
    }
  })
}

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
  let greeting = greets[rand(7)];
  channel.send(greeting);
  if (member.guild.id === pokeGuild) {
    channel.send("By the way, could you change your server nickname to your Reddit username? The option is in the top-left next to the server name.");
  }
  console.log('New user joined server!' + member);
});

const scream = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

/* Discord message responses */  
client.on('message', message => {
  if (message.type === 'GUILD_MEMBER_JOIN') {
    if (message.guild.id !== pokeGuild && message.guild.id !== '633473228739837984') {
      console.log(message.guild.name + ' ' + message.guild.id);
      return
    }
    message.delete()
      .catch(console.error);
  }
  if (message.author.id === '402601316830150656') {
    if (message.content.includes('server nickname')) {
      message.delete(90000);
    }
  }
  if (message.guild.id === pokeGuild || message.guild.id === theCompany) {
    let mute = message.guild.roles.find(r => r.name === "mute");
    /* Remove Discord invites */
    if (message.guild.id === pokeGuild) {
      if ((message.content.includes('discord.gg') || message.content.includes('discord.com/invite')) && !message.content.includes(discordInvite)) {
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
    /* curse words censor */
    const censorArray = [/fuck/i, /cunt/i];
    const censorImmediately = watch.checkKeywordsRegex(message.content, [/fucks mori/i, /fucks?.*out.*mori/i, /fucks?.*mori.*out/i]);
    const deleteImmediately = watch.checkKeywordsRegex(message.content, [/nigger/i, /chink/i]);
    if (watch.checkKeywordsRegex(message.content, censorArray) || censorImmediately || deleteImmediately) {
      const angreh = client.emojis.find(emoji => emoji.name === "ping");
      const deeplyconcerned = client.emojis.find(emoji => emoji.name === "deeplyconcerned");
      const psy = client.emojis.find(emoji => emoji.name === "psy");
      var angryMoriArray = [scream, 'ಠ___ಠ', ':<', '\\*cough\\*', angreh, deeplyconcerned, psy];
      var mildMoriArray = [scream, deeplyconcerned, psy, 
        'Um... do you want a cup of tea to calm down?', 
        'Yeah, fuck you! (Am I doing this right?)'
      ];
      mildMoriArray = mildMoriArray.concat(mori.mildMoriGifs);
      var msg;
      var int;
      var resTable;
      if (message.guild.id === pokeGuild) {
        resTable = angryMoriArray;
      }
      if (message.guild.id === theCompany) {
        resTable = mildMoriArray;
      }
      if (swear[message.author.id] === 1) {
        int = rand(resTable.length);
        if (int === 0) {
          int = rand(resTable.length);
        }
        msg = resTable[rand(int)];
      } else {
        int = rand(resTable.length * 2);
        if (int === 0) {
          int = rand(resTable.lenth * 2);
        }
      }
      msg = resTable[int];
      if (msg) {
        if (message.guild.id === theCompany && int > 4) {
          msg = new Discord.RichEmbed()
            .setImage(resTable[int]);
            message.channel.send(msg);
        } else {
          message.channel.send(`${msg}`);
        }
        if (swear[message.author.id] === 1 && message.guild.id === pokeGuild) {
          message.channel.send('\\*reaches for her hammer\\*');
        }
      }
      /* Mute if server matches */
      if ((swear[message.author.id] >= 2 && message.guild.id === pokeGuild) || censorImmediately || deleteImmediately) {
        message.member.addRole(mute)
          .catch(console.error);
        watch.unmute(message, 180);
        let muteReason;
        muteReason = 'cursing';
        if (censorImmediately) { muteReason = 'being an asshole to me, jerkass, '}
        if (deleteImmediately) { muteReason = 'using racial slurs'}
        const embed = new Discord.RichEmbed()
          .setAuthor(message.author.username + '#' + message.author.discriminator, message.author.avatarURL)
          .setDescription(`Muted for ${muteReason} in ${message.channel}`);
        if (message.guild.id === pokeGuild) {
          if (message.channel.id !== "423338578597380106") { 
            message.channel.send(embed);
          }
          embed.setDescription('Muted for ' + muteReason + ' in ' + message.channel + '\n\n> ' + message.content);
          testingChannel().send(embed);
        } else {
          message.channel.send(embed);
        }
        if (deleteImmediately) {
          message.delete();
        }
      }
      if (swear[message.author.id]) {
        swear[message.author.id] += 1;
      } else {
        swear[message.author.id] = 1;
      }
      console.log(message.author.username + ' swear ' + swear[message.author.id] + ' rand(' + int + ') ' + moment().format("h:mm:ssA") + '\n' + message.content);
      setTimeout(() => {
        delete swear[message.author.id];
      }, 300000);
    }
  }
  if (message.content === '(╯°□°)╯︵ ┻━┻' || message.content === '(╯°□°）╯︵ ┻━┻') {
    setTimeout(() => {
      message.channel.send('┬─┬ ノ( ゜-゜ノ)');
    }, 3000);
  }
  if (!message.content.startsWith(prefix) || message.author.bot) {
    return
  }
  /* Bot commands, command line */
  var role;
  var arg = message.content.slice(1).split(/ +/);
  var cmd = arg[0];
  let cmdArg = message.content.slice(prefix.length + cmd.length + 1); 
  if (cmd === 'ping') {
    message.channel.send('pong!');
  } else if (cmd === 'fc') {
    let userID;
    if (!cmdArg) {
      userID = message.author.id;
    } else if (message.mentions.users.size) {
      userID = message.mentions.users.first().id.toString();
    } else {
      message.channel.send('You gotta specify a person if you want me to check their friend code...');
      return;
    }
    db.Member.findOne({userid: userID}, function (err, data) {
      if (err) return console.error(err);
      if (data === null) {
        message.channel.send(`I don't see anything in my notes about that.`)
        return;
      };
      let friendcode = data.friendcode;
      message.channel.send(friendcode);
    })
  } else if (cmd === 'set') {
    if (arg[1] === 'fc') {
      let fcText = message.content.slice(prefix.length + 7);
      db.writeField('friendcode', fcText, message);
    }
  } else if (cmd === 'raid') {
    if (cooldown.has(message.author.id)) {
      message.channel.send('Hey, slow down, please.');
      console.log('cooldown ' + cmd);
      return;
    } else {
      if (message.guild.id !== pokeGuild) {
        return
      }
      role = "657365039979692032";
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
    /* role assignment commands */
    if (arg[1] === 'raid' || arg[1] === 'giveaways' || arg[1] === 'pokemongo') {
      if (message.guild.id !== pokeGuild) {
        return
      }
      let roleResult = watch.toggleRole(arg[1], message.guild, message.member);
      message.channel.send(`Gotcha, I've ${roleResult}.`);
    }
  } else if (cmd === 'loadga' || cmd === 'pushpost') {
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
    if (cmd === 'loadga') {
      postFeed(true);
    }
    if (cmd === 'pushpost') {
      if (cmdArg.includes('.com')) {
        cmdArg = cmdArg.match(/\/(\w{6})\//gi);
        for (let x = 0; x < cmdArg.length; x++) {
          cmdArg[x] = cmdArg[x].slice(1, cmdArg[x].length - 1);
        }
      } else {
        cmdArg = cmdArg.match(/\w{6}/gi);
      }
      pushPost(cmdArg);
    }
    cooldown.add(message.author.id);
    setTimeout(() => {
      cooldown.delete(message.author.id);
    }, 120000);
  } else if (cmd === 'time') {
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
  } else if (cmd === 'dex' || cmd === 'num' || cmd === 'sprite' || cmd === 'shiny') {
    let pkmn, urlModifier, padNum;
    if (Number(cmdArg)) { 
      pkmn = pokedex.id(Number(cmdArg)).get();
    } else {
      cmdArg = dex.capitalize(cmdArg);
      pkmn = pokedex.name(cmdArg).get();
    }
    pkmn = JSON.parse(pkmn);
    if (pkmn.length < 1) {
      message.channel.send('I dunno what Pokemon that is. Did you spell that right?');
      return;
    }
    padNum = pkmn[0].id;
    padNum = padNum.padStart(3, '0');
    if (dex.checkGalarDex(pkmn)) {
      if (cmd === 'dex' || cmd === 'num') {
        let pkmnName = pkmn[0].name.split(' ').join('').toLowerCase();
        let link = `https://www.serebii.net/pokedex-swsh/${pkmnName}/`;
        if (cmd === 'num') { link = `<https://www.serebii.net/pokedex-swsh/${pkmnName}/>`; }
        message.channel.send(`#${pkmn[0].id} ${pkmn[0].name}: ${link}`);
      } else {
        if (cmd === 'shiny') { urlModifier = 'Shiny/SWSH'; }
        if (cmd === 'sprite') { urlModifier = 'swordshield/pokemon'; }
        message.channel.send(`https://www.serebii.net/${urlModifier}/${padNum}.png`);
      }
    } else {
      if (cmd === 'dex' || cmd === 'num') {
        let link = `https://www.serebii.net/pokedex-sm/${padNum}.shtml`;
        if (cmd === 'num') { link = `<https://www.serebii.net/pokedex-sm/${padNum}.shtml>`; }
        message.channel.send(`#${pkmn[0].id} ${pkmn[0].name}: ${link}`);
      } else {
        if (cmd === 'shiny') { urlModifier = 'Shiny/SM'; }
        if (cmd === 'sprite') { urlModifier = 'sunmoon/pokemon'; }
        message.channel.send(`https://www.serebii.net/${urlModifier}/${padNum}.png`);
      }
    }
  } else if (cmd === 'type' || cmd === 'ability' || cmd === 'ha') {
    let pkdexTypeRes;
    arg.shift();
    arg = dex.capitalize(arg);
    if (cmd === 'type') {
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
    }
    if (cmd === 'ability' || cmd === 'ha') {
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
    }
  } else if (cmd === 'pkgo' || cmd === 'pkgo2') {
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
    let index = prefix.length + cmd.length + 1;
    let msg = message.content.slice(index);
    let valorChan = client.channels.get('432213973354545155');
    msg = msg.split('<br>');
    if (msg[0].length > 256) {
      message.channel.send('Sorry, your title is too long, I can\'t send that.');
      return;
    }
    if (msg.length > 3) {
      message.channel.send(`Your message has too  many <br> tags, there should be only 1 to indicate title and message. I'm noting a ${msg.length}-way split here.`);
      return;
    }
    const embed = new Discord.RichEmbed()
      .setAuthor(msg[0], 'https://i.imgur.com/ocVIblw.png')
      .setColor('#21cea1')
      .setDescription(msg[1]);
    if (msg[2] && (msg[2].endsWith('.png') || msg[2].endsWith('.jpg'))) {
      embed.setImage(msg[2]);
    }
    if (cmd !== 'pkgo2') {
      valorChan.send(embed);
    }
    let pkgoRole = '462725108998340615';
    message.guild.roles.get(pkgoRole).setMentionable(true)
      .then(() => {
        mainChannel().send('<@&462725108998340615>', embed)
          .then(() => {
            message.guild.roles.get(pkgoRole).setMentionable(false);
          });
        });
  } else if (cmd === 'pokejobs' || cmd === 'pokejob') {
    cmdArg = cmdArg.replace(/[?!]/g, '');
    cmdArg = cmdArg.toLowerCase();
    let msg = pokeJobs[cmdArg];
    if (!msg) {
      msg = '';
      let count = 0;
      let keyLowerCase;
      for (var key in pokeJobs) {
        keyLowerCase = key.toLowerCase();
        if (keyLowerCase.includes(cmdArg)) {
          if (count < 3) {
            msg += `**${key}**\n${pokeJobs[key]}\n`;
          }
          count++;
        }
      }
      if (msg === '') {
        msg = "Uhh, I dunno that PokeJobs description. Just give me the exact title, no typos please."
      }
      if (count > 3) {
        msg += `. . . **and ${count - 3} more** Pokejobs match the description you gave me. Maybe you should try a longer search term.`;
      }
    }
    message.channel.send(msg); 
  } else if (cmd === 'nature') {
    cmdArg = dex.capitalize(cmdArg);
    let statEffect = mori.natures[cmdArg];
    if (statEffect.length > 0) {
      message.channel.send(`${cmdArg}: +${mori.natures[cmdArg][0]}, -${mori.natures[cmdArg][1]}`);
    } else {
      message.channel.send('Ummm, say what?');
    }
  } else if (cmd === 'ga') {
    if (message.guild.id === pokeGuild) {
      if (cooldown.has(message.author.id)) {
        message.channel.send('Hey, slow down, please.');
        console.log('cooldown ' + cmd);
        return;
      }
      let privCheck = message.member.roles.find(r => {
        if (r.name === 'Giveaway Access' || r.name === 'Moderator' || r.name.includes('Medal')) {
          return true;
        }
      });
      if (privCheck) {
        let giveawaysChannel = client.channels.get('424061085180755968');
        role = '701688890863648789';
        message.guild.roles.get(role).setMentionable(true)
        .then(() => {
          giveawaysChannel.send('<@&' + role + '> ' + cmdArg)
            .then(() => {
              message.guild.roles.get(role).setMentionable(false);
            });
          cooldown.add(message.author.id);
          setTimeout(() => {
            cooldown.delete(message.author.id);
          }, 45000);
        });
      } else {
        message.channel.send('Hmm, this says you don\'t have permission. Maybe talk to one of my managers.')
      }
    }
  } else if (cmd === 'sym' || cmd === 'symbols') {
    const symbols = {
      star: '★',
      cross: '✚',
      heart: '\\♥',
      flower: '✿',
      music: '♫ ♪'
    };
    if (!cmdArg) {
      message.channel.send('★ ✚ \\♥ ✿ ♫ ♪');
      return;
    } 
    if (symbols[cmdArg]) {
      message.channel.send(symbols[cmdArg]);
    }
  } else if (cmd === 'help') {
    const commandDex = {
      role: "[ giveaways, raid, pokemongo ] - set your role to subscribe to notifications",
      raid: "- Pings the @raid notification group for Max Raid Battles", 
      time: "[ location name ] - Finds local time of any of the following: Amsterdam, Chicago, Miami, Portland, Sydney, Tokyo\nex: `!time Tokyo`",
      dex: "[ pokemon name ] - Get the Serebii link to that Pokemon's page",
      num: "[ pokemon name ] - `dex` command, but with link previews disabled: URL only",
      ability: "[ pokemon name ] - Get the abilities of the Pokemon species",
      ha: "[ pokemon name ] - Get the abilities of the Pokemon species",
      type: "[ pokemon name OR number OR typings ] - Get the type weaknesses for a Pokemon\nex: `!type water flying` or `!type gyarados`",
      sprite: "[ pokemon name OR number ] - Shows the Pokemon sprite",
      shiny: "[ pokemon name OR number ] - Shows the shiny Pokemon sprite",
      nature: "[ nature ] - Returns the stat effects of the nature",
      pokejobs: "[ task title ] - Responds with the desired Pokemon type, and full description of the PokeJob",
      symbols: "[symbol desired] - Prints ★ ✚ \\♥ ✿ ♫ ♪ or the desired symbol",
      sym: "[symbol desired] - Prints ★ ✚ \\♥ ✿ ♫ ♪ or the desired symbol"
    };
    if (!arg[1]) {
      let commandDexKeys = '';
      for (var key in commandDex) {
        commandDexKeys += `\`${key}\` ${commandDex[key]}\n`
      }
      message.channel.send('Available commands are \n' + commandDexKeys + '\nUse `!help [command]` to get more info on the command.');
    } else {
      if (commandDex[arg[1]]) {
        message.channel.send(arg[1] + ' ' + commandDex[arg[1]]);
      } else {
        message.channel.send("Sorry, I don't understand.");
      }
    }
  }
});

/* Raid emoji assignment */
const raidEmojiAssignment = function(reaction, user) {
  if (reaction.message.id ==='658214917027004436') {
    if (reaction.emoji.name === 'gmax') {
      let member = reaction.message.channel.guild.members.get(user.id);
      let roleResult = watch.toggleRole('raid', reaction.message.channel.guild, member);
      let botCommandsChannel = client.channels.get('423705492225916929');
      botCommandsChannel.send(`Okay <@${member.id}>, I've ${roleResult}.`);
    }
    if (reaction.emoji.name === '💝') {
      let member = reaction.message.channel.guild.members.get(user.id);
      let roleResult = watch.toggleRole('giveaways', reaction.message.channel.guild, member);
      let botCommandsChannel = client.channels.get('423705492225916929');
      botCommandsChannel.send(`Okay <@${member.id}>, I've ${roleResult}.`);
    }
  }
};

client.on('messageReactionAdd', (reaction, user) => {
  raidEmojiAssignment(reaction, user);
});

client.on('messageReactionRemove', (reaction, user) => {
  raidEmojiAssignment(reaction, user);
});

client.login(TOKEN);
