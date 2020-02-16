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

module.exports = {
  checkKeywords: checkKeywords,
};