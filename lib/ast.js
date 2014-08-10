var esformatter = require('esformatter');
var rocambole = require('rocambole');


var parseASTString = function(ast){
  var root = null;
  var secondToken = null;
  var secondLastToken = null;
  ast = JSON.parse(ast, function(key, value){
    if(key === ''){
      root = value;
    } else if(key === 'root' || key === 'parent'){
      return root;
    } else if(key === 'tokens' && value.length){
      // setup the first token
      value[0].prev = undefined;
      value[0].root = root;

      // setup the previous node for the loop and secondToken for startToken
      var prev = value[0];
      if(value.length > 1){
        prev.next = value[1];
        secondToken = value[1];
      } else {
        prev.next = undefined;
        secondToken = undefined;
      }

      // setup prev/next/root for all nodes
      for(var i = 1; i < value.length; ++i){
        value[i].prev = prev;
        value[i].next = value[i + 1];
        value[i].root = root;
      }

      value[value.length - 1].next = undefined;

      // get value for endToken
      if(value.length > 1){
        secondLastToken = value[value.length - 2];
      } else {
        secondLastToken = undefined;
      }
    } else if(key === 'startToken' && value !== null){
      value.next = secondToken;
      value.prev = undefined;
    } else if(key === 'endToken' && value !== null){
      value.next = undefined;
      value.prev = secondLastToken;
    }
    return value;
  });

  return ast;
};

// this toString function is just lifted from rocambole's _nodeProto.toString
// with jus the addition of the type check and json parsing
// https://github.com/millermedeiros/rocambole/blob/v0.4.0/rocambole.js#L104
module.exports.parseAST = function(ast) {
  if (typeof ast === 'string'){
    ast = parseASTString(ast);
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

var skip = ['root', 'parent', 'prev', 'next'];
module.exports.stringifyAST = function(ast) {
  return JSON.stringify(ast, function(key, value){
    return (~skip.indexOf(key))? null : value;
  });
};
