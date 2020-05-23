const { getTypeWeaknesses } = require('poke-types');

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

const formatTypeOutput = function(typeResults) {
  /*  param typeResults: js object
      output: formatted string */
  var typeFX = { 
    "ultra": [],
    "super": [],
    "normal": [],
    "notVery": [],
    "weak": [],
    "noEffect": []
  };
  for (var type in typeResults) {
    if (typeResults[type] === 4) {
      typeFX.ultra.push(type);
    } else if (typeResults[type] === 2) {
      typeFX.super.push(type);
    } else if (typeResults[type] === 1) {
      typeFX.normal.push(type);
    } else if (typeResults[type] === 0.5) {
      typeFX.notVery.push(type);
    } else if (typeResults[type] === 0.25) {
      typeFX.weak.push(type);
    } else if (typeResults[type] === 0) {
      typeFX.noEffect.push(type);
    }
  }
  let desc = '⚔️ ';
  if (typeFX.ultra.length > 0) { desc += '4x: [ ' + typeFX.ultra.join(', ') + ' ], '}
  if (typeFX.super.length > 0) { desc += '2x: [ ' + typeFX.super.join(', ') + ' ]\n'}
  if (typeFX.normal.length > 0) { desc += '🔹  1x: [ ' + typeFX.normal.join(', ') + ' ]\n🚫 '}
  if (typeFX.noEffect.length > 0) { desc += '0x: [ ' + typeFX.noEffect.join(', ') + ' ], '}
  if (typeFX.weak.length > 0) { desc += '0.25x: [ ' + typeFX.weak.join(', ') + ' ], '}
  if (typeFX.notVery.length > 0) { desc += '0.5x: [ ' + typeFX.notVery.join(', ') + ' ]'}
  return desc;
};

const generations = [null,"Kanto","Johto","Hoenn","Sinnoh","Unova","Kalos","Alola","Galar"
];

const checkDexForms = function(inputDexRes) {
  /*  Purpose: Debugging. Console logs all forms associated with Pokedex entry.
      param inputDexRes: array of objects
      console logs form names    */
  let getPokemonRes = [];
  if (inputDexRes.length > 1) {
    for (let i = 0; i < inputDexRes.length; i++) {
      if (inputDexRes[i].formName) {
        getPokemonRes.push(inputDexRes[i].formName);
      } else {
        getPokemonRes.push(inputDexRes[i].name);
      }
    }
    console.log(getPokemonRes)
  }
};

const multiFormTypes = function(dexResult) {
    /*  Purpose: used in a .forEach() function to format each Pokemon form object in array
        param dexResult: single object in array iteration of .forEach()
        output: formatted string of the type weaknesses of that Pokemon form object  */
  let typeChart;
  let form = dexResult.formName ? ' - ' + dexResult.formName : '';
  if (dexResult.type[1]) {
    typeChart = getTypeWeaknesses(dexResult.type[0],dexResult.type[1]);
  } else if (dexResult.type[0]) {
    typeChart = getTypeWeaknesses(dexResult.type[0]);
  } else {
    console.log('No types to enter');
  }
  let typeDescript = formatTypeOutput(typeChart);
  let typeOutputMsg = "**#" + dexResult.id + ' ' + capitalize(dexResult.name) + ' - ' + dexResult.type.join('/') + form + '**\n' + typeDescript;
  return typeOutputMsg;
};

const checkGalarDex = function(pokemonObj) {
  for (let i = 0; i < pokemonObj.length; i++) {
    if (pokemonObj[i].localId) {
      return true;
    }
  }
  return false;
};

module.exports = {
  capitalize: capitalize,
  formatTypeOutput: formatTypeOutput, 
  checkDexForms: checkDexForms,
  multiFormTypes: multiFormTypes,
  checkGalarDex: checkGalarDex
};
