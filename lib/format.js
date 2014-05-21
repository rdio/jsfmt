var jsdiff = require('diff');
var esformatter = require('esformatter');

var config = require('./config.js');
var diff = require('./diff.js');

exports.format = function(js, options) {
  options = options || config.getConfig();
  var formatted = esformatter.format(js, options);
  if (options.diff === 'raw') {
    return jsdiff.diffLines(js, formatted);
  } else if (options.diff === true || options.diff === 'formatted') {
    return diff.handleDiff(js, formatted);
  }
  return formatted;
};
