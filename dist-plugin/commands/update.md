---
description: Check for a newer dspec and update to it
allowed-tools: Bash(node:*), Read
---

Take a newer dspec, if there is one.

> **dspec cannot update itself, and does not try.** Finding out what the latest version is takes a
> network call, and dspec makes none — everything it does is local, by design. Claude Code owns the
> plugin protocol, so it is Claude Code that fetches and installs. Your job is to walk the user
> through it and confirm the result.

1. `node "${CLAUDE_PLUGIN_ROOT}/bin/ds.js" version` — record the version installed right now, so there is something to compare against.

2. Ask the user to run these two, in this order:

   ```
   /plugin marketplace update     # refresh what the marketplace publishes
   /plugin update ds              # take the new release
   ```

   **You cannot run them for the user** — they are Claude Code's own commands, not shell commands.
   If `/plugin marketplace update` is skipped, the second finds nothing new and the user concludes,
   wrongly, that they are already current.

3. `node "${CLAUDE_PLUGIN_ROOT}/bin/ds.js" version` again and compare. If the number did not move, say so plainly rather than implying
   an update happened: either they were already on the latest, or the update did not take.

4. If the version did move, run `node "${CLAUDE_PLUGIN_ROOT}/bin/ds.js" sync --strict`. A release can change what the model format
   expects, and it is better to find that here than halfway through the next piece of work.
