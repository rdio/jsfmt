var rc = require('rc');


var config = null;

var loadConfig = function() {
  // attempt to pickup on indent level from existing .jshintrc file
  var jshintSettings = rc('jshint', {
    indent: 2,
  });
  var indentValue = new Array(parseInt(jshintSettings.indent) + 1).join(' ');

  return rc('jsfmt', {
    preset: 'default',
    indent: {
      value: indentValue
    }
  });
};

exports.getConfig = function() {
  return config || (config = loadConfig());
};
