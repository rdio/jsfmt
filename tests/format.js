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

  it('should test shebangs', function() {
    var js = '#!/usr/bin/env node\nvar func = function(test){console.log( test );};';
    var result = jsfmt.format(js, {});
    result.should.eql('#!/usr/bin/env node\nvar func = function(test) {\n  console.log(test);\n};');
  });

  it('should convert a list of var declarations to individual declarations', function() {
    var js = 'var a,\n  b = 2,\n  c = 3;';
    var result = jsfmt.format(js, {
      plugins: ['esformatter-var-each']
    });
    result.should.eql('var a;\nvar b = 2;\nvar c = 3;');
  });

  it('should try/catch blocks properly', function() {
    var js = 'try {\nvar foo = \'bar\';\n} catch (err) {\n// ignore\n}';
    var result = jsfmt.format(js, {});
    result.should.eql(
      'try {\n  var foo = \'bar\';\n} catch (err) {\n  // ignore\n}'
    );
  });

  it('should format es6 imports', function() {
    var js = 'import     foo          from  "foo";';
    var result = jsfmt.format(js, {});
    result.should.eql('import foo from "foo";');
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
    result.should.eql('[{\n  "hello": "world"\n}, {\n  "foo": 500.0\n}]');
  });

  it('should correctly format with trailing new line', function() {
    var json = '{"a":1,"b":"c"}\n';
    var result = jsfmt.formatJSON(json, {});
    result.should.eql('{\n  "a": 1,\n  "b": "c"\n}\n');
  });
});
