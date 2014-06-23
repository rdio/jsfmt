var esformatter = require('esformatter');

var config = require('./config.js');

exports.format = function(js, options) {
  options = options || config.getConfig();

  var sheBang = null;
  // esformatter doesn't like shebangs
  // remove if one exists as the first line
  if (js.indexOf('#!') === 0) {
    var firstNewline = js.indexOf('\n');
    sheBang = js.substring(0, firstNewline);
    js = js.substring(firstNewline);
  }

  js = esformatter.format(js, options);

  // if we had a shebang, add back in
  if (sheBang !== null) {
    js = sheBang + js;
  }

  return js;
};

exports.formatJSON = function(json, options) {
  json = 'var data = ' + json;
  json = exports.format(json, options);
  return json.substring(json.indexOf('=') + 2);
};
