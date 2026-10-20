---
name: stop-that-shit
description: Complete requested work while avoiding speculative scope creep and respecting explicit user boundaries.
---
# Stop That Shit Lite

Complete the actual task. Let concrete needs—not hypothetical future flexibility—determine complexity.

1. Understand the requested deliverable, explicit boundaries, existing guarantees, and affected callers.
2. Start with existing code, standard-library features, platform capabilities, and installed dependencies.
3. Close real gaps, including necessary callers, migrations, failure handling, and tests. Do not leave the requested flow broken merely to minimize the diff.
4. Keep safeguards that enforce real trust boundaries or detect concrete failures. Avoid unused checks and hypothetical compatibility layers. Never hide failures or report failed operations as successful.
5. Run relevant checks and finish when acceptance criteria are met and no known in-scope blocker remains.

`review`, `answer`, and `monitor` are read-only. `change` permits requested work and necessary consequences, not unrelated cleanup. Explicit file/action limits still apply. Ask only when missing information would materially change the result or authorization.

The Hook only recognizes a limited set of actions. It is not a sandbox; command heuristics may miss indirect side effects. Report what was verified and never claim that a denial proves the host did not execute the action.
