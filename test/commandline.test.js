var assert = require('assert');
var expect = require('chai').expect;
const cli = require('../commandline.js');

describe('formParse helper commands', function () {
  describe('formParse: Galarian Meowth', function () {
    let obj = { form: 'galar', formCode: '-g' };
    let result = cli.formParse(['sprite', 'Galar', 'Meowth'], 'Galar Meowth');
    it('should return the correct obj', function() {
      assert.deepStrictEqual(result, obj);
    });
  });

  describe('formParse: female Pikachu', function () {
    let obj = { form: 'female', formCode: '-f' };
    let result = cli.formParse(['sprite', 'female', 'Pikachu'], 'female Pikachu');
    it('should return the correct obj', function() {
      assert.deepStrictEqual(result, obj);
    });
  });

  describe('formParse: Wash Rotom', function () {
    let obj = { form: 'wash', formCode: '-w' };
    let result = cli.formParse(['sprite', 'Wash', 'Rotom'], 'Wash Rotom');
    it('should return the correct obj', function() {
      assert.deepStrictEqual(result, obj);
    });
  });

  describe('formParse: maLe MeOwsTic', function () {
    let obj = { form: 'male', formCode: '' };
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
  describe('!num Gyarados', function () {
    let expected = '#130 Gyarados: <https://www.serebii.net/pokedex-swsh/gyarados/>';
    let result = cli.numDexSprite('num', ['num', 'Gyarados'], 'Gyarados', stub);
    it('should return the correct link', function() {
      assert.deepStrictEqual(result, expected);
    });
  });

  describe(`!dex Farfetch'd`, function () {
    let expected = `#83 Farfetch'd: https://www.serebii.net/pokedex-swsh/farfetch'd/`;
    let result = cli.numDexSprite('dex', ['dex', `farfetch'd`], `farfetch'd`, stub);
    it('should return the correct link', function() {
      expect(result).to.equal(expected);
    });
  });

  describe('!dex maReep', function () {
    let expected = `#179 Mareep: https://www.serebii.net/pokedex-sm/179.shtml`;
    let result = cli.numDexSprite('dex', ['dex', 'mareep'], 'mareep', stub);
    it('should return the correct link', function() {
      expect(result).to.equal(expected);
    });
  });
}); 
