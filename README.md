jsfmt
===

`jsfmt` formats javascript and allows AST rewriting. Analagous to [`gofmt`](http://golang.org/cmd/gofmt/).

Usage
---

```
jsfmt [flags] [path ...]
  -comments=true: print comments
  -d=false: display diffs instead of rewriting files
  -l=false: list files whose formatting differs from jsfmt's
  -r="": rewrite rule (e.g., 'a[b:len(a)] -> a[b:]')
  -tabs=false: indent with tabs
  -tabwidth=2: tab width
  -w=false: write result to (source) file instead of stdout
```

If no path is given it will read from `stdin`. A directory path will format all *.js files in the directory. By default, `jsfmt` prints the reformatted sources to standard output.

TODO
---

1. Allow rewriting whole expressions, not just identifiers

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
