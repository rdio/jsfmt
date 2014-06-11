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
    results[0].wildcards.b.value.should.eql('1');
    results[0].wildcards.c.name.should.eql('myB');
    results[0].wildcards.d.value.should.eql('2');
  });
});
