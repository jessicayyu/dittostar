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
  let timeStart = new Date();
  if (timeStart.getMinutes() < 10) {
    timeStart = timeStart.getHours() + ':0' + timeStart.getMinutes();
  } else {
    timeStart = timeStart.getHours() + ':' + timeStart.getMinutes();
  }
  console.log(`Logged in as ${client.user.tag} at ${timeStart}`);
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
const Pokedex = require('pokedex.js');
const pokedex = new Pokedex('en');
const { getTypeWeaknesses } = require('poke-types');
const dex = require('./dex-helpers');
var cooldown = new Set();

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
            .setURL("https://mod.reddit.com/mail/all/" + modmail.id)
            .setAuthor("/u/" + modmail.participant.name, "https://i.imgur.com/AvNa16N.png", `https://www.reddit.com/u/${modmail.participant.name}`)
            .setColor("#ff4500")
            .setDescription(body + "\n" + timestamp);
          testingChannel().send(embed);
          timeNow = moment();
        }
      })
      .catch(console.error);
  }
};

var checkPosts = function() {
  var options = { limit:5, sort: "new"};
  var last;
  return function(bool = false) {
    // if (bool) {
    //   options = { limit: 10, sort: "new", before: null };
    //   setTimeout(() => {
    //     options.limit = 5;
    //   }, 3000);
    // }
    r.getNew(subreddit, options)
      .then((posts) => {
        if (!last) {
          last = posts[0].name;
          return;
        }
        let now = moment();
        if (now.minute() % 3 === 0) {
          console.log('GA feed ' + now.format("MMM D h:mm A") + ' ' + last);
        }
        posts.filter(post => (post.name > last && post.link_flair_css_class)).map((post, i) => {
          let timestamp = moment.utc(post.created_utc * 1000).fromNow();
          if (['giveaway', 'hcgiveaway', 'contest', 'mod', 'ddisc'].indexOf(post.link_flair_css_class) >= 0) {
            console.log("post title: " + post.title + "\nauthor: /u/" + post.author.name + "\n" + post.permalink + "\n" + timestamp + "\n");
            let embed = new Discord.RichEmbed()
              .setColor("#1a9eb4")
              .setTitle(post.title)
              .setURL(post.url)
              .setAuthor("/u/" + post.author.name, "https://i.imgur.com/AvNa16N.png", `https://www.reddit.com/u/${post.author.name}`)
              .setThumbnail("https://i.imgur.com/71bnPgK.png")
              .setDescription(timestamp + " at [redd.it/" + post.id + "](https://redd.it/" + post.id + ")");
            mainChannel().send(embed);
          }
          if (!post.distinguished && !post.stickied) {
            if (post.selftext.includes("mod") || post.selftext.includes("subscribe") || post.selftext.includes("twitch") || post.selftext.includes("discord")) {
              if (post.selftext.indexOf("mod") !== post.selftext.indexOf("modest")) {
                let body = post.selftext.length > 150 ? post.selftext.slice(0,150) + ". . .": post.selftext;
                console.log("Post has watched keyword: " + post.url);
                console.log(i, post.selftext.slice(0, 150));
                let embedWordFound = new Discord.RichEmbed()
                  .setAuthor("/u/" + post.author.name, "https://i.imgur.com/AvNa16N.png", `https://www.reddit.com/u/${post.author.name}`)
                  .setThumbnail("https://i.imgur.com/vXeJfVh.png")
                  .setDescription(body + "\n[Watched keyword mentioned at " + timestamp + "](https://redd.it/" + post.id + ")");
                testingChannel().send(embedWordFound);
              }
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
setInterval(postFeed, 120000);

var checkComments = function() {
  var options = { limit:15, sort: "new"};
  var last;
  return function() {
    r.getNewComments(subreddit, options)
      .then((comments) => {
        if (!last) {
          last = comments[0].id;
          return;
        }
        let now = moment();
        if (now.minute() % 3 === 0) {
          console.log('comment feed ' + now.format("MMM D h:mm A") + ' ' + last);
        }
        comments.filter(comment => comment.id > last)
        .map((comment, i) => {
          let timestamp = moment.utc(comment.created_utc * 1000).local().format("MMM D h:mm A");
          if (!comment.distinguished && comment.body.includes("mod")) {
            if (comment.body.indexOf("mod") !== comment.body.indexOf("modest")) {
              let body = comment.body.length > 150 ? comment.body.slice(0,150) + ". . .": comment.body;
              console.log("Comment has watched keyword: " + comment.permalink);
              const embed = new Discord.RichEmbed()
                .setAuthor("/u/" + comment.author.name, "https://i.imgur.com/AvNa16N.png", `https://www.reddit.com/u/${comment.author.name}`)
                .setThumbnail("https://i.imgur.com/vXeJfVh.png")
                .setDescription(body + "\n[Mods mentioned at " + timestamp + "](https://www.reddit.com" + comment.permalink + ")");
              testingChannel().send(embed);
            } else {
              console.log("Comment: mod hit, but says modest");
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
  channel.send("By the way, could you change your server nickname to your Reddit username? The option is in the top-left next to the server name.");
  console.log('New user joined server!' + member);
});

client.on('message', message => {
  if (message.type === "GUILD_MEMBER_JOIN") {
    if (!message.guild.id === "232062367951749121") {
      return
    }
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
      if (cmdArg === "Mr. Mime") { cmdArg = "Mr. mime"}
      pkmn = pokedex.name(cmdArg).get();
    }
    pkmn = JSON.parse(pkmn);
    console.log(pkmn);
    if (!pkmn) {
      message.channel.send('I dunno what Pokemon that is. Sorry.');
      return;
    } else if (pkmn[0].localId) {
      cmdArg = cmdArg.split(' ').join('').toLowerCase();
      message.channel.send(`https://www.serebii.net/pokedex-swsh/${cmdArg}/`);
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
      if (arg === "Mr. Mime") { arg = "Mr. mime" }
      pkdexTypeRes = pokedex.name(arg).get();
      pkdexTypeRes = JSON.parse(pkdexTypeRes);
    }
    if (pkdexTypeRes === '[]') {
      message.channel.send('Sorry, I\'m confused...');
      return;
    }
    pkdexTypeRes.forEach(typeResult => {
      let typeMessage = dex.multiFormTypes(typeResult);
      message.channel.send(typeMessage);
    })
  } else if (cmd === 'help') {
    const commandDex = {
      role: "[ raid ] - set your role to @raid for raid notifications",
      raid: "Ping the @raid notification group for Max Raid Battles", 
      time: "[ location name ] - Finds local time of any of the following: Amsterdam, Chicago, Miami, Portland, Sydney, Tokyo\nex: `!time Tokyo`",
      dex: "[ pokemon name ] - Get the Serebii link to that Pokemon's page",
      type: "[ pokemon name OR number OR typings ] - Get the type weaknesses for a Pokemon\nex: `!type water flying` or `!type gyarados`"
    };
    if (!arg[1]) {
      message.channel.send('Available commands are `role`, `raid`, `time`, `dex`, and `type`! Use `!help [command]` to get more info on the command.')
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
