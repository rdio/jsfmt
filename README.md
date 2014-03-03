jsfmt
===

`jsfmt` formats javascript and allows AST rewriting. Analagous to [`gofmt`](http://golang.org/cmd/gofmt/).

Installation
---

`npm install -g jsfmt`

Why
---

Javascript formatters exist but most (all?) work on just strings, not the AST. Using Esprima and Escodegen under the hood we have access to the full AST and can do cool things like intelligent find and replace as in `gofmt`.

Usage
---

```
jsfmt [flags] [path ...]
  -comments=true: print comments
  -d=false: display diffs instead of rewriting files
  -l=false: list files whose formatting differs from jsfmt's
  -r="": rewrite rule (see below)
  -f="": find rule (same as replace "pattern"; see below)
  -tabs=false: indent with tabs
  -tabwidth=2: tab width
  -w=false: write result to (source) file instead of stdout
```

If no path is given it will read from `stdin`. A directory path will format all *.js files in the directory. By default, `jsfmt` prints the reformatted sources to standard output.

Rewriting
---

The rewrite rule allows rewriting portions of the javascript's AST before formatting. This is especially handy for intelligent renaming and handling API changes from a library. The `-r` flag must be a string of the form:

    pattern -> replacement

Both `pattern` and `replacement` must be valid javascript. In the `pattern`, single-character lowercase identifiers serve as wildcards matching arbitrary identifiers in the matched expression; those expressions will be substituted for the same identifiers in the `replacement`.

Examples
---

Rewrite occurences of `_.reduce` to use native reduce:

```lang=bash
jsfmt -r "_.reduce(a, function(b, c) { return b + c }, 0) -> a.reduce(function(b, c) { return b + c }, 0)" examples/reduce.js
```

Before:

```lang=javascript
var values = [1, 2, 3, 4];
_.reduce(values, function(sum, value) {
  return sum + value;
}, 0);
```

After:

```lang=javascript
var values = [1, 2, 3, 4];
values.reduce(function (sum, value) {
  return sum + value;
}, 0);
```

License
---

    Copyright 2014 Rdio, Inc.

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
