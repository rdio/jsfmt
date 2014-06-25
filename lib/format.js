var esformatter = require('esformatter');

var config = require('./config.js');

exports.format = function(js, options) {
  options = options || config.getConfig();

  var sheBang = null;
  // esformatter doesn't like shebangs
  // remove if one exists as the first line
  js = js.replace(/^#!.*\n/, function(match) {
    sheBang = match;
    return '';
  }); 
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
