var rewritePath = './rewrite.js';

exports.rewrite = require(rewritePath).rewrite;
exports.search = require(rewritePath).search;
exports.getConfig = require('./config.js').getConfig;
