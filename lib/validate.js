var esprima = require('esprima');

module.exports.validate = function(js) {
  var syntax = esprima.parse(js, {
    tolerant: true
  });
  return syntax.errors;
};

module.exports.validateJSON = function(json) {
  json = 'var data = ' + json;
  return module.exports.validate(json);
};
