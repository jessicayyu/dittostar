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