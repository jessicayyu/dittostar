var assert = require('assert');
var expect = require('chai').expect;
const watch = require('../watchers.js');

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