var esprima = require('esprima');
var helpers = require('./helpers');

module.exports.validate = function(js) {
  // esformatter doesn't like shebangs
  // remove if one exists as the first line
  js = helpers.removeShebang(js);

  var syntax = esprima.parse(js, {
    tolerant: true
  });
  return syntax.errors;
};

module.exports.validateJSON = function(json) {
  json = 'var data = ' + json;
  return module.exports.validate(json);
};
