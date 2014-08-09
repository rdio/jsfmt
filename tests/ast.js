/* jshint node:true */
/* global describe,it */
'use strict';
var should = require('should');
var fs = require('fs');

var libPath = process.env.JSFMT_COV ? 'lib-cov' : 'lib';
var jsfmt = require('../' + libPath + '/index');

describe('jsfmt.parseAST', function() {
  it('should test basic ast json parsing', function() {
    var ast = fs.readFileSync(__dirname + '/fixtures/parseAST_fixture.json');
    var js = jsfmt.parseAST(ast.toString());
    js.should.eql('var a = 50;\nvar b = 100;');
  });
});

describe('jsfmt.generateAST', function() {
  it('should test basic ast generation', function() {
    var js = 'var a = 50;\nvar b = 100;';
    var ast = jsfmt.generateAST(js);
    var astExpected = fs.readFileSync(__dirname + '/fixtures/generatedAST_expected.json');
    jsfmt.stringifyAST(ast).should.eql(astExpected.toString());
  });
});
