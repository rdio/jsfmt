/* jshint node:true */
/* global describe,it */
'use strict';
var should = require('should');
var fs = require('fs');

var libPath = process.env.JSFMT_COV ? 'lib-cov' : 'lib';
var jsfmt = require('../' + libPath + '/index');

describe('jsfmt.rewrite', function() {
  it('should test basic rewrite', function() {
    jsfmt.rewrite('_.each(a, b)', '_.each(a, b) -> a.forEach(b)')
      .toString().should.eql('a.forEach(b)');

    jsfmt.rewrite('_.each(e, f)', '_.each(a, b) -> a.forEach(b)')
      .toString().should.eql('e.forEach(f)');

    jsfmt.rewrite('_.reduce(a,b,c)', '_.reduce(a, b, c) -> a.reduce(b, c)')
      .toString().should.eql('a.reduce(b, c)');
  });

  it('should test basic rewrite with shebang', function() {
    jsfmt.rewrite('#!/usr/bin/env node\n_.each(a, b)', '_.each(a, b) -> a.forEach(b)')
      .toString().should.eql('#!/usr/bin/env node\na.forEach(b)');

    jsfmt.rewrite('#!/usr/bin/env node\n_.each(e, f)', '_.each(a, b) -> a.forEach(b)')
      .toString().should.eql('#!/usr/bin/env node\ne.forEach(f)');

    jsfmt.rewrite('#!/usr/bin/env node\n_.reduce(a,b,c)', '_.reduce(a, b, c) -> a.reduce(b, c)')
      .toString().should.eql('#!/usr/bin/env node\na.reduce(b, c)');
  });

  it('should be able to rewrite variable declaration', function() {
    jsfmt.rewrite('var myA = 1, myB = 2;', 'noop -> noop')
      .toString().should.eql('var myA = 1, myB = 2;');

    // As "Program"
    jsfmt.rewrite('var myA = 1, myB = 2;', 'var a = c, b = d; -> var a = c; var b = d;')
      .toString().should.eql('var myA = 1;\nvar myB = 2;');

    // Inside of "BlockStatement" instead of "Program"
    jsfmt.rewrite('function test() { var myA = 1, myB = 2; }', 'var a = c, b = d; -> var a = c; var b = d;')
      .toString().should.eql('function test() {\n    var myA = 1;\n    var myB = 2;\n}');
  });

  it('should be able to rewrite FunctionDeclaration', function() {
    jsfmt.rewrite('function myFunc() { return false; }', 'function a() {} -> function wrapper(a) {}')
      .toString().should.eql('function wrapper(myFunc) {\n}');
  });

  it('should be able to perform a basic rewrite inside a block', function() {
    jsfmt.rewrite('function test() { return _.map([0, 1, 2], function(val) { return val * val; }); }',
      '_.map(a, b) -> a.map(b)')
      .toString().should.eql('function test() { return [\n    0,\n    1,\n    2\n].map(function (val) {\n    return val * val;\n}); }');
  });

  it('should be able to rewrite unary expression', function() {
    jsfmt.rewrite('var test = !0;', '!0 -> true').toString().should.eql('var test = true;');
    jsfmt.rewrite('var test = !0;', '!0 -> !1').toString().should.eql('var test = !1;');
  });

  it('should rewrite AssignmentExpression', function() {
    jsfmt.rewrite('var test = 4;', 'var a = b -> a += b').toString().should.eql('test += 4;');
  });

  it('should support rewriting of es6 code', function() {
    var source = 'import "foo"; function foo(foo, bar) {}';
    var replacement = 'function foo(a, b) {} -> function foo(b, a) {}';

    var rewritten = jsfmt.rewrite(source, replacement).toString();

    rewritten.should.eql('import "foo"; function foo(bar, foo) {\n}');
  });
});
