const { getTypeWeaknesses } = require('poke-types');
const Pokedex = require('pokedex.js');
const pokedex = new Pokedex('en');
const pokeJobs = require('../ref/pokejobs.json');
const dex = require('../dex-helpers');
var expect = require('chai').expect;

describe('Capitalize', function() {
  it('should be properly capitalized', function() {
    const result = dex.capitalize('pEteR PIper');
    expect(result).to.equal('Peter Piper');
  })
});

describe('queryPokedex', function(){
  it('should return object', function() {
    let result = typeof dex.queryPokedex('25');
    expect(result).to.equal('object');
  });
  it('should return Pikachu', function() {
    let result = dex.queryPokedex('25')[0].name;
    expect(result).to.equal('Pikachu');
  });
  it('should return true', function() {
    let pkmn = dex.queryPokedex('666')[0];
    let result = dex.checkGalarDex(pkmn);
    expect(result).to.equal(false);
  });
});