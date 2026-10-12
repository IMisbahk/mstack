# prove-it-works

Check the real result: run the failing path, read the stored value, inspect the diff, or capture the journey. Proxies and 'it compiles' are not proof.

**When:** Before declaring done, opening a PR, or reporting a fix.

**Why:** Unverified work has unknown correctness. Indirect signals feel cheap and hide the failure.

**Do not:** Treat green unit tests alone as proof that a user-visible defect is gone.

Cite `reference/prove-it-works.md` when it changed a decision. Keep the citation specific.
