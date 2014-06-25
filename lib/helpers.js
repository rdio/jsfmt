/**
 * getSheBangLine
 * returns a string of the shebang line if it exists, otherwise null
 *
 * @param str
 * @return {String|Null}
 */
var getSheBangLine = function(str) {
    var match = /^#!.*\n/.exec(str);
    //return first line match or null
    return match && match[0] || null;
};

/**
 * removeSheBang
 * removes shebang line from string if it exists and returns it
 *
 * @param str
 * @return {String}
 */
var removeSheBang = function(str) {
    var sheBang = getSheBangLine(str);
    return sheBang ? str.substring(sheBang.length) : str;
};

exports.removeSheBang = removeSheBang;
exports.getSheBangLine = getSheBangLine;
