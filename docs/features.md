# When I Write Feature Documentation

I do not create a long specification for every small change. Documentation should be proportional to uncertainty, coordination cost, and risk.

`docs/features.md` is an optional index for products whose significant capabilities no longer fit cleanly in `product.md`. Its purpose is to connect each feature back to a user need, owner, state, detailed specification, and outcome—not to duplicate an issue tracker.

## Recommended feature index

| Feature | User need | Status | Owner | Specification | Outcome metric |
| --- | --- | --- | --- | --- | --- |
| Example capability | Need from `product.md` | proposed | role/name | link | measurable result |

Use stable states such as `proposed`, `validated`, `planned`, `in progress`, `released`, `deprecated`, and `removed`. A feature being released does not prove that it succeeded; the outcome metric closes that loop.

## When a feature deserves its own document

Create `docs/features/<feature-name>.md` when the feature has complex state transitions, several actors, a new API or data model, meaningful security or privacy impact, unusual failure behavior, a risky rollout, or its own success measure. Start from [the feature template](../templates/feature.template.md).

The document should preserve this chain:

```text
user need -> intended behavior -> contract and data changes
          -> failure states -> validation -> rollout -> measurement
```

The biggest mistake I want to prevent is a feature becoming a self-justifying project. If the link to a user need disappears, stop and revisit the product rather than writing a more detailed specification.

Small, obvious work can remain in `product.md`, an issue, and tests. More documentation is not automatically more disciplined. The right documentation makes the next decision clearer.
