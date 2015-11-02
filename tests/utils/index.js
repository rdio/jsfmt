/* jshint node:true */
'use strict';
var fs = require('fs');
var path = require('path');

exports.loadFixture = function(fileName) {
  var absPath = path.resolve(__dirname, '../fixtures', fileName);
  return fs.readFileSync(absPath).toString();
};
