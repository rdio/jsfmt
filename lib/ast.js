var circularJSON = require('circular-json');
var esformatter = require('esformatter');
var rocambole = require('rocambole');

// this toString function is just lifted from rocambole's _nodeProto.toString
// with jus the addition of the type check and json parsing
// https://github.com/millermedeiros/rocambole/blob/v0.4.0/rocambole.js#L104
module.exports.parseAST = function(ast) {
  if (typeof ast === 'string'){
    ast = circularJSON.parse(ast);
  }
  var str = '';
  var token = ast.startToken;
  if (!token) return str;
  do {
    str += ('raw' in token) ? token.raw : token.value;
    token = token.next;
  } while (token && token !== ast.endToken.next);
  return str;
};

module.exports.generateAST = function(js) {
  return rocambole.parse(js, {
    loc: true,
  });
};

module.exports.stringifyAST = function(ast) {
  return circularJSON.stringify(ast);
};
