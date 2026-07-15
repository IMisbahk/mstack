# Feature: [Feature Name]

> Status: Proposed | Validated | Planned | In progress | Released | Deprecated
> Owner: [Name or role]
> Last updated: YYYY-MM-DD
> Product need: [Link to need in `product.md`]

**Build Like This note:** a feature does not justify itself. Use this document
only when the capability has enough uncertainty, coordination, or risk to need
more than an issue and tests. If the user need is unclear, return to
`product.md` before specifying implementation.

## Summary

[State the user, need, and outcome in two sentences.]

## Why now

[Evidence, dependency, or product goal that justifies priority.]

## User stories

- As a [user], I want [behavior], so that [outcome].

## Scope

### Included

- [Behavior]

### Not included

- [Explicit boundary]

## Experience and behavior

### Primary flow

1. [Step]
2. [System behavior]
3. [Outcome]

### States

| State | Trigger | User-visible behavior | Available recovery |
| --- | --- | --- | --- |
| Loading | [Trigger] | [Behavior] | [Recovery] |
| Empty | [Trigger] | [Behavior] | [Recovery] |
| Error | [Trigger] | [Behavior] | [Recovery] |
| Unauthorized | [Trigger] | [Behavior] | [Recovery] |

### Accessibility and responsive behavior

[Keyboard, screen-reader, focus, motion, contrast, and viewport requirements.]

## Acceptance criteria

- [ ] Given [context], when [action], then [observable result].
- [ ] Given [failure/permission case], when [action], then [safe result].

## Technical impact

### API contract

[New or changed operation, schemas, errors, permissions, examples, and compatibility. Link to machine-readable contract.]

### Data

[Entities, migrations, ownership, retention, and backfill.]

### Modules and integrations

[Affected modules and external services. State new dependency direction.]

### Security and privacy

[Threats, authorization, sensitive data, abuse prevention, and audit needs.]

## Analytics and success

| Event/metric | Definition | Properties/source | Target |
| --- | --- | --- | --- |
| [Outcome metric] | [Formula] | [Source] | [Value/window] |

## Test plan

- **Unit:** [Rules]
- **Integration/contract:** [Boundaries]
- **End-to-end:** [Critical journey]
- **Manual:** [Accessibility/exploration]

## Rollout and recovery

- **Rollout:** [Flag, cohort, stages]
- **Monitoring:** [Metrics and alerts]
- **Stop condition:** [Threshold]
- **Rollback/forward recovery:** [Procedure]

## Risks and open questions

- [ ] [Question/risk] — owner: [role], due: [date]

## Documentation changes

- [ ] `product.md`
- [ ] `architecture.md`
- [ ] API contract
- [ ] User or operator documentation
