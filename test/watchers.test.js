var assert = require('assert');
var expect = require('chai').expect;
const watch = require('../watchers.js');
const { timezoneCheck2 } = require('../watchers.js');

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
    function setResult(text) {
      expect(text).to.include('My phone says');
    }
    it('should return a time', function() {
      watch.timezoneCheck('Europe/Amsterdam', setResult);
    });
  });

  describe('timezoneCheck no location', function() {
    it('should fail because no location was passed', function() {
      function testResult(text) {
        expect(text).to.include('Sorry, I only know the time in');
      }
      watch.timezoneCheck(null, testResult);  
    });
  });
});