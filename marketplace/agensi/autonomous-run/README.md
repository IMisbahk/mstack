# Long autonomous run

Standalone agent skill bundle for the **Long autonomous run** playbook.

## Outcome

Follow a fixed, evidence-gated sequence so an agent finishes with a checkable result instead of open-ended churn.

## When to use it

Define a checkable exit predicate and drive to it without stalling on reversible work.

## Install

Unzip (or copy) this folder into one of:

- `.claude/skills/autonomous-run/`
- `.cursor/skills/autonomous-run/`
- `.agents/skills/autonomous-run/`

The skill entrypoint is `SKILL.md` at the folder root. Principle guidance lives under `reference/`.

## Bundled references

- `reference/never-block-on-the-human.md`
- `reference/prove-it-works.md`
- `reference/guard-the-context-window.md`
- `reference/encode-lessons-in-structure.md`
- `reference/evidence-over-optimism.md`
- `reference/thinking-before-typing.md`

## Example run

1. Invoke the skill for a matching task (for example: get a PR merge-ready, fix a failing repro, drive an exit predicate, or fan out parallel lanes).
2. Copy the **Steps** into your todo list word for word.
3. When a step cites `reference/<principle>.md`, open that file and apply it.
4. Stop only when the finish condition passes, and paste the verification evidence in the reply.

## License

MIT. From mstack by Misbah Khursheed (MIT)
