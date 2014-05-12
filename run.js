var fs = require('fs');
var util = require('util');
var path = require('path');
var child_process = require('child_process');

var esformatter = require('esformatter');
var escodegen = require('escodegen');
var _ = require('underscore');
var rc = require('rc');

var jsfmt = require('./index.js');

var tmp = require('tmp');
tmp.setGracefulCleanup();

var argv = require('minimist')(process.argv.slice(2), {
  'string': ['rewrite', 'search'],
  'boolean': ['comments', 'diff', 'format', 'list', 'write'],
  'default': {
    comments: true,
    diff: false,
    format: true,
    list: false,
    write: false,
  },
  'alias': {
    comments: 'c',
    diff: 'd',
    format: 'f',
    list: 'l',
    rewrite: 'r',
    search: 's',
    write: 'w',
  }
});

if (argv.help || (!argv.format && !argv.search && !argv.rewrite)) {
  console.log('jsfmt [flags] [path ...]');
  console.log('\tAction:');
  console.log('\t--format=false, -f=false: format the input javascript');
  console.log('\t--search="", -s="": search rule (e.g., \'a.slice\')');
  console.log('\t--rewrite="", -r="": rewrite rule (e.g., \'a.slice(b, len(a) -> a.slice(b)\')');
  console.log('');
  console.log('\tOutput (default is stdout):');
  console.log("\t--list=false, -l=false: list files whose formatting differs from jsfmt's");
  console.log('\t--diff=false, -d=false: display diffs instead of rewriting files');
  console.log('\t--write=false, -w=false: write result to (source) file instead of stdout');
  console.log('');
  console.log('\tConfig:');
  console.log('\t--comments=true, -c=true: include comments in result');
  return;
}

function diff(pathA, pathB, callback) {
  child_process.exec([
    'git', 'diff', '--ignore-space-at-eol', '--no-index', '--', pathA, pathB
  ].join(' '), callback);
}

function handleDiff(fullPath, originalJavascript, formattedJavascript) {
  if (fullPath == 'stdin') {
    tmp.file(function(err, pathA, fdA) {
      if (err) throw err;
      fs.writeSync(fdA, originalJavascript);

      tmp.file(function(err, pathB, fdB) {
        if (err) throw err;
        fs.writeSync(fdB, formattedJavascript);

        diff(pathA, pathB, function(err, stdout, stderr) {
          if (stdout) console.log(stdout);
          if (stderr) console.log(stderr);
        });
      });
    });
  } else {
    tmp.file(function(err, pathA, fdA) {
      if (err) throw err;
      fs.writeSync(fdA, formattedJavascript);

      diff(fullPath, pathA, function(err, stdout, stderr) {
        if (stdout) console.log(stdout);
        if (stderr) console.log(stderr);
      });
    });
  }
}

function handleJavascript(fullPath, original) {
  // attempt to pickup on indent level from existing .jshintrc file
  var jshintSettings = rc('jshint', {
    indent: 2,
  });
  var indentValue = new Array(parseInt(jshintSettings.indent) + 1).join(' ');

  var formattingOptions = rc('jsfmt', {
    preset: 'default',
    indent: {
      value: indentValue
    }
  });

  var js = original;
  var relativePath = path.relative(process.cwd(), fullPath);

  if (argv.search) {
    try {
      jsfmt.search(js, argv.search).forEach(function(match) {
        var node = match.node;
        var loc = node.loc;
        var startLine = loc.start.line;
        var endLine = loc.end.line;
        console.log([relativePath, _.uniq([startLine, endLine]).join(':')].join(':'));

        var partialJavascript = js.split('\n').slice(startLine - 1, endLine).join('\n');
        console.log(partialJavascript, '\n');
      });
    } catch (err) {
      console.error(relativePath, err.message);
    }
    return;
  }

  if (argv.rewrite) {
    try {
      js = jsfmt.rewrite(js, argv.rewrite).toString();
    } catch (err) {
      console.error(relativePath, err);
      return;
    }
  }

  if (argv.format) {
    var sheBang = null;
    // esformatter doesn't like shebangs
    // remove if one exists as the first line
    if (js.indexOf('#!') === 0) {
      var firstNewline = js.indexOf('\n');
      sheBang = js.substring(0, firstNewline);
      js = js.substring(firstNewline);
    }
    try {
      js = esformatter.format(js, formattingOptions);
      // if we had a shebang, add back in
      if (sheBang !== null) {
        js = sheBang + js;
      }
    } catch (err) {
      console.error(relativePath, err);
      return;
    }
  }

  if (argv.diff) {
    handleDiff(fullPath, original, js)
  } else if (argv.list && original != js) {
    // Print filenames who differ
    console.log(relativePath);
  } else if (argv.write) {
    // Overwrite original file
    fs.writeFileSync(fullPath, js);
  } else {
    // Print to stdout
    console.log(js);
  }
}

function handleDirectory(currentPath, callback) {
  child_process.execFile('find', [currentPath, '-name', '*.js'], function(err, stdout, stderr) {
    var paths = _.filter(stdout.split('\n').slice(0, -1), function(currentPath) {
      return path.basename(currentPath).indexOf('.') != 0; // Remove hidden files
    });
    callback(paths);
  });
}

var paths = argv._;

if (paths.length > 0) {
  paths.forEach(function(currentPath) {
    var fullPath = path.resolve(process.cwd(), currentPath);
    if (fs.statSync(fullPath).isDirectory()) {
      handleDirectory(fullPath, function(paths) {
        _.each(paths, function(fullPath) {
          handleJavascript(path.normalize(fullPath), fs.readFileSync(fullPath, 'utf-8'));
        });
      });
    } else {
      handleJavascript(fullPath, fs.readFileSync(fullPath, 'utf-8'));
    }
  });
} else {
  var js = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('readable', function(chunk) {
    var chunk = process.stdin.read();
    if (chunk != null) {
      js += chunk;
    }
  });
  process.stdin.on('end', function() {
    handleJavascript('stdin', js);
  });
}
