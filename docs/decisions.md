# Why I Keep Architecture Decision Records

Code shows what the system does. It rarely preserves why one option was accepted and another was rejected.

I use an Architecture Decision Record (ADR) for choices whose costs will matter later. The record stops a team—or an AI agent—from "simplifying" a deliberate constraint because the original context disappeared. It also prevents the same discussion from restarting without new evidence.

Create an ADR when a choice:

- changes a major module or trust boundary;
- adds a datastore, service, framework, model provider, or external system;
- affects a public contract, security, privacy, reliability, or meaningful cost;
- is difficult or expensive to reverse;
- resolves a recurring technical disagreement.

Store ADRs in `docs/decisions/` with names such as `0001-use-postgresql.md`. Number them sequentially and use `proposed`, `accepted`, `superseded`, or `rejected` as the status.

Do not rewrite history to make an old decision look current. A new ADR should supersede it and explain which assumption changed. That change is valuable engineering knowledge.

An ADR records the context, constraints, considered options, decision, consequences, validation plan, and measurable reasons to revisit it. Use [`templates/adr.template.md`](../templates/adr.template.md).

`architecture.md` describes the consolidated system I would build today. ADRs preserve the path and trade-offs that produced it. I keep both because current truth and historical reasoning solve different problems.
