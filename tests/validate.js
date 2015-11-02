/* jshint node:true */
/* global describe,it */
'use strict';
var should = require('should');
var fs = require('fs');
var utils = require('./utils');

var libPath = process.env.JSFMT_COV ? 'lib-cov' : 'lib';
var jsfmt = require('../' + libPath + '/index');

describe('jsfmt.validate', function() {
  it('should test basic validation', function() {
    var js = utils.loadFixture('illegal-return.js');
    var errors = jsfmt.validate(js);
    errors.should.have.length(1);
    errors[0].index.should.eql(6);
    errors[0].lineNumber.should.eql(1);
    errors[0].column.should.eql(7);
    errors[0].description.should.eql('Illegal return statement');
  });

  it('should test shebangs', function() {
    var js = utils.loadFixture('shebang.js');
    var errors = jsfmt.validate(js);
    errors.should.have.length(0);
  });
});

describe('jsfmt.validateJSON', function() {
  it('should test validation json object', function() {
    var js = utils.loadFixture('basic.json');
    var errors = jsfmt.validateJSON(js);
    errors.should.have.length(0);
  });

  it('should test validation json array', function() {
    var js = utils.loadFixture('array.json');
    var errors = jsfmt.validateJSON(js);
    errors.should.have.length(0);
  });
});
