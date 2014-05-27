var util = require('util');
var esprima = require('esprima');
var falafel = require('falafel');
var escodegen = require('escodegen');
var _ = require('underscore');

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function unwrapRewriteNode(node) {
  if (node.type == 'Program' && node.body.length > 0) {
    node = unwrapRewriteNode(node.body[0]);
  } else if (node.type == 'ExpressionStatement') {
    node = unwrapRewriteNode(node.expression);
  }
  return node;
}

function isWildcardList(node) {
  return node.type == "Identifier" && /^\$[a-z]$/.test(node.name);
}

function isWildcard(node) {
  return node.type == "Identifier" && /^[a-z]$/.test(node.name);
}

function partial(wildcards, patterns, nodes) {
  // Copy nodes so we don't affect the original.
  nodes = nodes.slice();

  var first = _.first(patterns);
  if (first && wildcards != null && isWildcardList(first)) {
    if (first.name in wildcards) {
      return partial(null, wildcards[first.name], node);
    }

    // TODO: We want to consume up to the next pattern node
    wildcards[first.name] = nodes;
    return true;
  }

  // Given an array of patterns, are each satisfied by
  // a unique node in the array of nodes.
  return _.all(patterns, function(pattern) {
    var index = -1;

    // Using _.any, instead of _.reject since it breaks
    // iteration on the first truthy result.
    _.any(nodes, function(node, i) {
      if (match(wildcards, pattern, node)) {
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

function match(wildcards, pattern, node) {
  if (pattern == null && node != null) {
    return false;
  }

  if (pattern != null && node == null) {
    return false;
  }

  if (wildcards != null && isWildcard(pattern)) {
    if (pattern.name in wildcards) {
      return match(null, wildcards[pattern.name], node);
    }
    wildcards[pattern.name] = node;
    return true;
  }

  if (pattern.type != node.type) {
    return false;
  }

  switch (pattern.type) {
    case 'Program':
    case 'BlockStatement':
      return partial(wildcards, pattern.body, node.body);
    case 'Identifier':
      return pattern.name == node.name;
    case 'Property':
      if (pattern.kind != node.kind) {
        return false;
      }
      return match(wildcards, pattern.key, node.key)
      && match(wildcards, pattern.value, node.value);
    case 'MemberExpression':
      if (pattern.computed != node.computed) {
        return false;
      }
      return match(wildcards, pattern.object, node.object)
      && match(wildcards, pattern.property, node.property);
    case 'ArrayExpression':
      return partial(wildcards, pattern.elements, node.elements);
    case 'ObjectExpression':
      return partial(wildcards, pattern.properties, node.properties);
    case 'BinaryExpression':
      if (pattern.operator != node.operator) {
        return false;
      }
      return match(wildcards, pattern.left, node.left)
      && match(wildcards, pattern.right, node.right);
    case 'ForStatement':
      return match(wildcards, pattern.init, node.init)
      && match(wildcards, pattern.test, node.test)
      && match(wildcards, pattern.update, node.update)
      && match(wildcards, pattern.body, node.body);
    case 'VariableDeclaration':
      if (pattern.kind != node.kind) {
        return false;
      }
      return partial(wildcards, pattern.declarations, node.declarations);
    case 'FunctionExpression':
      if (pattern.id != node.id) {
        return false;
      }
      if (pattern.rest != node.rest) {
        return false;
      }
      if (pattern.generator != node.generator) {
        return false;
      }
      if (pattern.expression != node.expression) {
        return false;
      }
      if (!partial(wildcards, pattern.params, node.params)) {
        return false;
      }
      if (!partial(wildcards, pattern.defaults, node.defaults)) {
        return false;
      }
      if (!match(wildcards, pattern.body, node.body)) {
        return false;
      }
      return true;
    case 'FunctionDeclaration':
      if (pattern.rest != node.rest) {
        return false;
      }
      if (pattern.generator != node.generator) {
        return false;
      }
      if (pattern.expression != node.expression) {
        return false;
      }
      if (!partial(wildcards, pattern.params, node.params)) {
        return false;
      }
      if (!partial(wildcards, pattern.defaults, node.defaults)) {
        return false;
      }
      if (!match(wildcards, pattern.id, node.id)) {
        return false;
      }
      if (!match(wildcards, pattern.body, node.body)) {
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
      return match(wildcards, pattern.argument, node.argument);
    case 'VariableDeclarator':
      return match(wildcards, pattern.id, node.id)
      && match(wildcards, pattern.init, node.init);
    case 'Literal':
      return pattern.raw == node.raw;
    case 'ExpressionStatement':
      return match(wildcards, pattern.expression, node.expression);
    case 'CallExpression':
      if (!match(wildcards, pattern.callee, node.callee)) {
        return false;
      }
      return partial(wildcards, pattern.arguments, node.arguments);
    case 'ReturnStatement':
      return match(wildcards, pattern.argument, node.argument);
    default:
      console.error(pattern.type, "not yet supported in match", pattern);
      return false;
  }

  return false;
}

function replacePartial(wildcards, replacements) {
  var first = _.first(replacements);
  if (first && wildcards != null && isWildcardList(first)) {
    if (first.name in wildcards) {
      // TODO: We need to insert additional wildcards
      return wildcards[first.name];
    }
  }

  return _.map(replacements, function(replacement, i) {
    return replaceWildcards(wildcards, replacement);
  });
}

// `replaceWildcards` replaces wildcards with matched wildcard values
function replaceWildcards(wildcards, replacement) {
  switch (replacement.type) {
    case 'Identifier':
      if (wildcards != null && isWildcard(replacement)) {
        if (replacement.name in wildcards) {
          replacement = wildcards[replacement.name];
        }
      }
      break;
    case 'Program':
    case 'BlockStatement':
      replacement.body = replacePartial(wildcards, replacement.body);
      break;
    case 'ArrayExpression':
      replacement.elements = replacePartial(wildcards, replacement.elements);
      break;
    case 'MemberExpression':
      replacement.object = replaceWildcards(wildcards, replacement.object);
      replacement.property = replaceWildcards(wildcards, replacement.property);
      break;
    case 'CallExpression':
      replacement.callee = replaceWildcards(wildcards, replacement.callee);
      replacement.arguments = replacePartial(wildcards, replacement.arguments);
      break;
    case 'FunctionExpression':
      replacement.body = replaceWildcards(wildcards, replacement.body);
      replacement.params = replacePartial(wildcards, replacement.params);
      replacement.defaults = replacePartial(wildcards, replacement.defaults);
      break;
    case 'FunctionDeclaration':
      replacement.id = replaceWildcards(wildcards, replacement.id);
      replacement.body = replaceWildcards(wildcards, replacement.body);
      replacement.params = replacePartial(wildcards, replacement.params);
      replacement.defaults = replacePartial(wildcards, replacement.defaults);
      break;
    case 'Property':
      replacement.key = replaceWildcards(wildcards, replacement.key);
      replacement.value = replaceWildcards(wildcards, replacement.value);
      replacement.kind = replaceWildcards(wildcards, replacement.kind);
      break;
    case 'BinaryExpression':
      replacement.left = replaceWildcards(wildcards, replacement.left);
      replacement.right = replaceWildcards(wildcards, replacement.right);
      break;
    case 'VariableDeclaration':
      replacement.declarations = replacePartial(wildcards, replacement.declarations);
      break;
    case 'VariableDeclarator':
      replacement.init = replaceWildcards(wildcards, replacement.init);
      break;
    case 'ReturnStatement':
      replacement.argument = replaceWildcards(wildcards, replacement.argument);
      break;
    case 'ExpressionStatement':
      replacement.expression = replaceWildcards(wildcards, replacement.expression);
      break;
    case 'UpdateExpression':
      replacement.argument = replaceWildcards(wildcards, replacement.argument);
      break;
    case 'ForStatement':
      replacement.init = replaceWildcards(wildcards, replacement.init);
      replacement.test = replaceWildcards(wildcards, replacement.test);
      replacement.update = replaceWildcards(wildcards, replacement.update);
      replacement.body = replaceWildcards(wildcards, replacement.body);
      break;
    case 'ObjectExpression':
      replacement.properties = replacePartial(wildcards, replacement.properties);
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

  var parseOptions = {
    raw: true
  };
  var pattern = unwrapRewriteNode(esprima.parse(rewriteRuleParts[0], parseOptions));
  var replacement = unwrapRewriteNode(esprima.parse(rewriteRuleParts[1], parseOptions));

  return falafel(js, parseOptions, function(node) {
    var wildcards = {};
    if (match(wildcards, pattern, node)) {
      node.update(escodegen.generate(replaceWildcards(wildcards, clone(replacement))));
    }
  });
}

exports.search = function(js, searchRule) {
  var pattern = unwrapRewriteNode(esprima.parse(searchRule, {
    raw: true
  }));

  var matches = [];
  falafel(js, {
    raw: true,
    loc: true
  }, function(node) {
    var wildcards = {};
    if (match(wildcards, pattern, node)) {
      matches.push({
        node: node,
        wildcards: wildcards
      })
    }
  });
  return matches;
}
