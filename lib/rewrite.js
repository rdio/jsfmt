var util = require('util');
var esprima = require('esprima');
var falafel = require('falafel');
var escodegen = require('escodegen');
var _ = require('underscore');

// Used to exclude circular references and functions
function deepomit(obj, keys) {
  if (_.isArray(obj)) {
    return _.map(obj, function(val) {
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

function clone(obj) {
  return JSON.parse(JSON.stringify(deepomit(obj, ['parent', 'update', 'source', 'range'])));
}

function isWildcard(node) {
  return node.type == "Identifier" && /^[a-z]$/.test(node.name);
}

function isRestWildcard(node) {
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
  if (rest && isRestWildcard(rest)) {
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

function isComparable(pattern, node) {
  if (pattern.type == node.type) {
    return true;
  }

  if (pattern.type == 'BlockStatement' && node.type == 'Program') {
    return true;
  }

  if (pattern.type == 'Program' && node.type == 'BlockStatement') {
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

  if (!isComparable(pattern, node)) {
    return false;
  }

  switch (pattern.type) {
    case 'Program':
    case 'BlockStatement':
      return matchPartial(wildcards, pattern.body, node.body);
    case 'Identifier':
      return pattern.name == node.name;
    case 'Property':
      if (pattern.kind != node.kind) {
        return false;
      }
      var matchedKey = matchNode(wildcards, pattern.key, node.key);
      var matchedValue = matchNode(wildcards, pattern.value, node.value);
      return matchedKey && matchedValue;
    case 'MemberExpression':
      if (pattern.computed != node.computed) {
        return false;
      }
      var matchedObject = matchNode(wildcards, pattern.object, node.object);
      var matchedProperty = matchNode(wildcards, pattern.property, node.property);
      return matchedObject && matchedProperty;
    case 'ArrayExpression':
      return matchPartial(wildcards, pattern.elements, node.elements);
    case 'ObjectExpression':
      return matchPartial(wildcards, pattern.properties, node.properties);
    case 'BinaryExpression':
      if (pattern.operator != node.operator) {
        return false;
      }
      var matchedLeft = matchNode(wildcards, pattern.left, node.left);
      var matchedRight = matchNode(wildcards, pattern.right, node.right);
      return matchedLeft && matchedRight;
    case 'ForStatement':
      var matchedForInit = matchNode(wildcards, pattern.init, node.init);
      var matchedTest = matchNode(wildcards, pattern.test, node.test);
      var matchedUpdate = matchNode(wildcards, pattern.update, node.update);
      var matchedBody = matchNode(wildcards, pattern.body, node.body);
      return matchedForInit && matchedTest && matchedUpdate && matchedBody;
    case 'VariableDeclaration':
      if (pattern.kind != node.kind) {
        return false;
      }
      return matchPartial(wildcards, pattern.declarations, node.declarations);
    case 'FunctionExpression':
      if (pattern.id != node.id) {
        return false;
      }
      if (pattern.generator != node.generator) {
        return false;
      }
      if (pattern.expression != node.expression) {
        return false;
      }
      if (!matchPartial(wildcards, pattern.params, node.params)) {
        return false;
      }
      if (!matchPartial(wildcards, pattern.defaults, node.defaults)) {
        return false;
      }
      if (!matchNode(wildcards, pattern.body, node.body)) {
        return false;
      }

      if (pattern.rest && isWildcard(pattern.rest)) {
        wildcards['...' + pattern.rest.name] = node.params;
      } else if (!matchNode(wildcards, pattern.rest, node.rest)) {
        return false;
      }

      return true;
    case 'FunctionDeclaration':
      if (pattern.generator != node.generator) {
        return false;
      }
      if (pattern.expression != node.expression) {
        return false;
      }
      if (!matchPartial(wildcards, pattern.params, node.params)) {
        return false;
      }
      if (!matchPartial(wildcards, pattern.defaults, node.defaults)) {
        return false;
      }
      if (!matchNode(wildcards, pattern.id, node.id)) {
        return false;
      }
      if (!matchNode(wildcards, pattern.body, node.body)) {
        return false;
      }

      if (pattern.rest && isWildcard(pattern.rest)) {
        wildcards['...' + pattern.rest.name] = node.params;
      } else if (!matchNode(wildcards, pattern.rest, node.rest)) {
        return false;
      }

      return true;
    case 'UpdateExpression':
      if (pattern.operator != node.operator) {
        return false;
      }
      if (pattern.prefix != node.prefix) {
        return false;
      }
      return matchNode(wildcards, pattern.argument, node.argument);
    case 'VariableDeclarator':
      var matchedId = matchNode(wildcards, pattern.id, node.id);
      var matchedVarInit = matchNode(wildcards, pattern.init, node.init);
      return matchedId && matchedVarInit;
    case 'Literal':
      return pattern.raw == node.raw;
    case 'ExpressionStatement':
      return matchNode(wildcards, pattern.expression, node.expression);
    case 'CallExpression':
      if (!matchNode(wildcards, pattern.callee, node.callee)) {
        return false;
      }
      return matchPartial(wildcards, pattern.arguments, node.arguments);
    case 'ReturnStatement':
      return matchNode(wildcards, pattern.argument, node.argument);
    default:
      console.error(pattern.type, "not yet supported in matchNode", pattern);
      return false;
  }

  return false;
}

function rewritePartial(wildcards, replacements) {
  return _.map(replacements, function(replacement) {
    return rewriteNode(wildcards, replacement);
  });
}

// `rewriteNode` replaces wildcards with matched wildcard values
function rewriteNode(wildcards, replacement, node) {
  node = node || {};

  switch (replacement.type) {
    case 'Identifier':
      if (isWildcard(replacement)) {
        if (replacement.name in wildcards) {
          replacement = wildcards[replacement.name];
        }
      }
      break;
    case 'Program':
    case 'BlockStatement':
      replacement.body = rewritePartial(wildcards, replacement.body);
      break;
    case 'ArrayExpression':
      replacement.elements = rewritePartial(wildcards, replacement.elements);
      break;
    case 'MemberExpression':
      replacement.object = rewriteNode(wildcards, replacement.object, node.object);
      replacement.property = rewriteNode(wildcards, replacement.property, node.property);
      break;
    case 'CallExpression':
      replacement.callee = rewriteNode(wildcards, replacement.callee, node.callee);
      replacement.arguments = rewritePartial(wildcards, replacement.arguments);

      // Unpack rest param from wildcards
      var rest = _.last(replacement.arguments);
      if (rest && isRestWildcard(rest)) {
        replacement.arguments.pop();
        replacement.arguments = replacement.arguments.concat(wildcards['...' + rest.argument.name]);
      }
      break;
    case 'FunctionExpression':
      replacement.body = rewriteNode(wildcards, replacement.body, node.body);
      replacement.params = rewritePartial(wildcards, replacement.params);
      replacement.defaults = rewritePartial(wildcards, replacement.defaults);

      // Unpack rest param from wildcards
      if (replacement.rest && isWildcard(replacement.rest)) {
        replacement.params = replacement.params.concat(wildcards['...' + replacement.rest.name]);
      }
      break;
    case 'FunctionDeclaration':
      replacement.id = rewriteNode(wildcards, replacement.id, node.id);
      replacement.body = rewriteNode(wildcards, replacement.body, node.body);
      replacement.params = rewritePartial(wildcards, replacement.params);
      replacement.defaults = rewritePartial(wildcards, replacement.defaults);

      // Unpack rest param from wildcards
      if (replacement.rest && isWildcard(replacement.rest)) {
        replacement.params = replacement.params.concat(wildcards['...' + replacement.rest.name]);
      }
      break;
    case 'Property':
      replacement.key = rewriteNode(wildcards, replacement.key, node.key);
      replacement.value = rewriteNode(wildcards, replacement.value, node.value);
      replacement.kind = rewriteNode(wildcards, replacement.kind, node.kind);
      break;
    case 'BinaryExpression':
      replacement.left = rewriteNode(wildcards, replacement.left, node.left);
      replacement.right = rewriteNode(wildcards, replacement.right, node.right);
      break;
    case 'VariableDeclaration':
      replacement.declarations = rewritePartial(wildcards, replacement.declarations);
      break;
    case 'VariableDeclarator':
      replacement.id = rewriteNode(wildcards, replacement.id, node.id);
      replacement.init = rewriteNode(wildcards, replacement.init, node.init);
      break;
    case 'ReturnStatement':
      replacement.argument = rewriteNode(wildcards, replacement.argument, node.argument);
      break;
    case 'ExpressionStatement':
      replacement.expression = rewriteNode(wildcards, replacement.expression, node.expression);
      break;
    case 'SpreadElement':
      replacement.argument = rewriteNode(wildcards, replacement.argument, node.expression);
      break;
    case 'UpdateExpression':
      replacement.argument = rewriteNode(wildcards, replacement.argument, node.argument);
      break;
    case 'ForStatement':
      replacement.init = rewriteNode(wildcards, replacement.init, node.init);
      replacement.test = rewriteNode(wildcards, replacement.test, node.test);
      replacement.update = rewriteNode(wildcards, replacement.update, node.update);
      replacement.body = rewriteNode(wildcards, replacement.body, node.body);
      break;
    case 'ObjectExpression':
      replacement.properties = rewritePartial(wildcards, replacement.properties);
      break;
    case 'Literal':
      break; // no-op
    default:
      console.error(replacement.type, "not yet supported in replace", replacement);
      break;
  }

  return replacement;
}

exports.rewrite = function(js, rewriteRule) {
  var rewriteRuleRe = /\s*->\s*/g;
  if (!rewriteRuleRe.test(rewriteRule)) {
    return js;
  }

  var rewriteRuleParts = rewriteRule.split(rewriteRuleRe);
  if (rewriteRuleParts.length != 2) {
    return js;
  }

  var parseOptions = { raw: true };
  var pattern = esprima.parse(rewriteRuleParts[0], parseOptions);
  var replacement = esprima.parse(rewriteRuleParts[1], parseOptions);

  var patternReplacement = unwrapNodes(pattern, replacement);
  pattern = patternReplacement[0];
  replacement = patternReplacement[1];

  return falafel(js, parseOptions, function(node) {
    var wildcards = {};
    if (matchNode(wildcards, pattern, node)) {
      var clonedReplacement = clone(replacement);
      // Set replacement node type to matchNode node node type. This is to
      // account for cases when two nodes are isComparable but not equal.
      clonedReplacement.type = node.type;

      var clonedNode = clone(node);
      var updatedNode = rewriteNode(wildcards, clonedReplacement, clonedNode);
      node.update(escodegen.generate(updatedNode));
    }
  });
};

exports.search = function(js, searchRule) {
  var pattern = unwrapNode(esprima.parse(searchRule, {
    raw: true
  }));

  var matches = [];
  falafel(js, { raw: true, loc: true }, function(node) {
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
