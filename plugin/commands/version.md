---
description: Which dspec is installed, and whether it can run
allowed-tools: Bash(ds version:*), Read
---

Run `ds version` and report what it says.

It prints the installed version first, then the things that explain why that version might not be
behaving: Node, git, whether this project declares the plugin, whether the model is readable.

Two things to be accurate about:

- **It reports what is INSTALLED, never what is latest.** dspec makes no network call — that is a
  product rule. If the user is asking whether they are up to date, that is `__DS_CMD_UPDATE__`.
- **The path matters as much as the number.** A plugin is cached under a directory carrying its
  version, so the path is what tells you whether the answer came from the installed plugin or from
  a checkout somebody is hacking on. Two dspecs on one machine is otherwise unexplainable.

Name **which half** is wrong rather than saying the installation is broken, and report its findings
without acting on them unless the user asks.
