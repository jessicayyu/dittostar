const axios = require('axios');
const dex = require('./dex-helpers');
const watch = require('./watchers.js');
const db = require('./db.js');
const mori = require('./ref/dialogue.json');
const { prefix } = require('./config.json');

// Module containing the logic for the functions supporting the bot's command lines.

const formParse = function(arg, inputText) {
  /*
  Helper function that checks for form modifiers for the dex lookup command.
  @param arg: array of message content words split by string.
  @param inputText: string, arguments given when the dex CLI was invoked.
  */
  let form;
  let suffix = '';
  inputText = arg[2].toLowerCase();
  let spaceInName = watch.checkKeywords(inputText,['mime', 'rime', 'tapu', 'type']);        
  if (spaceInName) {
    inputText = arg[arg.length-2] + " " + arg[arg.length-1];
  }
  // evaluate if there's a form name
  if ((!spaceInName && arg.length === 3) || arg.length === 4) {
    form = arg[1].toLowerCase();
    if (form.includes('galar') || form.includes('alola')) {
      suffix = form.includes('galar') ? '-g' : '-a';
      if (inputText === 'pikachu') { suffix = ''; }
    }
    if (form === 'female') { 
      suffix = '-f';
    }
    if (form.startsWith('crown')) { suffix = '-c' }
    if (inputText === 'nidoran') { 
      inputText = form === 'female'? 29 : 32;
      suffix = '';
    }
    if (inputText === 'rotom') {
      const rotom = {
        heat: '-h',
        wash: '-w',
        frost: '-f',
        fan: '-s',
        mow: '-m',
        normal: ''
      };
      suffix = rotom[form];
    }
  }
  return {
    form: form,
    formCode: suffix,
  };
};

const numDexSprite = function(cmd, arg, cmdArg, message) {
  /*
  Logic for the dex, num, sprite, shiny commands.
  @param cmd: string, command given.
  @param arg: array of message content words split by string.
  @param cmdArg: string, arguments given when the dex CLI was invoked.
  @param message: Discord message object.
  */
  let form;
  let formCode = '';
  if (arg[2] && (cmd === 'sprite' || cmd === 'shiny')) {
    ({form, formCode} = formParse(arg, cmdArg));
  }
  let pkmn, urlModifier, padNum;
  // pokedex.js reference will need to be used for both image and dex commands
  // in image commands, will be used to determine which pokedex to use because many Pokemon aren't in the Galar pokedex.
  if (form) {
    cmdArg = arg[2];
  }
  if (cmdArg === 'Nidoran') { 
    cmdArg = 'Nidoranf';
    message.channel.send('Looking up female Nidoran, Pokedex number 29. For male, please request male Nidoran, or number 32.');
  }
  pkmn = dex.queryPokedex(cmdArg);
  if (pkmn.length < 1) {
    message.channel.send('I dunno what Pokemon that is. Did you spell that right?');
    return;
  }
  padNum = pkmn[0].id;
  padNum = padNum.padStart(3, '0');
  if (cmd === 'dex' || cmd === 'num') {
    if (dex.checkGalarDex(pkmn)) {
      let pkmnName = pkmn[0].name.split(' ').join('').toLowerCase();
      let link = `https://www.serebii.net/pokedex-swsh/${pkmnName}/`;
      if (cmd === 'num') { link = `<https://www.serebii.net/pokedex-swsh/${pkmnName}/>`; }
      message.channel.send(`#${pkmn[0].id} ${pkmn[0].name}: ${link}`);
    } else {
      let link = `https://www.serebii.net/pokedex-sm/${padNum}.shtml`;
      if (cmd === 'num') { link = `<https://www.serebii.net/pokedex-sm/${padNum}.shtml>`; }
      message.channel.send(`#${pkmn[0].id} ${pkmn[0].name}: ${link}`);
    }
  } else if (cmd === 'shiny' || cmd === 'sprite') {
    if (dex.checkGalarDex(pkmn)) {
      if (cmd === 'shiny') { urlModifier = 'Shiny/SWSH'; }
      if (cmd === 'sprite') { urlModifier = 'swordshield/pokemon'; }
    } else {
      if (cmd === 'shiny') { urlModifier = 'Shiny/SM'; }
      if (cmd === 'sprite') { urlModifier = 'sunmoon/pokemon'; }
    }
    let url = `https://www.serebii.net/${urlModifier}/${padNum}${formCode}.png`;
    axios.get(url)
      .then((res) => { message.channel.send(url); })
      .catch((error) => {
        message.channel.send('Sorry, not finding anything for that.');
        console.log(error.response.status);
      });
  }
};

const timeCmd = function(commandText, message) {
  /*  Sends Discord message the local time of a specific time zone city, or of a user.
      param commandText: string, the parameters given after the command `time` is used.
      param message: the message object from Discord
  */  
    let location = mori.timeZones[commandText.toLowerCase()];
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
        userID = commandText.toLowerCase();
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
  };
  

const pingRaidRole = function(arg, message) {
  /*  !raid command - pings the @raid role with info about a raid.
      @param arg: array, of message text split by space
      @param message: the message object from Discord
  */
    let role = "657365039979692032";
    let index;
    let star = '';
    let cmd = 'raid';
    if (Number(arg[1])) {
      index = prefix.length + cmd.length + 3;
      star = arg[1] + '★ ';
    } else {
      index = prefix.length + cmd.length + 1;
    }
    let desc = message.content.slice(index);
    message.guild.roles.get(role).setMentionable(true)
      .then(() => {
        message.channel.send('<@&' + role + '> ' + star + desc)
          .then(() => {
            message.guild.roles.get(role).setMentionable(false);
          });
      });
  };

const redditCmd = function(message) {
  let query, userIDorName;
  cmd = 'reddit';
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
};

module.exports = {
  formParse: formParse,
  numDexSprite: numDexSprite,
  redditCmd: redditCmd,
  timeCmd: timeCmd,
  pingRaidRole: pingRaidRole,
};