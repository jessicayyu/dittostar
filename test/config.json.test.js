var assert = require('assert');
var expect = require('chai').expect;
const config = require('../config.json');

describe('Config file should be properly set up', function () {
  describe('App configs', function () {
    it('prefix', function() {
      expect(config.prefix).to.exist;
    });
    it('instance', function() {
      expect(config.instance).to.exist;
    });
    it('mongoURI', function() {
      expect(config.mongoURI).to.exist;
    })
    it('runFeedInApp', function() {
      expect(config.runFeedInApp).to.exist;
    });
    it('statusRefresh', function() {
      expect(config.statusRefresh).to.exist;
    });
  });

  describe('Discord', function () {
    it('owner', function() {
      expect(config.owner).to.exist;
    });
    it('discordInvite', function() {
      expect(config.discordInvite).to.exist;
    });
    it('pokeGuild', function() {
      expect(config.pokeGuild).to.exist;
    });
    it('theCompany', function() {
      expect(config.theCompany).to.exist;
    });
    it('tamaGuild', function() {
      expect(config.tamaGuild).to.exist;
    });
    it('toasterGuild', function() {
      expect(config.toasterGuild).to.exist;
    });
  });

  describe('Reddit', function () {
    it('ownerReddit', function() {
      expect(config.ownerReddit).to.exist;
    });
    it('subreddit', function() {
      expect(config.subreddit).to.exist;
    });
    it('altReddit', function() {
      expect(config.altReddit).to.exist;
    });
  });

  describe('PKGA Emoji Roles', function () {
    it('should be an object', function () {
      expect(config.pkgaEmojiRoles).to.be.an('object');
    });
    it('should have all keys', function() {
      expect(config.pkgaEmojiRoles).to.have.all.keys("gmax", "💝", "moonball");
    });
  });

  describe('Tama Emoji Roles', function () {
    it('should be an object', function () {
      expect(config.tamaEmojiRoles).to.be.an('object');
    });

    it('should have all keys', function() {
      expect(config.tamaEmojiRoles).to.have.all.keys("🪔", "hellokitty", "🍬", "🧚", "🧹", "tamagotchi");
    });
  });
});