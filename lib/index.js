var rewritePath = './rewrite.js';

exports.rewrite = require(rewritePath).rewrite;
exports.search = require(rewritePath).search;
exports.format = require('./format.js').format;
exports.validate = require('./validate.js').validate;
exports.getConfig = require('./config.js').getConfig;
