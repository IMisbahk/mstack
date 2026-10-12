---
name: "bug-fix"
description: "Reproduce first, confirm mechanism, ship the smallest causal fix with proof."
---

# Bug fix

You own the defect end to end. Investigation may fan out; integration stays with you.

## Prompt shape

- **Goal:** what is broken for whom
- **Finish condition:** original repro fails before the fix and passes after on the same surface
- **Evidence:** failing-then-passing command, log, or journey capture
- **Constraints:** reproduce before editing; no speculative multi-fix patches

## Match

Defect, regression, incorrect behavior, flake with a failing expectation.

## Steps

Copy these steps into the todo list word for word. Mark skips as `skip: <reason>`.

1. Restate symptom, expected behavior, scope, and non-goals. Label assumptions.
2. Reproduce on the matching surface before changing code. Preserve the failing evidence.
3. Binary-search to the violated invariant. Confirm mechanism with runtime evidence (`reference/fix-root-causes.md`).
4. Implement the smallest causal fix. Add or update a regression check that fails on the original mechanism.
5. Re-run the original repro and adjacent cases (`reference/prove-it-works.md`). Revert changes that lack evidence.
6. Report root cause, diff intent, and paste failing-then-passing proof.

## Principles to load

Load these bundled references when a step cites them:

- `reference/fix-root-causes.md`
- `reference/prove-it-works.md`
- `reference/smallest-complete-slice.md`
- `reference/never-block-on-the-human.md`


**Reply:** broken behavior, mechanism, fix, and verbatim verification evidence.

---

From mstack by Misbah Khursheed (MIT)
