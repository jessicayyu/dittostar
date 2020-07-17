var assert = require('assert');
var expect = require('chai').expect;
const watch = require('../watchers.js');

describe('checkKeywords', function () {
  let keywordsArr = ["shiny","sparkly","legend","discord", 
    "subscribe", "channel", "mod", "paypal", "ebay", 
    "venmo", "instagram", "twitter", "youtube", "twitch", 
    "tictoc", "tiktok","moderator"];
  it('should return keywords shiny', function () {
    let result = watch.checkKeywords('Looking for a shiny Pokemon', keywordsArr);
    expect(result).to.equal('shiny');
  });
  it('should return false', function () {
    let result = watch.checkKeywords('Please provide Bulbasaur', keywordsArr);
    expect(result).to.equal(false);
  });
  it('should return false for Modest', function () {
    let result = watch.checkKeywords('Need a Modest Ditto', keywordsArr);
    expect(result).to.equal(false);
  });
  it('should return mod', function () {
    let result = watch.checkKeywords('Are mods watching', keywordsArr);
    expect(result).to.include('mod');
  });
});

describe('Time Tests', function () {
  describe('timezoneCheck', function () {
    let result = null;
    function setResult(text) {
      result = text;
      expect(result).to.include('My phone says');
    }
    it('It should return a time', function() {
      watch.timezoneCheck('Europe/Amsterdam', setResult);
    });
  });
});