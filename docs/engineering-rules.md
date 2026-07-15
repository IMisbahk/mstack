# The Engineering Rules I Use

These rules make my defaults explicit for both people and AI coding agents. They are not style preferences. Each one protects the product from a recurring form of ambiguity, coupling, or operational risk.

An exception is valid when the project has a better reason. Consequential exceptions belong in an ADR so the next person understands the trade-off.

## 1. Documentation comes before code

Do not implement a new product or meaningful capability until its user outcome, scope, acceptance criteria, and technical impact are written.

Why: generated code makes an unexamined idea look real very quickly. A small document exposes disagreement while changing direction is still cheap. Match depth to risk, but never confuse urgency with clarity.

## 2. Backend contracts come before frontend integration

Define requests, responses, errors, permissions, state transitions, and examples first. Share or generate types from the contract where useful, and keep compatibility or migration explicit.

Why: the contract is where durable behavior becomes visible. Without it, every frontend state makes a private guess about the backend.

## 3. Keep responsibilities modular

Give each module one coherent capability, a small public interface, and controlled dependencies. Keep business rules independent of HTTP, frameworks, databases, and providers where that separation improves testing or changeability.

Why: requirements move. Modularity limits how much code must move with them.

## 4. Avoid large files and mixed abstraction levels

Split a file when it owns several reasons to change, not when it crosses an arbitrary line count. A route should not also implement authorization, SQL, email rendering, and analytics.

Why: large mixed files are easy for AI to extend and hard for humans to reason about. Generation speed is not maintainability.

## 5. Refactor continuously

Leave touched code clearer. Remove duplication when the shared concept is understood, strengthen boundaries when changes expose coupling, and separate risky structural work from behavior changes when review benefits.

Why: the first design had the least evidence. Refactoring is how the architecture incorporates what the product taught us.

## 6. Expect requirements to change

Prefer reversible decisions, additive API and data migrations, explicit provider adapters, and small vertical slices. Avoid speculative generalization.

Why: change is not an edge case. The cost of a design is largely the cost of changing it.

## 7. Optimize for maintainability, not the next demo

Choose readable behavior, meaningful names, safe defaults, focused tests, actionable errors, and repeatable operations. A shortcut that hides failure or transfers unexplained work to the next change is debt.

Why: AI makes it easier to create more code than the team can understand. The repository must remain reviewable.

## 8. Validate every external boundary

Treat HTTP input, configuration, webhooks, files, model output, retrieved content, MCP tool output, and third-party responses as untrusted. Validate once at the boundary and keep internal invariants strong.

Why: types disappear at runtime and external systems fail in ways your happy-path example did not predict.

## 9. Make failure observable and recoverable

Use structured logs, request or job identifiers, meaningful metrics, error tracking, timeouts, bounded retries, and idempotency. Define what the user sees and what the operator can do. Do not log secrets or unnecessary personal data.

Why: a silent failure is not simpler. It only moves the complexity into support and data repair.

## 10. Protect data by default

Grant least privilege, keep secrets outside source control, encrypt transport, minimize collection, define retention, test authorization, and audit sensitive actions.

Why: privacy and security cannot be added after the data model and access patterns have already spread through the product.

## 11. Test behavior at the level where it can fail

Unit-test domain rules, integration-test persistence and providers, contract-test APIs, and end-to-end test a small number of critical user journeys. For AI systems, run regression evaluations on representative tasks and unanswerable cases.

Why: tests should make change safer. Tests coupled to private implementation make change slower without protecting users.

## 12. Give every engineering decision a reason

Pull requests should explain why a change exists, its trade-offs, and how it was verified. Use ADRs for decisions that cross modules, add operational systems, affect security or data, or are expensive to reverse.

Why: "best practice" and "AI suggested it" are not product constraints.

## My definition of done

A change is done when:

- it satisfies documented acceptance criteria;
- relevant tests, type checks, linting, and builds pass;
- failure, permission, security, and recovery behavior have been considered;
- contracts and documentation match what shipped;
- logs and metrics make important production behavior understandable;
- migrations and rollback or forward recovery are safe;
- unrelated scope has not been hidden inside the work.

Working code is necessary. It is not the entire definition.
