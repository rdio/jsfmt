var esformatter = require('esformatter');

var config = require('./config.js');

exports.format = function(js, options) {
  options = options || config.getConfig();
  return esformatter.format(js, options);
};

exports.formatJSON = function(json, options) {
  json = 'var data = ' + json;
  json = exports.format(json, options);
  return json.substring(json.indexOf('=') + 2);
};
