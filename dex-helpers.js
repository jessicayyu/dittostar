const capitalize = function(inputText) {
    let temp;
    if (Array.isArray(inputText)) {
        temp = inputText;
    } else {
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
const checkDexResults = function(inputDexRes) {
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

module.exports = {
    capitalize: capitalize,
    formatTypeOutput: formatTypeOutput, 
    checkDexResults: checkDexResults
};
