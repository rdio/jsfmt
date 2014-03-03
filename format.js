var esprima = require('esprima');
var escodegen = require('escodegen');

function makeWhitespace(tabwidth) {
  var whitespace = '';
  for (var i = 0; i < tabwidth; i++) {
    whitespace += ' ';
  }
  return whitespace;
}

exports.formatJavascript = function(js, options) {
  var parseOptions = {
    raw: true,
    tokens: true,
    range: true,
    comment: options.comments
  };
  var ast = esprima.parse(js, parseOptions);
  ast = escodegen.attachComments(ast, ast.comments, ast.tokens);

  var formattingOptions = {
    format: {
      indent: {
        style: options.tabs ? '\t' : makeWhitespace(options.tabwidth),
        quotes: 'auto',
        adjustMultilineComment: true
      }
    },
    comment: options.comments
  };
  return escodegen.generate(ast, formattingOptions);
}
