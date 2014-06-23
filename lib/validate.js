var esprima = require('esprima');

module.exports.validate = function(js) {
  // esformatter doesn't like shebangs
  // remove if one exists as the first line
  if (js.indexOf('#!') === 0) {
    js = js.substring(js.indexOf('\n'));
  }

  var syntax = esprima.parse(js, {
    tolerant: true
  });
  return syntax.errors;
};

module.exports.validateJSON = function(json) {
  json = 'var data = ' + json;
  return module.exports.validate(json);
};
