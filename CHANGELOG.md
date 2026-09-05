# Changelog

All notable changes to this project are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html). The command surface, the
`.ds/` file format and the exit-code contract are what the major version covers: a breaking change
to any of them takes a major bump.

## [Unreleased]

Initial public release.

dspec keeps a product model as markdown in `.ds/` — one file per feature, each declaring the files
it lives in and the features it depends on, each fingerprinted against the checkout.

- **dspec-lang**: four file kinds (`product.md`, `glossary.md`, generated `index.md`,
  `features/*.md`), seven frontmatter keys of which three are required, a lead paragraph and two
  body labels. The path of a feature file carries no meaning; `area:` is the only grouping.
- **Declared, not inferred.** `code:` and `uses:` are written by a person and verified by
  `ds check`: every path must exist, every name must resolve, every `entry:` must be declared in
  one of the feature's own files.
- **Retrieval is a lookup.** `ds pack` resolves a name and never guesses from overlapping words. A
  request naming no feature is told so, and the index is printed to choose from.
- **Reconciliation runs both ways.** `ds sync` reports descriptions whose code moved or changed,
  and source files no feature describes. `--write` only re-measures: it never rewrites a
  description and never deletes a feature.
- **Six lint rules**, chosen by one question — does this failure hide? A `uses:` typo silently
  costs an edge and is an error; an `area:` typo shows in the index and needs no rule.
- **Three hooks**: a session opens knowing what the project owes, an edit surfaces the features
  claiming that file, and leaving with a stale model earns one reminder. All of them only add
  context and none can block a tool call.

Only `ds sync` writes to `.ds/`, and only `ds check` exits non-zero.
