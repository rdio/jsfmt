jsfmt
===

`jsfmt` formats javascript and allows AST searching and rewriting. Analagous to [`gofmt`](http://golang.org/cmd/gofmt/).

Installation
---

`npm install -g jsfmt`

Why
---

Javascript formatters exist but most (all?) work on just strings, not the AST. Using Esprima under the hood we have access to the full AST and can do useful things like intelligent find and replace as in `gofmt`.

Usage
---

```
jsfmt [flags] [path ...]
  Action:
  --format=false, -f=false: format the input javascript
  --search="", -s="": search rule (e.g., 'a.slice')
  --rewrite="", -r="": rewrite rule (e.g., 'a.slice(b, len(a) -> a.slice(b)')

  Output (default is stdout):
  --list=false, -l=false: list files whose formatting differs from jsfmt's
  --diff=false, -d=false: display diffs instead of rewriting files
  --write=false, -w=false: write result to (source) file instead of stdout

  Config:
  --comments=true, -c=true: include comments in result
```

At least one action is required. If no path is given it will read from `stdin`. A directory path will recurse over all *.js files in the directory.

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

```lang=javascript
var jsfmt = require('jsfmt');
var fs = require('fs');

var js = fs.readFileSync('my_file.js');

jsfmt.search(js, "R.Component.create(a, { dependencies: z })").forEach(function(matches, wildcards) {
  console.log(wildcards.z);
});
```

Rewriting:

```lang=javascript
var jsfmt = require('jsfmt');
var fs = require('fs');

var js = fs.readFileSync('my_file.js');

js = jsfmt.rewrite(js, "_.each(a, b) -> a.forEach(b)");
```

Examples
---

Rewrite occurences of `_.reduce` to use native reduce:

```lang=bash
jsfmt --rewrite "_.reduce(a, b, c) -> a.reduce(b, c)" examples/reduce.js
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
values.reduce(function(sum, value) {
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
