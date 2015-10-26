var fs = require('fs');
var util = require('util');
var path = require('path');
var child_process = require('child_process');

var glob = require('glob');

var docopt = require('docopt');
var _ = require('underscore');

var jsfmt = require('./index');

var tmp = require('tmp');
tmp.setGracefulCleanup();

var doc = [
  'Usage:',
  '  jsfmt [--no-format] [--save-ast] [--diff|--list|--write] [--validate] [--rewrite PATTERN|--search PATTERN] [--json|--ast] [<file>...]',
  '  jsfmt (--version | --help)',
  '',
  'Options:',
  '  -h --help                      Show this help text',
  '  --version                      Show jsfmt version',
  '  -d --diff                      Show diff against original file',
  '  -l --list                      List the files which differ from jsfmt output',
  '  -v --validate                  Validate the input file(s)',
  '  --no-format                    Do not format the input file(s)',
  '  -w --write                     Overwrite the original file with jsfmt output',
  '  -j --json                      Tell jsfmt that the file being parsed is json',
  '  -a --ast                       Tell jsfmt that the file being parsed is in JSON AST',
  '  --save-ast                     Output the resulting js in JSON AST format',
  '  -r=PATTERN --rewrite PATTERN   Rewrite rule (e.g., \'a.slice(b, len(a) -> a.slice(b)\')',
  '  -s=PATTERN --search PATTERN    Search rule (e.g., \'a.slice\')',
].join("\r\n");

var info = require('../package.json');
var argv = docopt.docopt(doc, {
  help: true,
  version: 'jsfmt ' + info.version,
});

if (argv['--json'] && (argv['--rewrite'] || argv['--search'])) {
  console.error('Rewriting/Searching is not supported for JSON');
  process.exit(-1);
}

function diff(pathA, pathB, callback) {
  child_process.exec([
    'git', 'diff', '--ignore-space-at-eol', '--no-index', '--', pathA, pathB
  ].join(' '), callback);
}

function handleDiff(fullPath, originalJavascript, formattedJavascript) {
  if (fullPath == 'stdin') {
    tmp.file(function(err, pathA, fdA) {
      if (err) {
        console.error(err);
        return;
      }
      fs.writeSync(fdA, originalJavascript);

      tmp.file(function(err, pathB, fdB) {
        if (err) {
          console.error(err);
          return;
        }
        fs.writeSync(fdB, formattedJavascript);

        diff(pathA, pathB, function(err, stdout, stderr) {
          if (stdout) {
            console.log(stdout);
          }
          if (stderr) {
            console.log(stderr);
          }
        });
      });
    });
  } else {
    tmp.file(function(err, pathA, fdA) {
      if (err) {
        console.error(err);
        return;
      }
      fs.writeSync(fdA, formattedJavascript);

      diff(fullPath, pathA, function(err, stdout, stderr) {
        if (stdout) {
          console.log(stdout);
        }
        if (stderr) {
          console.error(stderr);
        }
      });
    });
  }
}

function handleJavascript(fullPath, original) {
  var js = original;
  var relativePath = path.relative(process.cwd(), fullPath);

  if (argv['--ast']) {
    try {
      js = jsfmt.parseAST(JSON.parse(js));
    } catch ( err ) {
      console.error(relativePath, err.message);
      return false;
    }
  }

  if (argv['--search']) {
    try {
      jsfmt.search(js, argv['--search']).forEach(function(match) {
        var node = match.node;
        var loc = node.loc;
        var startLine = loc.start.line;
        var endLine = loc.end.line;
        console.log([relativePath, _.uniq([startLine, endLine]).join(':')].join(':'));

        var partialJavascript = js.split('\n').slice(startLine - 1, endLine).join('\n');
        console.log(partialJavascript, '\n');
      });
    } catch ( err ) {
      console.error(relativePath, err.message);
      return false;
    }
    return true;
  }

  if (argv['--rewrite']) {
    try {
      js = jsfmt.rewrite(js, argv['--rewrite']).toString();
    } catch ( err ) {
      console.error(relativePath, err);
      return false;
    }
  }

  if (!argv['--no-format']) {
    try {
      if (argv['--json']) {
        js = jsfmt.formatJSON(js);
      } else {
        js = jsfmt.format(js);
      }
    } catch ( err ) {
      console.error(relativePath, err);
      return false;
    }
  }

  if (argv['--validate']) {
    var errors = null;
    if (argv['--json']) {
      errors = jsfmt.validateJSON(js);
    } else {
      errors = jsfmt.validate(js);
    }
    if (errors && errors.length) {
      errors.forEach(function(error) {
        var msg = util.format('Error: %s Line: %s Column: %s', error.description, error.lineNumber, error.column);
        console.error(msg);
      });
      return false;
    }
  }

  if (argv['--diff']) {
    handleDiff(fullPath, original, js);
  } else if (argv['--list']) {
    // Print filenames who differ
    if (original != js) {
      console.log(relativePath);
    }
  } else if (argv['--write']) {
    // Overwrite original file
    fs.writeFileSync(fullPath, js);
  } else {
    if (argv['--save-ast']) {
      var ast = jsfmt.generateAST(js);
      js = JSON.stringify(ast);
      if (!argv['--no-format']) {
        js = jsfmt.formatJSON(js);
      }
    }
    // Print to stdout
    process.stdout.write(js);
  }
  return true;
}

function handleDirectory(currentPath, callback) {
  child_process.execFile('find', [currentPath, '-name', '*.js'], function(err, stdout, stderr) {
    var paths = _.filter(stdout.split('\n').slice(0, -1), function(currentPath) {
      return path.basename(currentPath).indexOf('.') !== 0; // Remove hidden files
    });
    callback(paths);
  });
}

var paths = argv['<file>'];

if (paths.length > 0) {
  paths.forEach(function(currentPath) {

    // Unpack globs (e.g. "**/*.js")
    glob(currentPath, function(err, paths) {
      if (err) {
        console.error(err);
        return;
      }

      paths.forEach(function(currentPath) {
        var fullPath = path.resolve(process.cwd(), currentPath);
        if (fs.statSync(fullPath).isDirectory()) {
          handleDirectory(fullPath, function(paths) {
            _.each(paths, function(fullPath) {
              if (!handleJavascript(path.normalize(fullPath), fs.readFileSync(fullPath, 'utf-8'))) {
                process.exitCode = -1;
              }
            });
          });
        } else {
          if (!handleJavascript(fullPath, fs.readFileSync(fullPath, 'utf-8'))) {
            process.exitCode = -1;
          }
        }
      });
    });
  });
} else {
  var js = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('readable', function() {
    var chunk = process.stdin.read();
    if (chunk !== null) {
      js += chunk;
    } else if (chunk === null && js === '') {
      console.log(doc);
      process.exit(-1);
    }
  });
  process.stdin.on('end', function() {
    if (!handleJavascript('stdin', js)) {
      process.exitCode = -1;
    }
  });
}
