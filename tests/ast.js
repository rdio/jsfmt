/* jshint node:true */
/* global describe,it */
'use strict';
var should = require('should');

var libPath = process.env.JSFMT_COV ? 'lib-cov' : 'lib';
var jsfmt = require('../' + libPath + '/index');

describe('jsfmt.parseAST', function() {
  it('should test basic ast json parsing', function() {
    var ast = '{"type":"Program","body":[{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"a","range":[4,5]},"init":{"type":"Literal","value":50,"raw":"50","range":[8,10]},"range":[4,10]}],"kind":"var","range":[0,11]},{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"b","range":[16,17]},"init":{"type":"Literal","value":100,"raw":"100","range":[20,23]},"range":[16,23]}],"kind":"var","range":[12,24]}],"range":[0,24],"comments":[],"tokens":[{"type":"Keyword","value":"var","range":[0,3]},{"type":"Identifier","value":"a","range":[4,5]},{"type":"Punctuator","value":"=","range":[6,7]},{"type":"Numeric","value":"50","range":[8,10]},{"type":"Punctuator","value":";","range":[10,11]},{"type":"Keyword","value":"var","range":[12,15]},{"type":"Identifier","value":"b","range":[16,17]},{"type":"Punctuator","value":"=","range":[18,19]},{"type":"Numeric","value":"100","range":[20,23]},{"type":"Punctuator","value":";","range":[23,24]}]}';
    ast = JSON.parse(ast);

    var js = jsfmt.parseAST(ast);
    js.should.eql('var a = 50;\nvar b = 100;');
  });
});

describe('jsfmt.generateAST', function() {
  it('should test basic ast generation', function() {
    var js = 'var a = 50;\nvar b = 100;';
    var ast = jsfmt.generateAST(js);

    var astExpected = '{"type":"Program","body":[{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"a","range":[4,5]},"init":{"type":"Literal","value":50,"raw":"50","range":[8,10]},"range":[4,10]}],"kind":"var","range":[0,11]},{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"b","range":[16,17]},"init":{"type":"Literal","value":100,"raw":"100","range":[20,23]},"range":[16,23]}],"kind":"var","range":[12,24]}],"range":[0,24],"comments":[],"tokens":[{"type":"Keyword","value":"var","range":[0,3]},{"type":"Identifier","value":"a","range":[4,5]},{"type":"Punctuator","value":"=","range":[6,7]},{"type":"Numeric","value":"50","range":[8,10]},{"type":"Punctuator","value":";","range":[10,11]},{"type":"Keyword","value":"var","range":[12,15]},{"type":"Identifier","value":"b","range":[16,17]},{"type":"Punctuator","value":"=","range":[18,19]},{"type":"Numeric","value":"100","range":[20,23]},{"type":"Punctuator","value":";","range":[23,24]}]}';

    JSON.stringify(ast).should.eql(astExpected);
  });
});
