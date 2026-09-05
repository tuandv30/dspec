---
name: Release
area: Delivery
code: [scripts/release.js, scripts/publish-release.js]
uses: [Plugin build]
stamp: sha256f:6150d440d85f9606
---

Cuts a release: writes the version into every file that carries it, rebuilds the plugin, runs the
suite, commits, and puts the tag on that commit. **The git tag is the version** — it used to live in three JSON files kept in step by
hand, and it drifted within an hour of the first release.

Rules
- **The tag goes on the release commit, never before it.** A tag created first points at code that
  is not what shipped.
- **Stop rather than guess** on a dirty tree, a malformed tag, or a tag already on the remote
  pointing elsewhere.
- **A git tag and a published release are different objects.** Creating the tag does not announce
  anything, so a release that skips publication is shipping while the releases page still advertises
  an older version.
- **Release notes come from the changelog**, never from anything hand-written at publish time: a
  second account of one change starts identical and then drifts.
- **Publication is a separate step**, because a release cannot be created for a tag the remote does
  not have — the tool would otherwise create that tag itself, from wherever the default branch
  points, and describe a commit nobody released. It is idempotent, so a forgotten publication can be
  done later.

Behaviour
- Writing the version, rebuilding the plugin, running the suite, committing and tagging happen in
  that order, and the ordering is the point.
- How users receive an update is unaffected by any of this: Claude Code reads the built plugin off
  the default branch and compares its version. The releases page is for people.
