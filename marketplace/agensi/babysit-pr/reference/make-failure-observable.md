# make-failure-observable

Use identifiers, actionable errors, timeouts, bounded retries, and a stated user/operator path. Never log secrets or needless personal data.

**When:** Jobs, payments, external writes, or any path that can leave partial state.

**Why:** Silent failure only moves complexity into support and data repair.

**Do not:** Swallow errors or retry forever without idempotency and a stop condition.

Cite `reference/make-failure-observable.md` when it changed a decision. Keep the citation specific.
