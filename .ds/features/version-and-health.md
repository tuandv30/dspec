---
name: Version and health
area: The loop
code: [src/cli/commands/version.ts]
entry: cmdVersion
uses: [Plugin declaration]
tests: [test/ship/version.test.js]
stamp: sha256f:1b6fb50ca3970d75
---

Answers "which dspec is installed, and can it run?" — the version first, because that is the
question being asked, then the checks that explain why that version might not be behaving: the
runtime, git, the plugin declaration, the model.

Rules
- **It reports what is INSTALLED, never what is latest.** Knowing the latest takes a network call,
  and dspec makes none — that is a product rule, not an oversight. Taking a new release is Claude
  Code's job through its own plugin protocol, and `/ds:update` is where the user is sent for it.
- **The path matters as much as the number.** A plugin is cached under a directory carrying its
  version, so the path is what tells a bug report whether the installed plugin answered or a
  checkout somebody is hacking on.
- **Name the half, and give the fix.** "Broken" is not actionable; "Node is not on the PATH this
  process was started with" is.
- **Diagnose the silent failures.** The symptom of a missing runtime is nothing happening at all —
  no hooks, no commands, no error — and this is the one place that is diagnosed. A version manager
  puts Node on the PATH through a shell startup file, so a spawned process can miss it even though
  the user's own terminal finds it.
- **Report; do not act.** Findings carry a suggested fix and nothing is changed unless the user asks.
