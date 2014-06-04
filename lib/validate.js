var esprima = require('esprima');

module.exports.validate = function(js) {
  var syntax = esprima.parse(js, {
    tolerant: true
  });
  return syntax.errors;
};
