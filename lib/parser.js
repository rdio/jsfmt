var falafel = require('falafel');
var esprima = require('esprima');

module.exports = {
  walk: function(js, callback) {
    return falafel(js, {
      parser: this
    }, function(node) {
      // Defining the start and end is required for compatibility with falafels 'update'
      node.start = node.range[0];
      node.end = node.range[1];
      return callback(node);
    });
  },
  parse: function(js) {
    return esprima.parse(js, {
      sourceType: 'module',
      raw: true,
      range: true,
      loc: true
    });
  }
};
