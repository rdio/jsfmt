/* jshint node:true */
/* global describe,it */
'use strict';
var should = require('should');
var fs = require('fs');
var utils = require('./utils');

var libPath = process.env.JSFMT_COV ? 'lib-cov' : 'lib';
var jsfmt = require('../' + libPath + '/index');

describe('jsfmt.format', function() {
  it('should test basic formatting', function() {
    var js = utils.loadFixture('function.js');
    var result = jsfmt.format(js, {});
    var expected = utils.loadFixture('function-expected.js');
    result.should.eql(expected);
  });

  it('should test shebangs', function() {
    var js = utils.loadFixture('shebang.js');
    var result = jsfmt.format(js, {});
    var expected = utils.loadFixture('shebang-expected.js');
    result.should.eql(expected);
  });

  it('should convert a list of var declarations to individual declarations', function() {
    var js = utils.loadFixture('var-list.js');
    var result = jsfmt.format(js, {
      plugins: ['esformatter-var-each']
    });
    var expected = utils.loadFixture('var-list-expected.js');
    result.should.eql(expected);
  });

  it('should try/catch blocks properly', function() {
    var js = utils.loadFixture('try-catch.js');
    var result = jsfmt.format(js, {});
    var expected = utils.loadFixture('try-catch-expected.js');
    result.should.eql(expected);
  });

  it('should format es6 imports', function() {
    var js = utils.loadFixture('es6-import.js');
    var result = jsfmt.format(js, {});
    var expected = utils.loadFixture('es6-import-expected.js');
    result.should.eql(expected);
  });
});

describe('jsfmt.formatJSON', function() {
  it('should test formatting json object', function() {
    var json = utils.loadFixture('basic.json');
    var result = jsfmt.formatJSON(json, {});
    var expected = utils.loadFixture('basic-expected.json');
    result.should.eql(expected);
  });

  it('should test formatting json array', function() {
    var json = utils.loadFixture('array.json');
    var result = jsfmt.formatJSON(json, {});
    var expected = utils.loadFixture('array-expected.json');
    result.should.eql(expected);
  });

  it('should test formatting json array of objects', function() {
    var json = utils.loadFixture('object-array.json');
    var result = jsfmt.formatJSON(json, {});
    var expected = utils.loadFixture('object-array-expected.json');
    result.should.eql(expected);
  });

  it('should correctly format without trailing new line', function() {
    var json = '{"a":1,"b":"c"}';
    var result = jsfmt.formatJSON(json, {});
    result.should.eql('{\n  "a": 1,\n  "b": "c"\n}');
  });
});
