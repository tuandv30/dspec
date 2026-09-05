---
name: Plugin build
area: Delivery
code: [scripts/build-plugin.js, src/install/render.ts]
entry: writeResolved
uses: [Body vocabulary, Slash commands and skill]
tests: [test/ship/plugin.test.js]
stamp: sha256f:abe8061348cf1d17
---

Resolves the plugin templates into the installable plugin. The template tree carries placeholders
and is **not** installable as-is; the built tree is committed, because Claude Code installs a plugin
by fetching the repository and there is no build step on the way in.

Rules
- **Anything not committed does not exist for the user.** Edit a template and forget to rebuild, and
  every user keeps receiving the old text while the repository says otherwise. A test re-renders and
  fails when the committed copy differs — the same "re-render and compare" the artifact check
  performs.
- **The build fails if any placeholder survives into the output.** A leaked placeholder is text an
  agent would read as literal instruction.
- **A per-subcommand permission allowlist cannot survive the rewrite.** The command becomes an
  interpolated absolute path, and a permission entry that does not match what the command actually
  runs blocks it **silently** — the user sees a command that does nothing and no reason why.

Behaviour
- Substitution resolves command names and the language block, then retargets every CLI invocation in
  the prose to the plugin's own script path.
- **The verbs it retargets are read from the CLI**, never typed here. The copy that used to live in
  this file went on rewriting `ds compile` and `ds map` for two rounds after both commands were
  deleted — and a verb the CLI does not have is one this would happily rewrite into a command that
  fails.
- Hooks and the plugin manifest are copied raw; only commands and the skill are resolved.
