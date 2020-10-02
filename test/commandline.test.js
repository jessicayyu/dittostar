var assert = require('assert');
const { parse } = require('path');
var expect = require('chai').expect;
const cli = require('../commandline.js');

describe('formParse helper commands', function () {
  describe('formParse: Galarian Meowth', function () {
    let obj = { form: 'galar', formCode: '-g', dexInc: 0 };
    let result = cli.formParse(['sprite', 'Galar', 'Meowth'], 'Galar Meowth');
    it('should return the correct obj', function() {
      assert.deepStrictEqual(result, obj);
    });
  });

  describe('formParse: female Pikachu', function () {
    let obj = { form: 'female', formCode: '-f', dexInc: 0 };
    let result = cli.formParse(['sprite', 'female', 'Pikachu'], 'female Pikachu');
    it('should return the correct obj', function() {
      assert.deepStrictEqual(result, obj);
    });
  });

  describe('formParse: Wash Rotom', function () {
    let obj = { form: 'wash', formCode: '-w', dexInc: 0 };
    let result = cli.formParse(['sprite', 'Wash', 'Rotom'], 'Wash Rotom');
    it('should return the correct obj', function() {
      assert.deepStrictEqual(result, obj);
    });
  });

  describe('formParse: maLe MeOwsTic', function () {
    let obj = { form: 'male', formCode: '', dexInc: 0 };
    let result = cli.formParse(['sprite', 'male', 'Meowstic'], 'maLe MeOwsTic');
    it('should return the correct obj', function() {
      assert.deepStrictEqual(result, obj);
    });
  });
}); 

describe('Pokedex commands', function () {
  let stub = { 
    channel: {
      send: function(text) { console.log(text); }
    }
   };
  const parseCmd = function(input) {
    /* Formats command text for easier parsing.
      @params.arg: array, command text split by spaces;
      @params.cmd: string, command word (like !dex);
      @params.cmdArg: string, command modifiers (like "Pikachu");
      returns obj, an object with all of the above properties. 
    */
    const obj = {};
    const prefix = '!';
    obj.arg = input.slice(1).split(/ +/);
    obj.cmd = obj.arg[0];
    obj.cmdArg = input.slice(prefix.length + obj.cmd.length + 1); 
    return obj;
  }
  describe('!num Gyarados', function () {
    let expected = '#130 Gyarados: <https://www.serebii.net/pokedex-swsh/gyarados/>';
    const params = parseCmd('!num Gyarados');
    let result = cli.numDexSprite(params.cmd, params.arg, params.cmdArg, stub);
    it('should return the correct link', function() {
      assert.deepStrictEqual(result, expected);
    });
  });

  describe(`!dex Farfetch'd`, function () {
    let expected = `#83 Farfetch'd: https://www.serebii.net/pokedex-swsh/farfetch'd/`;
    const params = parseCmd(`!dex Farfetch'd`);
    let result = cli.numDexSprite(params.cmd, params.arg, params.cmdArg, stub);
    it('should return the correct link', function() {
      expect(result).to.equal(expected);
    });
  });

  describe('!dex maReep', function () {
    let expected = `#179 Mareep: https://www.serebii.net/pokedex-sm/179.shtml`;
    const params = parseCmd('!dex maReep');
    let result = cli.numDexSprite(params.cmd, params.arg, params.cmdArg, stub);
    it('should return the correct link', function() {
      expect(result).to.equal(expected);
    });
  });

  describe('!dex pikachu +1', function() {
    let expected = `#26 Raichu: https://www.serebii.net/pokedex-swsh/raichu/`;
    const params = parseCmd('!dex pikachu +1');
    let result = cli.numDexSprite(params.cmd, params.arg, params.cmdArg, stub);
    it('should return the correct link', function() {
      expect(result).to.equal(expected);
    });
  });

  describe('!num Charizard -2', function() {
    let expected = `#4 Charmander: <https://www.serebii.net/pokedex-swsh/charmander/>`;
    const params = parseCmd('!num Charizard -2');
    let result = cli.numDexSprite(params.cmd, params.arg, params.cmdArg, stub);
    it('should return the correct link', function() {
      expect(result).to.equal(expected);
    });
  });

  describe('!num bulBasaur +24', function() {
    let expected = `#25 Pikachu: <https://www.serebii.net/pokedex-swsh/pikachu/>`;
    const params = parseCmd('!num bulBasaur +24');
    let result = cli.numDexSprite(params.cmd, params.arg, params.cmdArg, stub);
    it('should return the correct link', function() {
      expect(result).to.equal(expected);
    });
  });

  describe('!sprite Bulbasaur +2', function() {
    let expected = `https://www.serebii.net/sunmoon/pokemon/003.png`;
    const params = parseCmd('!sprite Bulbasaur +2');
    let result = cli.numDexSprite(params.cmd, params.arg, params.cmdArg, stub);
    it('should return the correct link', function() {
      expect(result).to.equal(expected);
    });
  });

  describe('!sprite Galar Zigzagoon +1', function() {
    let expected = `https://www.serebii.net/swordshield/pokemon/264-g.png`;
    const params = parseCmd('!sprite Galar Zigzagoon +1');
    let result = cli.numDexSprite(params.cmd, params.arg, params.cmdArg, stub);
    it('should return the correct link', function() {
      expect(result).to.equal(expected);
    });
  });

  describe('!shiny Dartrix -1', function() {
    let expected = `https://www.serebii.net/Shiny/SM/722.png`;
    const params = parseCmd('!shiny Dartrix -1');
    let result = cli.numDexSprite(params.cmd, params.arg, params.cmdArg, stub);
    it('should return the correct link', function() {
      expect(result).to.equal(expected);
    });
  });
}); 

describe('Temperature conversions', function () {
  describe('68°F', function () {
    let result = cli.convert('ftoc', '68');
    result = parseInt(result);
    it('should return the correct temperature', function() {
      expect(result).to.equal(20);
    });
  });

  describe('-40°F', function () {
    let result = cli.convert('ftoc', '-40');
    result = parseInt(result);
    it('should return the correct temperature', function() {
      expect(result).to.equal(-40);
    });
  });

  describe('20°C', function () {
    let result = cli.convert('ctof', '20');
    result = parseInt(result);
    it('should return the correct temperature', function() {
      expect(result).to.equal(68);
    });
  });

  describe('0°C', function () {
    let result = cli.convert('ctof', '0');
    result = parseInt(result);
    it('should return the correct temperature', function() {
      expect(result).to.equal(32);
    });
  });
}); 