const Discord = require('discord.js');
const { pokeGuild, prefix } = require('./config.json');
const axios = require('axios');
const moment = require('moment');
moment().format();
const mori = require('./ref/dialogue.json');

// Helper functions. 

const rand = function(max, min = 0) {
  return min + Math.floor(Math.random() * Math.floor(max));
};

const cooldownCheck = function(msg, cooldown) {
  /* Checks whether the message author is on cooldown. If yes, increments cooldown tick and returns the incremented number.
      @param msg: message object from Discord or message event
      @param cooldown: cooldown object to check users currently on cooldown */
  let tally = cooldown[msg.author.id];
  if (tally) {
    if (tally === 1) {
      msg.channel.send('Hey, slow down, please.');
    }
    cooldown[msg.author.id]++;
    console.log(`cooldown ${msg.author.username} ${msg.cmd}`);
    return cooldown[msg.author.id];
  }
  return false;
}

const setCooldown = function(userID, seconds, cooldown) {
  /* Adds user to cooldown object, removes after set time 
      @param user: string, user id number from Discord 
      @param seconds: Number of seconds before removing from cooldown
      @param cooldown: cooldown object to check users currently on cooldown */
  let duration = parseInt(seconds) * 1000;
  if (cooldown[userID]) {
    cooldown[userID]++;
  } else {
    cooldown[userID] = 1;
    setTimeout(() => {
      delete cooldown[userID];
    }, duration);
  }
};

const rankCheck = function(msg, roleName = "Moderator") {
  /* Checks whether or not the user has the proper authorization role
      @param msg: message object from Discord or from the message event
      @param roleName: the role required. Defaults to "Moderator" if none specified */
  let modCheck = msg.member.roles.cache.find(r => r.name === roleName);
  if (modCheck) return true;
  console.log(`${nickAndUser(msg.author, msg.guild)} attempted to use ${msg.cmd}, not authorized.`)
  return false;
};

const capitalize = function(inputText) {
  //  input can be array or string
  //  returns properly string with first letter of each word capitalized
  let temp;
  if (Array.isArray(inputText)) {
    temp = inputText;
  } else {
    if (Number(inputText)) {
      return inputText;
    }
    temp = inputText.split(' ');
  }
  temp.forEach((input, i) => {
    let caseChange = input[0].toUpperCase() + input.slice(1).toLowerCase();
    temp[i] = caseChange;
  });
  temp = temp.join(' ');
  return temp;
};

const nickAndUser = function(user, guild) {
  let usernameText = `${user.username}#${user.discriminator}`;
  let nickname = guild.member(user).nickname;
  if (nickname) {
    usernameText = nickname + ' - ' + usernameText;
  }
  return usernameText;
};

var checkKeywords = function(input, array) {
/*  param input: usually the message content.
    param array: array of strings it will be checked against.
    output: the matching string, or bool false. If "mod" appears more than once, all matches will be included in a single string. */
  let text = input.toLowerCase();  
  for (let i = 0; i < array.length; i++) {
    if (text.includes(array[i])) {
      if (array[i] !== "mod") { 
        return array[i]; 
      } 
      /* if mod is a match, check against regex for false positives */
      let matchers = text.match(/\bmods?\b/gi);
      if (matchers) {
          return matchers.join(', ');
      }
    }
  }
  return false;
};

var checkKeywordsRegex = function(input, array) {
/*  param input: message content.
    param array: array of regexp it will be checked against. Not strings.
    output: the matching string, or bool false. */
  for (let i = 0; i < array.length; i++) {
    if (input.match(array[i])) {
      return input.match(array[i]);
    }
  }
  return false;
};

var unmute = function(message, seconds) {
/*  param input: Discord message object.
    param seconds: number of seconds until unmute. */
  setTimeout(() => {
    let findMute = message.member.roles.cache.find(r => r.name === "mute");
    if (findMute) {
      message.member.roles.remove(findMute);
    }
  }, seconds * 1000);
}

var toggleRole = function(role, guild, user, action = null) {
/*  Applies or removes a role from a user.
    @param msgObj: message object
    @param role: string name of desired role 
    @param action: string indicating desired action, if restriction applies */
  var findRole = user.roles.cache.find(r => r.name === role);
  var result;
  if (findRole) {
    if (action === 'add') {
      return false;
    }
    user.roles.remove(findRole)
      .catch(console.error);
      result = `removed @${role}`; 
  } else {
    if (action === 'remove') {
      return false;
    }
    findRole = guild.roles.cache.find(r => r.name === role);
    user.roles.add(findRole)
      .catch(console.error)
      .then(() => {
        /* role organizing - Trainers grouping */
        if (guild.id === pokeGuild) {
          let groupRole = guild.roles.cache.get('691796497125212230');
          user.roles.add(groupRole)
            .catch(console.error)
          }
        });
    result = `added @${role}`;
  }
  return result;
};

var applyRole = function(role, guild, member) {
  // Assigns a role to the user.
  // param role: string input, searches by name.
  // param guild: guild object from message
  // param member: member object
  var findRole = guild.roles.cache.find(r => r.name === role);
  if (!findRole) {
    let time = moment().format("MMM D h:mm:ss A");
    console.log(`${time} - ${role} not found.`);
    return false;
  }
  member.roles.add(findRole)
    .catch(console.error);
};

var timezoneCheck = function (location, callback) {
/*  Returns the local time of the given location.
    @param location: string, the location to be queried at the time zone api
    @param callback */
  if (!location) {
    let timeExcuse = mori.timeExcuse[rand(mori.timeExcuse.length)];
    callback(`Sorry, I only know the time in Sydney, Amsterdam, Tokyo, Portland, Chicago, and Miami because ${timeExcuse}`);
    return;
  }
  axios.get("http://worldtimeapi.org/api/timezone/" + location)
    .then((response) => {
      console.log(response.data.datetime, location);
      var timeData = moment().utcOffset(response.data.datetime);
      var locationCity = location.split('/')[1].split('_').join(' ');
      locationCity = capitalize(locationCity);
      let msg = "My phone says it's " + timeData.format("h:mm a") + " in their local time right now, on " + timeData.format("dddd") + " the " + timeData.format("Do") + ". Time zone: " + locationCity + ".";
      callback(msg);
      let timeSassLength = mori.timeSass.length;
      var RNG = rand(timeSassLength * 5);
      if (RNG < timeSassLength) {
        setTimeout(() => {
          callback(mori.timeSass[RNG]);
        }, 2000);
      } 
    })
    .catch(error => {
      console.log(error.response);
      callback(`The website is down right now and my boss doesn't really let me check other websites, so... sorry! No clue.`);
    });
};

const imageURLFromRedditAlbum = function(mediaMetadata) {
  /*  retrieves the 640px size image URL from a Reddit album's metadata property
      @param mediaMetadata: object, takes the media_metadata from post listing
      returns the url as string */
  let obj;
  for (var key in mediaMetadata) {
    for (let x = 3; x >= 0; x--) {
      obj = mediaMetadata[key].p[x];
      if (obj && obj.u) { break; } 
    }
    if (obj && obj.u) { break; }
  }
  return obj.u;
};

const pickDialogue = function(array) {
  /* Returns a random line of dialogue from array 
    @param array: array with dialogue table */
  let length = array.length;
  let index = rand(length);
  return array[index];
};

module.exports = {
  rand: rand,
  cooldownCheck: cooldownCheck,
  setCooldown: setCooldown,
  rankCheck: rankCheck,
  checkKeywords: checkKeywords,
  checkKeywordsRegex: checkKeywordsRegex,
  unmute: unmute,
  toggleRole: toggleRole,
  applyRole: applyRole,
  timezoneCheck: timezoneCheck,
  nickAndUser: nickAndUser,
  imageURLFromRedditAlbum: imageURLFromRedditAlbum,
  pickDialogue: pickDialogue
};