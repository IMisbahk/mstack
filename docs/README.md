# How I Use Documentation

Developer tooling is documented under [mstack CLI](cli/README.md), including its generated command reference, configuration, AI runtime support, troubleshooting, and migration guides.

I do not document a project to make the repository look complete. I document it to make decisions explicit before those decisions become expensive code.

Good documentation gives humans and AI agents the same answer to three questions: what are we building, why are we building it, and what constraints must the implementation respect? If a document cannot improve one of those answers, it probably does not need to exist.

## The documents I rely on

| Document | Question it must answer | Owner | Update it when |
| --- | --- | --- | --- |
| `product.md` | Which user problem are we solving, what belongs in the product, and how will we know it worked? | Product owner or project lead | Evidence, scope, priorities, or success measures change |
| `architecture.md` | How will the system satisfy the product and remain safe to change and operate? | Technical owner | Boundaries, data, contracts, infrastructure, or major dependencies change |
| `features.md` | Which significant capabilities exist, and where is their detail? | Feature owner | Feature status, scope, or dependencies change |
| Feature spec | How should one complex or risky capability behave and roll out? | Feature owner | Its behavior, contract, failure modes, or measurement change |
| ADR | Why did we accept the cost of one consequential technical choice? | Decision owner | The decision is proposed, accepted, replaced, or rejected |
| `mstack-developer-experience.md` | What must mstack do before, during, and after it changes a repository? | mstack maintainer | Setup, output, recovery, or diagnostics change |

`product.md` owns intent. `architecture.md` owns the current system design. The code and tests own executable behavior. When they disagree, that is a defect to resolve, not a reason to choose whichever artifact is convenient.

## The sequence matters

1. Write the smallest useful product document.
2. Resolve unclear users, needs, non-goals, and success measures.
3. Design only the architecture required to serve those needs and constraints.
4. Record expensive or difficult-to-reverse choices as ADRs.
5. Divide delivery into thin journeys that produce observable value.
6. Change the documents in the same work that changes reality.

I have found that ten minutes spent writing a precise failure case can save hours of implementation churn. The same is true for naming a non-goal or writing one example API response. Good documentation reduces the number of guesses everyone has to make.

## What useful documentation looks like

- **Current:** it describes what exists or labels a proposal clearly.
- **Decisive:** it changes a choice, establishes a boundary, or resolves ambiguity.
- **Testable:** important requirements and acceptance criteria can fail.
- **Traceable:** an architecture choice points back to a product or operational need.
- **Concise:** detail exists in proportion to uncertainty and risk.
- **Owned:** someone is responsible for keeping it accurate.

Mark assumptions instead of writing them as facts. Add diagrams when relationships are difficult to explain in prose. Include concrete payloads, states, and thresholds where precision matters.

Delete stale duplication. Preserve historical reasoning in version control and ADRs. The goal is a trustworthy source of context, not the largest possible `docs/` directory.
