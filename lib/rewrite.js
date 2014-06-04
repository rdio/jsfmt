var util = require('util');
var esprima = require('esprima');
var falafel = require('falafel');
var escodegen = require('escodegen');
var _ = require('underscore');

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function isWildcard(node) {
  return node.type == "Identifier" && /\b[a-z]\b/g.test(node.name);
}

function partial(wildcards, patterns, nodes) {
  // Copy nodes so we don't affect the original.
  nodes = nodes.slice();

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

function comparable(pattern, node) {
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

function match(wildcards, pattern, node) {
  if (pattern === null && node !== null) {
    return false;
  }

  if (pattern !== null && node === null) {
    return false;
  }

  if (wildcards !== null && isWildcard(pattern)) {
    if (pattern.name in wildcards) {
      return match(null, wildcards[pattern.name], node);
    }
    wildcards[pattern.name] = node;
    return true;
  }

  if (!comparable(pattern, node)) {
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
      var matchedKey = match(wildcards, pattern.key, node.key);
      var matchedValue = match(wildcards, pattern.value, node.value);
      return matchedKey && matchedValue;
    case 'MemberExpression':
      if (pattern.computed != node.computed) {
        return false;
      }
      var matchedObject = match(wildcards, pattern.object, node.object);
      var matchedProperty = match(wildcards, pattern.property, node.property);
      return matchedObject && matchedProperty;
    case 'ArrayExpression':
      return partial(wildcards, pattern.elements, node.elements);
    case 'ObjectExpression':
      return partial(wildcards, pattern.properties, node.properties);
    case 'BinaryExpression':
      if (pattern.operator != node.operator) {
        return false;
      }
      var matchedLeft = match(wildcards, pattern.left, node.left);
      var matchedRight = match(wildcards, pattern.right, node.right);
      return matchedLeft && matchedRight;
    case 'ForStatement':
      var matchedForInit = match(wildcards, pattern.init, node.init);
      var matchedTest = match(wildcards, pattern.test, node.test);
      var matchedUpdate = match(wildcards, pattern.update, node.update);
      var matchedBody = match(wildcards, pattern.body, node.body);
      return matchedForInit && matchedTest && matchedUpdate && matchedBody;
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
      var matchedId = match(wildcards, pattern.id, node.id);
      var matchedVarInit = match(wildcards, pattern.init, node.init);
      return matchedId && matchedVarInit;
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

// `replaceWildcards` replaces wildcards with matched wildcard values
function replaceWildcards(wildcards, replacement) {
  var i;
  switch (replacement.type) {
    case 'Identifier':
      if (wildcards !== null && isWildcard(replacement)) {
        if (replacement.name in wildcards) {
          replacement = wildcards[replacement.name];
        }
      }
      break;
    case 'Program':
    case 'BlockStatement':
      for (i = 0; i < replacement.body.length; i++) {
        replacement.body[i] = replaceWildcards(wildcards, replacement.body[i]);
      }
      break;
    case 'ArrayExpression':
      for (i = 0; i < replacement.elements.length; i++) {
        replacement.elements[i] = replaceWildcards(wildcards, replacement.elements[i]);
      }
      break;
    case 'MemberExpression':
      replacement.object = replaceWildcards(wildcards, replacement.object);
      replacement.property = replaceWildcards(wildcards, replacement.property);
      break;
    case 'CallExpression':
      replacement.callee = replaceWildcards(wildcards, replacement.callee);
      for (i = 0; i < replacement.arguments.length; i++) {
        replacement.arguments[i] = replaceWildcards(wildcards, replacement.arguments[i]);
      }
      break;
    case 'FunctionExpression':
      replacement.body = replaceWildcards(wildcards, replacement.body);
      for (i = 0; i < replacement.params.length; i++) {
        replacement.params[i] = replaceWildcards(wildcards, replacement.params[i]);
      }
      for (i = 0; i < replacement.defaults.length; i++) {
        replacement.defaults[i] = replaceWildcards(wildcards, replacement.defaults[i]);
      }
      break;
    case 'FunctionDeclaration':
      replacement.id = replaceWildcards(wildcards, replacement.id);
      replacement.body = replaceWildcards(wildcards, replacement.body);
      for (i = 0; i < replacement.params.length; i++) {
        replacement.params[i] = replaceWildcards(wildcards, replacement.params[i]);
      }
      for (i = 0; i < replacement.defaults.length; i++) {
        replacement.defaults[i] = replaceWildcards(wildcards, replacement.defaults[i]);
      }
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
      for (i = 0; i < replacement.declarations.length; i++) {
        replacement.declarations[i] = replaceWildcards(wildcards, replacement.declarations[i]);
      }
      break;
    case 'VariableDeclarator':
      replacement.id = replaceWildcards(wildcards, replacement.id);
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
      for (i = 0; i < replacement.properties.length; i++) {
        replacement.properties[i] = replaceWildcards(wildcards, replacement.properties[i]);
      }
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
  var pattern = esprima.parse(rewriteRuleParts[0], parseOptions);
  var replacement = esprima.parse(rewriteRuleParts[1], parseOptions);

  return falafel(js, parseOptions, function(node) {
    var wildcards = {};
    if (match(wildcards, pattern, node)) {
      var clonedReplacement = clone(replacement);

      // Set replacement node type to match original node type. This is to
      // account for cases when two nodes are comparable but not equal.
      clonedReplacement.type = node.type;

      var updatedNode = replaceWildcards(wildcards, clonedReplacement);
      var generated = escodegen.generate(updatedNode);
      node.update(generated);
    }
  });
};

exports.search = function(js, searchRule) {
  var pattern = esprima.parse(searchRule, {
    raw: true
  });

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
      });
    }
  });
  return matches;
};
