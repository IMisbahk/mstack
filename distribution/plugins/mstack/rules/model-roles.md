# mstack model roles

mstack does not run models. Use these role bindings in the configured AI runtime.

- code: claude-opus-4-6
- judgment: claude-sonnet-4-6
- reviewPanel: claude-opus-4-6, claude-sonnet-4-6, claude-haiku-4-5

## Arena

Multi-model arena is enabled. When the user invokes `/arena` or `multi-model-arena`, solicit independent proposals from:
- claude-opus-4-6
- claude-sonnet-4-6
- claude-haiku-4-5

Compare proposals against the same acceptance criteria, then recommend one path with residual risk.
