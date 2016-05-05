var rc = require('rc');
var deepExtend = require('deep-extend');
var _ = require('underscore');

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
  var config = rc('jsfmt', {}, {});

  //allow overriding the list of plugins via local config
  if (config.plugins) {
    defaultStyle.plugins = config.plugins;
  }

  // Remove any default plugins if they specified them
  if (config.disablePlugins) {
    defaultStyle.plugins = _.difference(defaultStyle.plugins, config.disablePlugins);
  }

  return deepExtend(defaultStyle, config);
};

exports.getConfig = function() {
  return config || (config = loadConfig());
};
