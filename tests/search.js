/* jshint node:true */
/* global describe,it */
'use strict';
var should = require('should');
var fs = require('fs');

var libPath = process.env.JSFMT_COV ? 'lib-cov' : 'lib';
var jsfmt = require('../' + libPath + '/index');

describe('jsfmt.search', function() {
  it('should test basic searching', function() {
    var results = jsfmt.search('var param1 = 1, done = function(){}; _.each(param1, done);', '_.each(a, b);');
    results[0].node.loc.should.eql({
      start: {
        line: 1,
        column: 37
      },
      end: {
        line: 1,
        column: 57
      }
    });
    results[0].wildcards.a.name.should.eql('param1');
    results[0].wildcards.b.name.should.eql('done');
  });

  it('should test basic searching with shebang', function() {
    var results = jsfmt.search('#!/usr/bin/env node\nvar param1 = 1, done = function(){}; _.each(param1, done);', '_.each(a, b);');
    results[0].wildcards.a.name.should.eql('param1');
    results[0].wildcards.b.name.should.eql('done');
  });

  it('should be able to match variable declaration', function() {
    var results = jsfmt.search('var myA = 1; var myB = 2;', 'var a = b; var c = d;');
    results[0].wildcards.a.name.should.eql('myA');
    results[0].wildcards.b.value.should.eql(1);
    results[0].wildcards.c.name.should.eql('myB');
    results[0].wildcards.d.value.should.eql(2);
  });

  it('should be able to perform a basic search inside a block', function() {
    var results = jsfmt.search('function test() { return _.map([0, 1, 2], function(val) { return val * val; }); }',
      '_.map(a, b)');
    results.length.should.eql(1);
  });

  it('should support wildcard rest params in CallExpression', function() {
    // Can transfer arguments
    jsfmt.rewrite('jade_mixins["my_key"](argA, argB, argC)', 'jade_mixins[a](...b) -> templates[a](...b)')
      .toString().should.eql("templates['my_key'](argA, argB, argC)");

    // Can drop argument
    jsfmt.rewrite('jade_mixins["my_key"](argA, argB, argC)', 'jade_mixins[a](b, c, ...d) -> templates[a](b, c)')
      .toString().should.eql("templates['my_key'](argA, argB)");
  });

  it('should support wildcard rest params in FunctionDeclaration (transfer)', function() {
    jsfmt.rewrite('function test(argA, argB, argC) {}', 'function test(...a) {} -> function test(...a) {}')
      .toString().should.eql("function test(argA, argB, argC) {\n}");
  });

  it('should support wildcard rest params in FunctionDeclaration (drop) ', function() {
    jsfmt.rewrite('function test(argA, argB, argC) {}', 'function test(a, b, ...c) {} -> function test(a, b) {}')
      .toString().should.eql("function test(argA, argB) {\n}");

  });

  it('should support wildcard rest params in FunctionExpression', function() {
    // Can transfer arguments
    jsfmt.rewrite('callMe(function(argA, argB, argC) {})', 'callMe(function(...a) {}) -> callMe(function(...a) {})')
      .toString().should.eql("callMe(function (argA, argB, argC) {\n})");

    // Can drop argument
    jsfmt.rewrite('callMe(function(argA, argB, argC) {})', 'callMe(function(a, b, ...c) {}) -> callMe(function(a, b) {})')
      .toString().should.eql("callMe(function (argA, argB) {\n})");
  });

  it('should be able to search for unary expression', function() {
    var resultsA = jsfmt.search('!0', '!0');
    resultsA.length.should.eql(1);

    var resultsB = jsfmt.search('var test = !0;', '!0');
    resultsB.length.should.eql(1);
  });
});
