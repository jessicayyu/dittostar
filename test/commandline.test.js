var assert = require('assert');
const cli = require('../commandline.js');

describe('Pokedex commands', function () {
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
