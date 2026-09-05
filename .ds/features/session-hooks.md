---
name: Session hooks
area: Agent surface
code:
  - plugin/hooks/hooks.json
  - plugin/hooks/_ds.js
  - plugin/hooks/session-start.js
  - plugin/hooks/post-edit.js
  - plugin/hooks/stop.js
entry: retarget
uses: [Reconciliation, Drift detection, Model loading]
stamp: sha256f:fde9caf891888fee
---

Three hooks that run without being asked. **This is why
the product is Claude Code only** — the loop works because a session can open knowing what the
project owes, an edit can surface the description bound to the file, and leaving with a stale model
can earn one reminder. No other agent can run a command on a session event.

Rules
- **Every hook only adds context, and always exits 0.** None of them can block a tool call. A gate
  here would teach people to click past it.
- **The stop reminder is a message for a human, not context for an agent**, and it fires once. If it
  becomes annoying the thing to fix is the model, not the hook.
- **The edit hook speaks rarely, and that is where its value comes from.** It runs after every edit
  and is silent whenever no description points at the file — which is the overwhelming majority of
  the time. Something that speaks on every edit is something nobody reads.
- **It must be affordable.** The session hook runs under a timeout, so it takes the fast half of the
  report and keeps drift, which is the most valuable thing a session can open with.

Behaviour
- The edit hook reads the model **in-process** rather than shelling out. There used to be a verb
  that existed only for it — a command no user could name, answering a question no command surface
  advertised. A three-line lookup against the loader shipping beside the hook is the right price;
  a whole verb, and a subprocess per keystroke, was not.
- Every hook resolves the CLI path at runtime, and the verbs it rewrites in advice are read from
  the CLI itself. A hand-kept copy of that list outlived two rounds of command changes, rewriting
  `ds compile` and `ds map` long after both were deleted.
- On session start: what the project owes right now, plus where to look for more.
- After an edit: the descriptions bound to that file, and the instruction to say so if the change
  contradicts one — rather than leaving the model describing behaviour the code no longer has.
- On stop: an offer to reconcile, only when something bound to changed code is stale.
- Each hook resolves the CLI path at runtime, so a hook can never call a different version from the
  one it shipped with.
