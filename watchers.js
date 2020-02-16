let array = ["discord", "subscribe", "twitch", "mod"];

var checkKeywords = function (input, array) {
  let match = false;
  for (let i = 0; i < array.length; i++) {
    if (input.includes(array[i])) {
      return array[i];
    }
  }
}

module.exports = {
  checkKeywords: checkKeywords,
}