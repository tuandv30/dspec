---
name: Plugin declaration
area: Setup
code:
  - src/install/project.ts
  - src/install/manifest.ts
  - src/install/tracker.ts
  - src/install/prompt.ts
entry: declarePlugin
uses: [Body vocabulary]
tests: [test/ship/install.test.js]
stamp: sha256f:7be40c57df0e42f6
---

Declares the plugin in the project's Claude Code settings, so a teammate who clones the repo gets
the loop without being told to install anything, and records which dspec authored the model.

Rules
- **The settings file belongs to the user.** Merge into it, never overwrite it. If it cannot be
  parsed, write **nothing** and say so — a syntax error in the user's own file is not a licence to
  replace it.
- **Only ever add the plugin declaration.** Never flip an explicit `false` back to `true`: the user
  turned it off on purpose.
- **Nothing is installed outside `.ds/` and that one settings key.** No commands, no skills, no
  hooks are copied into the user's repo — they ship inside the plugin, so the hook can never be a
  different version from the CLI it calls.
- **Existing files are never touched.** A second run tops up what is missing and leaves everything
  else exactly as the user left it.

Behaviour
- The manifest records which files the installer owns, so a later upgrade can tell what it may
  replace from what the user has since edited.
- `.ds/` receives exactly four kinds and nothing else. A fifth file explaining the language would
  be a second place to keep it documented, and the second copy is the one that goes stale — the
  language is documented once, in the README, and a scaffolded feature carries its own guidance in
  frontmatter comments that disappear the moment it is measured.
