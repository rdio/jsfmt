jsfmt
===

`jsfmt` formats javascript.

Without an explicit path, it processes the standard input. Given a file, it operates on that file; given a directory, it operates on all .js files in that directory, recursively. (Files starting with a period are ignored.) By default, gofmt prints the reformatted sources to standard output.

TODO
===

1. Handle directories
2. Rewrite expressions, not just identifiers
