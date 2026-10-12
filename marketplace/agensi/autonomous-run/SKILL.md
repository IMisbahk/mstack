---
name: "autonomous-run"
description: "Define a checkable exit predicate and drive to it without stalling on reversible work."
---

# Long autonomous run

You own the exit predicate and honest progress toward it.

## Prompt shape

- **Goal:** checkable exit predicate
- **Finish condition:** predicate true, or a named dead end with evidence that further iteration cannot help
- **Evidence:** iteration log: change, verification, predicate movement
- **Constraints:** no relaxing the predicate to declare victory; surface only irreversible or preference gates

## Match

Long run, keep going, loop until done, overnight, or unattended progress toward a predicate.

## Steps

Copy these steps into the todo list word for word. Mark skips as `skip: <reason>`.

1. State the exit predicate before the first iteration. Make it pass/fail (`reference/thinking-before-typing.md`).
2. Choose a wake/progress cadence the environment supports. Prefer event-driven checks when available.
3. Each iteration: smallest evidence-justified change → verify → keep or discard (`reference/prove-it-works.md`).
4. Handle mid-run defects that block the predicate; park only irreversible human gates (`reference/never-block-on-the-human.md`).
5. Checkpoint what moved the predicate. Do not stop on a plateau without a new approach.
6. Stop when the predicate holds or a true dead end is evidenced.

## Principles to load

Load these bundled references when a step cites them:

- `reference/never-block-on-the-human.md`
- `reference/prove-it-works.md`
- `reference/guard-the-context-window.md`
- `reference/encode-lessons-in-structure.md`
- `reference/evidence-over-optimism.md`
- `reference/thinking-before-typing.md`


**Reply:** predicate, iterations, what landed, what was discarded, final state.

---

From mstack by Misbah Khursheed (MIT)
