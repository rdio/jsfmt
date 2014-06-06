jsfmt
===

[![NPM version](https://badge.fury.io/js/jsfmt.svg)](http://badge.fury.io/js/jsfmt)
[![Build Status](https://travis-ci.org/rdio/jsfmt.svg?branch=master)](https://travis-ci.org/rdio/jsfmt)
[![Dependency Status](https://david-dm.org/rdio/jsfmt.png)](https://david-dm.org/rdio/jsfmt)
[![Coverage Status](https://coveralls.io/repos/rdio/jsfmt/badge.png)](https://coveralls.io/r/rdio/jsfmt)

For formatting, searching, and rewriting JavaScript. Analogous to [`gofmt`](http://golang.org/cmd/gofmt/).

Installation
---

`npm install -g jsfmt`

Usage
---

```
$ jsfmt --help
Usage:
  jsfmt [--no-format] [--diff|--list|--write] [--rewrite PATTERN|--search PATTERN] [<file>...]
  jsfmt (--version | --help)

Options:
  -h --help                      Show this help text
  -v --version                   Show jsfmt version
  -d --diff                      Show diff against original file
  -l --list                      List the files which differ from jsfmt output
  --no-format                    Do not format the input file(s)
  -w --write                     Overwrite the original file with jsfmt output
  -r=PATTERN --rewrite PATTERN   Rewrite rule (e.g., 'a.slice(b, len(a) -> a.slice(b)')
  -s=PATTERN --search PATTERN    Search rule (e.g., 'a.slice')
```

If no path is given it will read from `stdin`. A directory path will recurse over all *.js files in the directory.

Formatting
---

For formatting `jsfmt` uses [esformatter](https://github.com/millermedeiros/esformatter).

### .jsfmtrc

Any of the [esformatter](https://github.com/millermedeiros/esformatter) formatting
options can be overwritten via a `.jsfmtrc` file. The file is parsed using
[rc](https://github.com/dominictarr/rc), which accepts either a `json` or `ini` formatted file.

`jsfmt` will also attempt to pickup and use the configured `indent`
variable from your `.jshintrc` configuration file, if present.

A config file can be manually specified using `--config config.json`.

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

Links
---

- Atom Package - https://atom.io/packages/atom-jsfmt - "Automatically run jsfmt every time you save a JavaScript source file."
- Grunt Task - https://github.com/james2doyle/grunt-jsfmt - "A task for the jsfmt library."
- Emacs Plugin - https://github.com/brettlangdon/jsfmt.el - "Run jsfmt from within emacs"

Changelog
---

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
