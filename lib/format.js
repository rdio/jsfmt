var esformatter = require('esformatter');

var config = require('./config.js');
var helpers = require('./helpers');

exports.format = function(js, options) {
  options = options || config.getConfig();

  // esformatter doesn't like shebangs
  // remove if one exists as the first line
  var sheBang = helpers.getShebangLine(js);
  if (sheBang) {
    js = js.substring(sheBang.length);
  }
  js = esformatter.format(js, options);

  // if we had a shebang, add back in
  if (sheBang) {
    js = sheBang + js;
  }

  return js;
};

exports.formatJSON = function(json, options) {
  json = 'var data = ' + json;
  json = exports.format(json, options);
  return json.substring(json.indexOf('=') + 2);
};
