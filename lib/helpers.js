/**
 * getShebangLine
 * returns a string of the shebang line if it exists, otherwise null
 *
 * @param str
 * @return {String|Null}
 */
var getShebangLine = function(str) {
  var match = /^#!.*\n/.exec(str);
  //return first line match or null
  return match && match[0] || null;
};

/**
 * removeShebang
 * removes shebang line from string if it exists and returns it
 *
 * @param str
 * @return {String}
 */
var removeShebang = function(str) {
  var sheBang = getShebangLine(str);
  return sheBang ? str.substring(sheBang.length) : str;
};

exports.removeShebang = removeShebang;
exports.getShebangLine = getShebangLine;
