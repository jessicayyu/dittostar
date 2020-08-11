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

describe('Role testing', function () {
  const addMock = function() {
    return new Promise(function(resolve, reject) {
      if (resolve) return true;
      if (reject) return false;
    });
  };
  const user = {};
  user.roles = { add: addMock, remove: addMock };
  user.roles.cache = [{
    name: 'tester'
  }]; 
  const guild = {};
  guild.roles = { add: addMock, remove: addMock };
  guild.roles.cache = [{
    name: 'tester'
  }, {
    name: 'dinosaur'
  }];
  it('should not toggle remove role b/c they already have it', function() {
    let result = watch.toggleRole('tester', guild, user);
    expect(result).to.equal('removed @tester');
  });
  it('should add role dinosaur', function() {
    let result = watch.toggleRole('dinosaur', guild, user);
    expect(result).to.equal('added @dinosaur');
  });
  it('should not add role b/c they already have it, action is add', function() {
    let result = watch.toggleRole('tester', guild, user, 'add');
    expect(result).to.equal(false);
  });
  it('should not remove role b/c they don\'t have it, action is remove', function() {
    let result = watch.toggleRole('pancake', guild, user, 'remove');
    expect(result).to.equal(false);
  });

  describe('rankCheck', function() {
    const memberFn = function(input) {
      return { nickname: 'Rodeo' }
    };
    const msg = {
      author: { username: 'Cowboy', discriminator: 1776 },
      cmd: 'rankCheckTest',
      guild: {
        member: memberFn
      }
    };
    msg.member = user;
    user.roles.cache.push({ name: 'Moderator' });
    it('should return true for authorized', function(){
      let result = watch.rankCheck(msg);
      expect(result).to.equal(true);
    });
    it('should return false for not authorized', function(){
      user.roles.cache.pop();
      let result = watch.rankCheck(msg);
      expect(result).to.equal(false);
    });
  })
});

describe('Time Tests', function() {
  it('should return a time', function() {
    // Count ignores the 2nd callback, which only sends flavor text.
    let count = 0;
    const setResult = function (text) {
      if (count > 0) { 
        return; 
      }
      expect(text).to.include('My phone says');
      count++;
    };
    watch.timezoneCheck('Europe/Amsterdam', setResult);
  });

  it('should fail because no location was passed', function() {
    let count = 0;
    function testResult(text) {
      if (count > 0) { 
        return; 
      }
      expect(text).to.include('Sorry, I only know the time in');
      count++;
    }
    watch.timezoneCheck(null, testResult);  
  });
});

describe('Reddit album parsing', function() {
  const mockData = require('../ref/mockdata.js');
  console.log(mockData.redditGalleryMetadata);
  it('should return an image url from album', function() {
    let result = watch.imageURLFromRedditAlbum(mockData.redditGalleryMetadata);
    expect(result).to.include('jpg');
  });
  it('should return an image url from the short album', function() {
    let result = watch.imageURLFromRedditAlbum(mockData.shortRedditGallery);
    expect(result).to.include('jpg');
  });
});