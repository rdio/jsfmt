/* jshint node:true */
/* global describe,it */
'use strict';
var should = require('should');
var fs = require('fs');
var jsfmt = require('../lib/index');

describe('jsfmt', function() {
  it('should test basic rewrite', function() {
    jsfmt.rewrite('_.each(a, b)', '_.each(a, b) -> a.forEach(b)')
      .toString().should.eql('a.forEach(b)');

    jsfmt.rewrite('_.each(e, f)', '_.each(a, b) -> a.forEach(b)')
      .toString().should.eql('e.forEach(f)');

    jsfmt.rewrite('_.reduce(a,b,c)', '_.reduce(a, b, c) -> a.reduce(b, c)')
      .toString().should.eql('a.reduce(b, c)');
  });

  it('should test basic searching', function() {
    var results = jsfmt.search('var param1 = 1, done= function(){}; _.each(param1, done);', '_.each(a, b);');
    results[0].wildcards.a.name.should.eql('param1');
    results[0].wildcards.b.name.should.eql('done');
  });

  it('should be able to rewrite FunctionDeclaration', function() {
    jsfmt.rewrite('function myFunc() { return false; }', 'function a() {} -> function wrapper(a) {}')
      .toString().should.eql('function wrapper(myFunc) {\n}');
  });

  it('should test basic formatting', function() {
    var js = 'var func = function(test){console.log( test );};';
    var result = jsfmt.format(js, {});
    result.should.eql('var func = function(test) {\n  console.log(test);\n};');
  });

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
