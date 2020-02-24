const Discord = require('discord.js');

var checkKeywords = function(input, array) {
  for (let i = 0; i < array.length; i++) {
    if (input.includes(array[i])) {
      if (array[i] !== "mod") { 
        return array[i]; 
      } 
      let matchers = input.match(/\bmods?\b/gi);
      if (matchers) {
          return matchers.join(', ');
      }
    }
  }
  return false;
};

var unmute = function (message, seconds) {
  setTimeout(() => {
    let findMute = message.member.roles.find(r => r.name === "mute");
    if (findMute) {
      message.member.removeRole(findMute);
    }
  }, seconds * 1000);
}

module.exports = {
  checkKeywords: checkKeywords,
  unmute: unmute,
};