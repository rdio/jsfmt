/* jshint node:true */
/* global describe,it */
'use strict';
var should = require('should');
var fs = require('fs');

var libPath = process.env.JSFMT_COV ? 'lib-cov' : 'lib';
var jsfmt = require('../' + libPath + '/index');

describe('jsfmt.format', function() {
  it('should test basic formatting', function() {
    var js = 'var func = function(test){console.log( test );};';
    var result = jsfmt.format(js, {});
    result.should.eql('var func = function(test) {\n  console.log(test);\n};');
  });
});

describe('jsfmt.formatJSON', function() {
  it('should test formatting json object', function() {
    var json = '{"hello":"world"}';
    var result = jsfmt.formatJSON(json, {});
    result.should.eql('{\n  "hello": "world"\n}');
  });

  it('should test formatting json array', function() {
    var json = '["hello","world"]';
    var result = jsfmt.formatJSON(json, {});
    result.should.eql('["hello", "world"]');
  });

  it('should test formatting json array of objects', function() {
    var json = '[{"hello":"world"},{"foo":500.0}]';
    var result = jsfmt.formatJSON(json, {});
    result.should.eql('[{\n    "hello": "world"\n  }, {\n    "foo": 500.0\n  }]');
  });
});
