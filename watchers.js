const Discord = require('discord.js');

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

var unmute = function (message, seconds) {
/*  param input: message object.
    param seconds: number of seconds until unmute. */
  setTimeout(() => {
    let findMute = message.member.roles.find(r => r.name === "mute");
    if (findMute) {
      message.member.removeRole(findMute);
    }
  }, seconds * 1000);
}

module.exports = {
  checkKeywords: checkKeywords,
  checkKeywordsRegex: checkKeywordsRegex,
  unmute: unmute,
};