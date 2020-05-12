const Discord = require('discord.js');
const { pokeGuild } = require('./config.json');
const axios = require('axios');
const moment = require('moment');
moment().format();
const mori = require('./dialogue.json');
const dex = require('./dex-helpers');

function rand(max, min = 0) {
  return min + Math.floor(Math.random() * Math.floor(max));
}

var checkKeywords = function(input, array) {
/*  param input: usually the message content.
    param array: array of strings it will be checked against.
    output: the matching string, or bool false. If "mod" appears more than once, all matches will be included in a single string. */
  for (let i = 0; i < array.length; i++) {
    if (input.includes(array[i])) {
      if (array[i] !== "mod") { 
        return array[i]; 
      } 
      /* if mod is a match, check against regex for false positives */
      let matchers = input.match(/\bmods?\b/gi);
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
/*  param input: message object.
    param seconds: number of seconds until unmute. */
  setTimeout(() => {
    let findMute = message.member.roles.find(r => r.name === "mute");
    if (findMute) {
      message.member.removeRole(findMute);
    }
  }, seconds * 1000);
}

var toggleRole = function(role, guild, user) {
/*  Applies or removes a role from a user.
    param msgObj: message object
    param role:  string name of desired role */
  var findRole = user.roles.find(r => r.name === role);
  var result;
  if (findRole) {
    user.removeRole(findRole)
      .catch(console.error);
      result = `removed @${role}`; 
  } else {
    findRole = guild.roles.find(r => r.name === role);
    user.addRole(findRole)
      .catch(console.error)
      .then(() => {
        if (guild.id === pokeGuild) {
          /* role organizing - Trainers grouping */
          let groupRole = guild.roles.get('691796497125212230');
          user.addRole(groupRole)
            .catch(console.error)
          }
        });
    result = `added @${role}`;
  }
  return result;
};

var timezoneCheck = function (location, message) {
  /*
  param location: string, the location to be queried at the time zone api
  param message: message object
  */
  if (!location) {
    let timeExcuse = mori.timeExcuse[rand(mori.timeExcuse.length)];
    message.channel.send(`Sorry, I only know the time in Sydney, Amsterdam, Tokyo, Portland, Chicago, and Miami because ${timeExcuse}`);
  }
  axios.get("http://worldtimeapi.org/api/timezone/" + location)
    .then((response) => {
      console.log(response.data.datetime, location);
      var timeData = moment().utcOffset(response.data.datetime);
      let locationCity = location.split('/')[1].split('_').join(' ');
      let msg = "My phone says it's " + timeData.format("h:mm a") + " in " + locationCity + " right now, on " + timeData.format("dddd") + " the " + timeData.format("Do") + ".";
      message.channel.send(msg);
      let timeSassLength = mori.timeSass.length;
      var RNG = rand(timeSassLength * 5);
      if (RNG < timeSassLength) {
        setTimeout(() => {
          message.channel.send(mori.timeSass[RNG]);
        }, 2000);
      } 
    })
    .catch(error => {
      console.log(error.response);
      // error.response
      message.channel.send(`The website is down right now and my boss doesn't really let me check other websites, so... sorry! No clue.`);
    });
};

module.exports = {
  checkKeywords: checkKeywords,
  checkKeywordsRegex: checkKeywordsRegex,
  unmute: unmute,
  toggleRole: toggleRole,
  timezoneCheck: timezoneCheck,
};