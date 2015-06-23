var escodegen = require('escodegen');
var esprima = require('esprima-fb');


module.exports.parseAST = function(ast) {
  var js = escodegen.generate(ast, {
    comment: true,
    format: {
      quotes: 'double'
    }
  });
  return js;
};

module.exports.generateAST = function(js) {
  var ast = esprima.parse(js, {
    raw: true,
    tokens: true,
    range: true,
    comment: true
  });
  ast = escodegen.attachComments(ast, ast.comments, ast.tokens);
  return ast;
};
