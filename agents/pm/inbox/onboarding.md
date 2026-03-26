---
date: YYYY-MM-DD
from: human
to: pm
status: onboarding
---

## Project overview
[Brief description of what the project is and what it does.]

## Current state
[Where the project is right now — what works, what is incomplete.]

## Known issues — OPTIONAL, omit if not needed
[Anything broken or problematic the agents should know about.]

## Off limits — OPTIONAL, omit if not needed
[Anything that must not be touched.]
```

Each agent handles `onboarding` as a read-only orientation pass — no files produced except logs and an updated project state. The chain is:
```
you → pm → architect → engineer → done