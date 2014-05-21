var colors = require('colors');

var jsdiff = require('diff');


function handleDiff(originalJavascript, formattedJavascript) {
  var output = '';
  var changes = jsdiff.diffLines(originalJavascript, formattedJavascript);
  changes.forEach(function(part) {
    var color = part.added ? 'green' :
      part.removed ? 'red' : 'grey';
    var prefix = part.added ? '+ ' :
      part.removed ? '- ' : '  ';
    var lines = part.value.trimRight('\n').split('\n');
    lines.forEach(function(line) {
      output += (prefix + line)[color] + '\n';
    });
  });
  return output;
}

exports.handleDiff = handleDiff;
