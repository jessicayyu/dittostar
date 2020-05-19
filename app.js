require('dotenv').config();

const moment = require('moment');
moment().format();

const configJSON = require('./config.json');
const { prefix, subreddit, pokeGuild, theCompany } = configJSON;

const feed = require('./feed.js');
const { client, testingChannel, mainChannel, feedChannel } = feed;

const db = require('./db.js');
const Discord = require('discord.js');
const Pokedex = require('pokedex.js');
const pokedex = new Pokedex('en');
const { getTypeWeaknesses } = require('poke-types');
const axios = require('axios');
const readline = require('readline');

const dex = require('./dex-helpers');
const watch = require('./watchers.js');
var cooldown = new Set();
var swear = {};
const mori = require('./ref/dialogue.json');
const pokeJobs = require('./ref/pokejobs.json');
let setStandby = false;

/* RNG: random number generator */
function rand(max, min = 0) {
  return min + Math.floor(Math.random() * Math.floor(max));
}

const statusFunction = function () {
  let x = 0;
  return function() {
    if (x) {
      readline.clearLine();
      readline.cursorTo(process.stdout, 0);
    }
    if (x === 0) { x++; }
    let time = moment().format("MMM D h:mm:ss A");
    process.stdout.write("Bot last check-in: " + time);
  }
}
const statusDisplay = statusFunction();
setInterval(statusDisplay, configJSON.statusRefresh * 60000);

if (configJSON.runFeedInApp) {
  const modmailFeed = feed.getModmail();
  const postFeed = feed.checkPosts();
  const commentFeed = feed.checkComments();

  setTimeout(modmailFeed, 10000);
  setInterval(modmailFeed, 180000);

  setTimeout(postFeed, 10000);
  setInterval(postFeed, 90000);

  setTimeout(commentFeed, 15000);
  setInterval(commentFeed, 120000);
}

client.on('guildMemberAdd', member => {
  if (setStandby === true) { return;  }
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
  if (message.content.startsWith(prefix + 'standby')) {
    let arg = message.content.slice(1).split(/ +/);
    if (message.author.id === configJSON.owner && arg[1] === configJSON.instance) {
      if (arg[2] === 'true' || arg[2] === 'on') {
        setStandby = true;
        message.channel.send('I\'ll take a break, then.')
      }
      if (arg[2] === 'false' || arg[2] === 'off') {
        setStandby = false;
        message.channel.send('Okay, going to work.')
      }
    }
    if (arg[1] !== configJSON.instance) {
      console.log(`I am the ${configJSON.instance} instance.`);
    } 
    if (message.author.id !== configJSON.owner) {
      message.channel.send('You\'re not my boss.');
    }
    return;
  }
  if (setStandby === true) { return; }
  if (!message || !message.guild) { 
    console.log('No message, or no message.guild', message);
    return 
  }
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
      if ((message.content.includes('discord.gg') || message.content.includes('discord.com/invite')) && !message.content.includes(configJSON.discordInvite)) {
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
    }, 5000);
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
  } else if (cmd === 'fc' || cmd === 'friendcode') {
    let userID;
    let query = 'userid';
    if (!cmdArg) {
      userID = message.author.id;
    } else if (message.mentions.users.size) {
      userID = message.mentions.users.first().id.toString();
    } else { 
      userID = cmdArg.toLowerCase();
      query = 'reddit'; 
    }
    db.Member.findOne({ [query]: userID }, function (err, data) {
      if (err) return console.error(err);
      if (!data) {
        message.channel.send(`I don't see anything registered for that person.`);
        return;
      } else if (!data.friendcode) {
        message.channel.send('Hmm, they\'re registered but have no friend code data.');
      }
      if (data.friendcode) {
        message.channel.send(data.friendcode);
      }
    })
  } else if (cmd === 'set') {
    if (!arg[1]) {
      message.channel.send('What did you want to set? `time` or `fc`?');
      return;
    }
    let textEntry = message.content.slice(prefix.length + cmd.length + arg[1].length + 2);
    if (arg[1] === 'fc' || arg[1] === 'friendcode') {
      db.writeField('friendcode', textEntry, message).catch(console.error);
      if (message.guild.id === pokeGuild) {
        watch.applyRole('Friend Code Registered', message.guild, message.member);
      }
    }
    if (arg[1] === 'reddit' || arg[1] === 'Reddit') {
      db.writeField('reddit', textEntry.toLowerCase(), message).catch(console.error);
    }
    if (arg[1] === 'time') {
      if (!arg[2]) {
        db.writeField('timezone', '', message);
        return;
      }
      axios.get("http://worldtimeapi.org/api/timezone/" + textEntry)
        .then((response) => {
          db.writeField('timezone', textEntry, message);
          watch.applyRole('Trainers', message.guild, message.member);
        })
        .catch((err) => {
          console.error('Set time error: ' + err.response.data.error);
          message.channel.send('Please pick a time zone from this list and submit it exactly as they wrote it: http://worldtimeapi.org/timezones');
        });
    }
    if (message.guild.id === pokeGuild) {
      watch.applyRole('Trainers', message.guild, message.member);
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
      feed.postFeed(true);
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
      feed.pushPost(cmdArg);
    }
    cooldown.add(message.author.id);
    setTimeout(() => {
      cooldown.delete(message.author.id);
    }, 120000);
  } else if (cmd === 'time') {
    if (!arg[1]) {
      message.channel.send("Umm... what? You want to know the time where?");
      return;
    }
    let location = mori.timeZones[cmdArg.toLowerCase()];
    if (location) { 
      watch.timezoneCheck(location, message); 
      return;
    } 
    let userID;
    let query = 'userid';
    if (message.mentions.users.size) {
      userID = message.mentions.users.first().id;
      userID = userID.toString();
    } else {
      userID = cmdArg.toLowerCase();
      query = 'reddit';
    }
    db.Member.findOne({[query]: userID}, function (err, data) {
      if (err) return console.error(err);
      if (!data) {
        message.channel.send('Sorry, nobody matches this in my database.')
      } else if (!data.timezone) {
        message.channel.send(`They haven't told me what their time zone is. Oh, and if I don't write it down, I won't remember.`);
      } else {
        location = data.timezone;
        watch.timezoneCheck(location, message);
      }
    })
  } else if (cmd === 'reddit') {
    let query, userIDorName;
    if (message.mentions.users.size) {
      userIDorName = message.mentions.users.first().id;
      userIDorName = userIDorName.toString();
      query = 'userid'
    } else {
      userIDorName = message.content.slice(prefix.length + cmd.length + 1);
      userIDorName = userIDorName.toLowerCase();
      query = 'reddit';
    }
    db.Member.findOne({ [query]: userIDorName}, function (err, data) {
      if (err) return console.error(err);
      if (!data) {
        message.channel.send('Sorry, nobody matches this in my database.');
        return;
      }
      if (!data.userid || !data.reddit) {
        message.channel.send('Well, I know the person, but they didn\'t register that info with me.')
        return;
      }
      message.channel.send(`<@${data.userid}> is /u/${data.reddit}, I think.`)
    });
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
    const commandDex = mori.commandDex;
    const commandDexDetail = mori.commandDexDetail;
    const query = arg[1];
    let commandDexKeys = '';
    let commandIntro = 'Use `!help [command]` to get more info on the command.\nYou can also use `!help [category]` or `!help all` to see only Discord commands, Reference commands, or all commands (ex: `!help reference`). \nAvailable commands are: \n';
    if (!query) {
      commandDexKeys += commandIntro;
      for (var key in commandDex) {
        commandDexKeys += `**${key} commands**:\n`
        let commandArray = Object.keys(commandDex[key]);
        commandArray = commandArray.join(', ');
        commandDexKeys += commandArray + '\n';
      }
      message.channel.send(commandDexKeys);
      return;
    }
    if (query === 'all') {
      message.channel.send(commandIntro);
      for (var key in commandDex) {
        commandDexKeys += `**${key} commands**:\n`
        for (var cmd in commandDex[key]) {
          commandDexKeys += `\`${cmd}\` ${commandDex[key][cmd]}\n`
        }
        message.channel.send(commandDexKeys);
        commandDexKeys = '';
      }
      return;
    } 
    if (commandDex[query]) {
      commandDexKeys += `**${query} commands:**\n`
      for (var cmd in commandDex[query]) {
        commandDexKeys += `\`${cmd}\` ${commandDex[query][cmd]}\n`
      }
      message.channel.send(commandDexKeys);
      return;
    } 
    if (commandDexDetail[query]) {
      message.channel.send(commandDexDetail[query]);
      return;
    }
    if (!commandDexDetail[query]) {
      for (var key in commandDex) {
        if (commandDex[key][query]) {
          message.channel.send(prefix + query + ' ' + commandDex[key][query]);
          return;
        }
      }
    } 
    message.channel.send("Sorry, I don't understand.");
  } else if (cmd === 'lenny') {
    message.channel.send('( ͡° ͜ʖ ͡°)');
  } else if (cmd === 'stare') {
    message.channel.send('ಠ\\_\\_\\_ಠ');
  } else if (cmd === 'shrug') {
    message.channel.send('¯\\_(ツ)_/¯');
  } else if (cmd === 'denko') {
    message.channel.send('(´・ω・`)');
  } else if (cmd === 'tableflip') {
    message.channel.send('(╯°□°）╯︵ ┻━┻');
  } else if (cmd === 'magic') {
    message.channel.send('(ﾉ◕ヮ◕)ﾉ:･ﾟ✧・ﾟ:・ﾟ  : :･ﾟ・ﾟ･✧:・ﾟ  ::･ﾟ:・ﾟ:・ﾟ  ･ﾟ✧:');
  } else if (cmd === 'events') {
    message.channel.send('https://www.reddit.com/r/pokemontrades/wiki/events');
  } else if (cmd === 'ballsprites') {
    const embed = new Discord.RichEmbed()
      .setImage('https://cdn.discordapp.com/attachments/402606280218378240/404499239046086666/ballsprites.PNG')
    message.channel.send(embed);
  } else if (cmd === 'viv' || cmd === 'vivillon') {
    const embed = new Discord.RichEmbed()
      .setImage('http://i.imgur.com/wiuiZZR.png')
    message.channel.send(embed);
  } else if (cmd === 'mori') {
    const embed = new Discord.RichEmbed()
      .setImage('https://i.imgur.com/qTF3UOi.jpg')
    message.channel.send(`Can we not?? Fine, the picture is over on the wall over there... I'm employee of the month but the other employee *never* shows up. We're gonna get new uniforms soon.`,embed);
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
  if (setStandby === true) { return; }
  raidEmojiAssignment(reaction, user);
});

client.on('messageReactionRemove', (reaction, user) => {
  if (setStandby === true) { return; }
  raidEmojiAssignment(reaction, user);
});


