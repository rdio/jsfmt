var rewritePath = './rewrite.js';
var format = require('./format.js');
var validate = require('./validate.js');
var ast = require('./ast.js');

exports.rewrite = require(rewritePath).rewrite;
exports.search = require(rewritePath).search;
exports.format = format.format;
exports.formatJSON = format.formatJSON;
exports.validate = validate.validate;
exports.validateJSON = validate.validateJSON;
exports.getConfig = require('./config.js').getConfig;
exports.parseAST = ast.parseAST;
exports.generateAST = ast.generateAST;
