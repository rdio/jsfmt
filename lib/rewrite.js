var util = require('util');
var escodegen = require('escodegen');
var _ = require('underscore');
var helpers = require('./helpers');
var parser = require('./parser');

// Used to exclude circular references and functions
function deepomit(obj, keys) {
  if (util.isArray(obj)) {
    return obj.map(function(val) {
      return deepomit(val, keys);
    });
  } else if (_.isObject(obj)) {
    var filtered = _.omit.apply(_, [obj].concat(keys));
    for (var key in filtered) {
      filtered[key] = deepomit(filtered[key], keys);
    }
    return filtered;
  } else {
    return obj;
  }
}

var cloneIgnoredKeys = ['parent', 'update', 'source'];
var matchIgnoredKeys = ['type', 'prefix', 'sourceType', 'loc', 'raw', 'range'];

function clone(obj) {
  return JSON.parse(JSON.stringify(deepomit(obj, cloneIgnoredKeys)));
}

function isWildcard(node) {
  return node.type == "Identifier" && /^[a-z]$/.test(node.name);
}

function isSpreadWildcard(node) {
  return node.type == "SpreadElement" && isWildcard(node.argument);
}

// Exposes the "meat" of the node
function unwrapNode(node) {

  // If the program is only one expression/statement
  // assume we want to match the contents.
  if (node.type == 'Program' && node.body.length == 1) {
    node = unwrapNode(node.body[0]);

  // We want to match the expression, not the statement.
  } else if (node.type == 'ExpressionStatement') {
    node = unwrapNode(node.expression);
  }

  return node;
}

// Same as `unwrapNode` except that this ensures both nodes are in sync
function unwrapNodes(a, b) {

  if (a.type == 'Program' && a.body.length == 1 && b.type == 'Program' && b.body.length == 1) {
    return unwrapNodes(a.body[0], b.body[0]);

  } else if (a.type == 'ExpressionStatement' && b.type == 'ExpressionStatement') {
    return unwrapNodes(a.expression, b.expression);
  }

  return [a, b];
}

function matchPartial(wildcards, patterns, nodes) {
  // Copy nodes so we don't affect the original.
  nodes = nodes.slice();

  // Account for rest param by slicing off nodes and
  // placing them in the wildcards index
  var rest = _.last(patterns);
  if (rest && isSpreadWildcard(rest)) {
    wildcards['...' + rest.argument.name] = _.rest(nodes, patterns.length - 1);
    patterns.pop(); // Remove rest param
  }

  // Given an array of patterns, are each satisfied by
  // a unique node in the array of nodes.
  return _.all(patterns, function(pattern) {
    var index = -1;

    // Using _.any, instead of _.reject since it breaks
    // iteration on the first truthy result.
    _.any(nodes, function(node, i) {
      if (matchNode(wildcards, pattern, node)) {
        index = i;
        return true;
      } else {
        return false;
      }
    });

    if (index > -1) {
      // Remove the node so we don't consider it again and
      // fulfill a different wildcard.
      nodes.splice(index, 1);
      return true;
    } else {
      return false;
    }
  });
}

function isComparable(patternType, nodeType) {
  if (patternType == nodeType) {
    return true;
  }

  if (patternType == 'BlockStatement' && nodeType == 'Program') {
    return true;
  }

  if (patternType == 'Program' && nodeType == 'BlockStatement') {
    return true;
  }

  return false;
}

function matchNode(wildcards, pattern, node) {
  if (pattern === null && node !== null) {
    return false;
  }

  if (pattern !== null && node === null) {
    return false;
  }

  if (pattern === null && node === null) {
    return true;
  }

  if (wildcards !== null && isWildcard(pattern)) {
    if (pattern.name in wildcards) {
      return matchNode(null, wildcards[pattern.name], node);
    }
    wildcards[pattern.name] = node;
    return true;
  }

  if (!isComparable(pattern.type, node.type)) {
    return false;
  }

  var rest = _.last(pattern.params);
  if (rest && rest.type === 'RestElement') {
    pattern.params.pop();
    wildcards['...' + rest.argument.name] = node.params;
  }

  for (var key in pattern) {

    // Ignore some node properties
    if (_.contains(cloneIgnoredKeys.concat(matchIgnoredKeys), key)) {
      continue;
    }

    // Match array property
    if (_.isArray(pattern[key])) {
      if (!matchPartial(wildcards, pattern[key], node[key])) {
        return false;
      }

    // Match object property
    } else if (_.isObject(pattern[key])) {

      // Special case rest params (requires knowledge of sibling nodes)
      if (key == 'rest' && pattern.rest && node.params && isWildcard(pattern.rest)) {
        wildcards['...' + pattern.rest.name] = node.params;

      } else if (pattern[key] && node[key] && !matchNode(wildcards, pattern[key], node[key])) {
        return false;
      }

    // Match other properties (string, boolean, null, etc.)
    } else if (pattern[key] !== node[key]) {
      return false;
    }
  }

  return true;
}

function rewritePartial(wildcards, replacements) {
  return replacements.map(function(replacement) {
    return rewriteNode(wildcards, replacement);
  });
}

// `rewriteNode` replaces wildcards with matched wildcard values
function rewriteNode(wildcards, replacement, node) {
  node = node || {};

  // Handle wildcards
  if (isWildcard(replacement) && replacement.name in wildcards) {
    replacement = wildcards[replacement.name];

  } else {

    // Handle other properties
    for (var key in replacement) {
      if (_.contains(cloneIgnoredKeys.concat(matchIgnoredKeys), key)) {
        continue;
      }

      if (_.isArray(replacement[key])) {
        replacement[key] = rewritePartial(wildcards, replacement[key]);
      } else if (_.isObject(replacement[key])) {
        replacement[key] = rewriteNode(wildcards, replacement[key], node[key]);
      }
    }

    // Unpack rest param from wildcards
    if (_.contains(['FunctionExpression', 'FunctionDeclaration'], replacement.type)) {
      var rest = _.last(replacement.params);
      if (rest && rest.type === 'RestElement' && isWildcard(rest.argument)) {
        replacement.params.pop();
        replacement.params = replacement.params.concat(wildcards['...' + rest.argument.name]);
      }
    } else if (replacement.type == 'CallExpression') {
      var spread = _.last(replacement.arguments);
      if (spread && isSpreadWildcard(spread)) {
        replacement.arguments.pop();
        replacement.arguments = replacement.arguments.concat(wildcards['...' + spread.argument.name]);
      }
    }
  }

  return replacement;
}

exports.rewrite = function(js, rewriteRule) {

  var sheBang = helpers.getShebangLine(js);
  // esformatter doesn't like shebangs
  // remove if one exists as the first line
  if (sheBang) {
    js = js.substring(sheBang.length);
  }

  var rewriteRuleRe = /\s*->\s*/g;
  if (!rewriteRuleRe.test(rewriteRule)) {
    return js;
  }

  var rewriteRuleParts = rewriteRule.split(rewriteRuleRe);
  if (rewriteRuleParts.length != 2) {
    return js;
  }

  var pattern = parser.parse(rewriteRuleParts[0]);
  var replacement = parser.parse(rewriteRuleParts[1]);

  var patternReplacement = unwrapNodes(pattern, replacement);
  pattern = patternReplacement[0];
  replacement = patternReplacement[1];

  js = parser.walk(js, function(node) {
    var wildcards = {};
    if (matchNode(wildcards, pattern, node)) {
      var clonedReplacement = clone(replacement);

      // Set replacement node type to match original node type. This is to
      // account for cases when two nodes are comparable but not equal.
      if (isComparable(clonedReplacement.type, node.type)) {
        clonedReplacement.type = node.type;
      }

      var clonedNode = clone(node);
      var updatedNode = rewriteNode(wildcards, clonedReplacement, clonedNode);
      node.update(escodegen.generate(updatedNode));
    }
  });

  // if we had a shebang, add back in
  if (sheBang) {
    js = sheBang + js;
  }

  return js;
};

exports.search = function(js, searchRule) {
  // esformatter doesn't like shebangs
  // remove if one exists as the first line
  js = helpers.removeShebang(js);

  var pattern = unwrapNode(parser.parse(searchRule));

  var matches = [];
  parser.walk(js, function(node) {
    var wildcards = {};
    if (matchNode(wildcards, pattern, node)) {
      matches.push({
        node: node,
        wildcards: wildcards
      });
    }
  });
  return matches;
};
