jsfmt
===

[![NPM version](https://badge.fury.io/js/jsfmt.svg)](http://badge.fury.io/js/jsfmt)
[![Build Status](https://travis-ci.org/rdio/jsfmt.svg?branch=master)](https://travis-ci.org/rdio/jsfmt)
[![Dependency Status](https://david-dm.org/rdio/jsfmt.svg)](https://david-dm.org/rdio/jsfmt)
[![Coverage Status](https://coveralls.io/repos/rdio/jsfmt/badge.svg)](https://coveralls.io/r/rdio/jsfmt)

For formatting, searching, and rewriting JavaScript. Analogous to [`gofmt`](http://golang.org/cmd/gofmt/).

Installation
---

`npm install -g jsfmt`

Usage
---

```
$ jsfmt --help
Usage:
  jsfmt [--no-format] [--save-ast] [--diff|--list|--write] [--validate] [--rewrite PATTERN|--search PATTERN] [--json|--ast] [<file>...]
  jsfmt (--version | --help)

Options:
  -h --help                      Show this help text
  --version                      Show jsfmt version
  -d --diff                      Show diff against original file
  -l --list                      List the files which differ from jsfmt output
  -v --validate                  Validate the input file(s)
  --no-format                    Do not format the input file(s)
  -w --write                     Overwrite the original file with jsfmt output
  -j --json                      Tell jsfmt that the file being parsed is json
  -a --ast                       Tell jsfmt that the file being parsed is in JSON AST
  --save-ast                     Output the resulting js in JSON AST format
  -r=PATTERN --rewrite PATTERN   Rewrite rule (e.g., 'a.slice(b, len(a) -> a.slice(b)')
  -s=PATTERN --search PATTERN    Search rule (e.g., 'a.slice')
```

If no path is given it will read from `stdin`. A directory path will recurse over all *.js files in the directory.

Note that the AST options (`--ast` and `--save-ast`) are experimental and may be removed.

Formatting
---

For formatting `jsfmt` uses [esformatter](https://github.com/millermedeiros/esformatter).

### .jsfmtrc

Any of the [esformatter](https://github.com/millermedeiros/esformatter) formatting
options can be overwritten via a `.jsfmtrc` file. The file is parsed using
[rc](https://github.com/dominictarr/rc), which accepts either a `json` or `ini` formatted file.

A `.jsfmtrc` will be read if it exists in any of the following directories:
* a local .jsfmtrc or the first found looking in ./ ../ ../../ ../../../ etc.
* $HOME/.jsfmtrc
* $HOME/.jsfmt/config
* $HOME/.config/jsfmt
* $HOME/.config/jsfmt/config
* /etc/jsfmtrc
* /etc/jsfmt/config

`jsfmt` will also attempt to pickup and use the configured `indent`
variable from your `.jshintrc` configuration file, if present.

Rewriting
---

The `--rewrite` flag allows rewriting portions of the JavaScript's AST before formatting. This is especially handy for intelligent renaming and handling API changes from a library. The rewrite rule must be a string of the form:

    pattern -> replacement

Both `pattern` and `replacement` must be valid JavaScript. In `pattern`, single-character lowercase identifiers serve as wildcards matching arbitrary expressions; those expressions will be substituted for the same identifiers in the `replacement`.

### Example

Rewrite occurences of `_.reduce` to use native reduce:

    jsfmt --rewrite "_.reduce(a, b, c) -> a.reduce(b, c)" reduce.js

Searching
---

The `--search` flag allows searching through a JavaScript's AST. The search rule is very similar to the rewrite rule but just outputs expressions that match the given search expression. The search expression must be valid JavaScript.

### Example

Find occurences of `_.reduce`:

    jsfmt --search "_.reduce(a, b, c)" reduce.js

Validating
---

The `--validate` flag will print any errors found by esprima while parsing the JavaScript.

### Example

    jsfmt --validate bad.js

API
---

### Formatting

```javascript
jsfmt.format(<javascript_string>, <config_object>) // Returns formatted JavaScript
```

```javascript
jsfmt.formatJSON(<JSON_string>, <config_object>) // Returns formatted JSON
```

```javascript
var config = jsfmt.getConfig(); // Loads the jsfmt config from the appropriate rc file or default config object
```

#### Example

```javascript
var jsfmt = require('jsfmt');
var fs = require('fs');

var js = fs.readFileSync('unformatted.js');
var config = jsfmt.getConfig();

js = jsfmt.format(js, config);
```

### Rewriting

```javascript
jsfmt.rewrite(<javascript_string>, <rewrite_rule>) // Returns rewritten JavaScript
```

#### Example

```javascript
var jsfmt = require('jsfmt');
var fs = require('fs');

var js = fs.readFileSync('each.js');

js = jsfmt.rewrite(js, "_.each(a, b) -> a.forEach(b)");
```

### Searching

```javascript
jsfmt.search(<javascript_string>, <search_expression>) // Returns array of matches
```

#### Example

```javascript
var jsfmt = require('jsfmt');
var fs = require('fs');

var js = fs.readFileSync('component.js');

jsfmt.search(js, "R.Component.create(a, { dependencies: z })").forEach(function(matches, wildcards) {
  console.log(wildcards.z);
});
```

### Validating

```javascript
jsfmt.validate(<javascript_string>) // Returns errors found while parsing JavaScript
```

```javascript
jsfmt.validateJSON(<JSON_string>) // Returns errors found while parsing JSON
```

#### Example

```javascript
var jsfmt = require('jsfmt');
var fs = require('fs');

var js = fs.readFileSync('each.js');
var errors = jsfmt.validate(js);

for (var i = 0; i < errors.length; i++) {
  console.error(errors[i]);
}
```

Plugins
-------

Since `jsfmt` uses `esformatter` under the covers for formatting your code you can utilize any `esformatter` plugins with `jsfmt`. Please see https://github.com/millermedeiros/esformatter/#plugins for more information.

### JSX

There exists a plugin [esformatter-jsx](https://github.com/royriojas/esformatter-jsx) which provides support for formatting JSX with `esformatter`. Please see https://github.com/royriojas/esformatter-jsx/wiki/Usage-with-jsfmt for more information on setting up with `jsfmt`.

Links
---

- vim-jsfmt.vim - https://github.com/mephux/vim-jsfmt - "Format javascript source on save."
- Atom Package - https://atom.io/packages/atom-jsfmt - "Automatically run jsfmt every time you save a JavaScript source file."
- Grunt Task - https://github.com/james2doyle/grunt-jsfmt - "A task for the jsfmt library."
- Emacs Plugin - https://github.com/brettlangdon/jsfmt.el - "Run jsfmt from within emacs"
- Gulp Task - https://github.com/blai/gulp-jsfmt - "A gulp task for jsfmt."  
- Sublime Text plugin - https://github.com/ionutvmi/sublime-jsfmt - "On-demand and automatic jsfmt from Sublime Text 2 and 3"

Changelog
---

### v0.4.0

- Added two new command-line args for AST formatting. Note that these are experimental and may be removed.
- Removed `--config` option in favor of .jsfmtrc and better docs around rc.
- Updated esformatter and using new esformatter plugin for automatic brace insertion.
- Updated style guide to include esformatter changes.
- Fixes and cleanup for shebang.
- Support for variable arguments using ES6 rest syntax.
- General rewrite cleanup.
- Changing exit code to `-1` on missing arg failure.
- Updates to `rc` and other dependencies.

### v0.3.2

- Adding support for `UnaryExpression`
- Fixing bug where rewrite types were not being set properly

### v0.3.1

- Fixed bug when searching for expressions within BlockStatement or Program body
- Added JSON support

### v0.3.0

- Added CONTRIBUTING
- Added tests
- Added Gruntfile for development
- Added CI support
- Added style guide
- Added default formatting config
- Exposed `jsfmt.getConfig` api method for loading jsfmt config
- Exposed `jsfmt.format(js[, options])` api method for formatting
- Added `--validate` option and exposed `jsfmt.validate` api method
- Pinned dependencies

### v0.2.0

- Add [rc](https://github.com/dominictarr/rc) and `--config config.json` support for formatting configuration
- Making `--format` the default action
- Fix support for shebang at the top of js files, e.g. `#!/usr/bin/env node`
- Fix jsfmt diff mode where whitespace was unaccounted for due to `-b` git diff option

### v0.1.1

- Initial release

License
---
Apache License, Version 2.0. Copyright 2014 Rdio, Inc.
