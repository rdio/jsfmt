var rc = require('rc');

var defaultStyle = require('./defaultStyle.json');

var config = null;

var loadConfig = function() {
  // attempt to pickup on indent level from existing .jshintrc file
  defaultStyle.indent = defaultStyle.indent || {};
  // rc(name, default, argv), use {} to stop argv from being loaded
  var jshintSettings = rc('jshint', {}, {});
  if (jshintSettings.indent) {
    defaultStyle.indent.value = new Array(parseInt(jshintSettings.indent) + 1).join(' ');
  }

  // rc(name, default, argv), use {} to stop argv from being loaded
  return rc('jsfmt', defaultStyle, {});
};

exports.getConfig = function() {
  return config || (config = loadConfig());
};
