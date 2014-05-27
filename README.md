jsfmt
===

[![Build Status](https://travis-ci.org/rdio/jsfmt.svg?branch=master)](https://travis-ci.org/rdio/jsfmt)

`jsfmt` formats javascript and allows AST searching and rewriting. Analogous to [`gofmt`](http://golang.org/cmd/gofmt/).

Installation
---

`npm install -g jsfmt`

Why
---

Javascript formatters exist but most (all?) work on just strings, not the AST. Using Esprima under the hood we have access to the full AST and can do useful things like intelligent find and replace as in `gofmt`.

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

### .jsfmtrc

Any of the [esformatter](https://github.com/millermedeiros/esformatter) formatting
options can be overwritten via a `.jsfmtrc` file. The file is parsed using
[rc](https://github.com/dominictarr/rc), which accepts either a `json` or `ini` formatted file.

`jsfmt` will also attempt to pickup and use the configured `indent`
variable from your `.jshintrc` configuration file, if present.

Rewriting
---

The rewrite rule allows rewriting portions of the javascript's AST before formatting. This is especially handy for intelligent renaming and handling API changes from a library. The `--rewrite` flag must be a string of the form:

    pattern -> replacement

Both `pattern` and `replacement` must be valid javascript. In `pattern`, single-character lowercase identifiers serve as wildcards matching arbitrary expressions; those expressions will be substituted for the same identifiers in the `replacement`.

### Searching

The search rule is very similar but just outputs expressions that match the given search expression.

API
---

Searching:

```javascript
var jsfmt = require('jsfmt');
var fs = require('fs');

var js = fs.readFileSync('my_file.js');

jsfmt.search(js, "R.Component.create(a, { dependencies: z })").forEach(function(matches, wildcards) {
  console.log(wildcards.z);
});
```

Rewriting:

```javascript
var jsfmt = require('jsfmt');
var fs = require('fs');

var js = fs.readFileSync('my_file.js');

js = jsfmt.rewrite(js, "_.each(a, b) -> a.forEach(b)");
```

Examples
---

Rewrite occurences of `_.reduce` to use native reduce:

```bash
jsfmt --rewrite "_.reduce(a, b, c) -> a.reduce(b, c)" examples/reduce.js
```

Before:

```javascript
var values = [1, 2, 3, 4];
_.reduce(values, function(sum, value) {
  return sum + value;
}, 0);
```

After:

```javascript
var values = [1, 2, 3, 4];
values.reduce(function(sum, value) {
  return sum + value;
}, 0);
```

Links
---

- Atom Package - https://atom.io/packages/atom-jsfmt - "Automatically run jsfmt every time you save a javascript source file."
- Grunt Task - https://github.com/james2doyle/grunt-jsfmt - "A task for the jsfmt library."
- Emacs Plugin - https://github.com/brettlangdon/jsfmt.el - "Run jsfmt from within emacs"

Changelog
---

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
