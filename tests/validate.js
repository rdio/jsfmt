/* jshint node:true */
/* global describe,it */
'use strict';
var should = require('should');
var fs = require('fs');

var libPath = process.env.JSFMT_COV ? 'lib-cov' : 'lib';
var jsfmt = require('../' + libPath + '/index');

describe('jsfmt.validate', function() {
  it('should test basic validation', function() {
    var js = 'return 42;\nvar func = function(test){console.log( test );};';
    var errors = jsfmt.validate(js);
    errors.should.have.length(1);
    errors[0].index.should.eql(6);
    errors[0].lineNumber.should.eql(1);
    errors[0].column.should.eql(7);
    errors[0].description.should.eql('Illegal return statement');
  });
});

describe('jsfmt.validateJSON', function() {
  it('should test validation json object', function() {
    var js = '{"hello": "world"}';
    var errors = jsfmt.validateJSON(js);
    errors.should.have.length(0);
  });

  it('should test validation json array', function() {
    var js = '["hello", "world"]';
    var errors = jsfmt.validateJSON(js);
    errors.should.have.length(0);
  });
});
