/* jshint node:true */
/* global describe,it */
'use strict';
var should = require('should');
var utils = require('./utils');

var libPath = process.env.JSFMT_COV ? 'lib-cov' : 'lib';
var jsfmt = require('../' + libPath + '/index');
var stringify = require('json-stable-stringify');

describe('jsfmt.parseAST', function() {
  it('should test basic ast json parsing', function() {
    var ast = utils.loadFixture('ast.json');
    ast = JSON.parse(ast);

    var js = jsfmt.parseAST(ast);
    js.should.eql('var a = 50;\nvar b = 100;');
  });
});

describe('jsfmt.generateAST', function() {
  it('should test basic ast generation', function() {
    var js = 'var a = 50;\nvar b = 100;';
    var ast = jsfmt.generateAST(js);

    var expected = utils.loadFixture('ast.json');
    var astExpected = JSON.parse(expected);

    ast.should.eql(astExpected);
  });

  it('should parse es6 ast', function() {
    var js = 'import foo from "foo";';
    var ast = jsfmt.generateAST(js);

    var expected = utils.loadFixture('es6-ast.json');
    var astExpected = JSON.parse(expected);

    stringify(ast).should.eql(stringify(astExpected));
  });
});
