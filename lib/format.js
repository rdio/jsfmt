var esformatter = require('esformatter');

var config = require('./config.js');

exports.format = function(js, options) {
  options = options || config.getConfig();
  return esformatter.format(js, options);
};
