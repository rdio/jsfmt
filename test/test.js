/* jshint node:true */
/* global describe,it */
'use strict';
var should = require('should');
var fs = require('fs');
var jsfmt = require('../index');

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
});
