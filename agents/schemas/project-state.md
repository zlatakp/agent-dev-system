# Schema — project state

A single file maintained by the PM agent and updated in place
after every action. Not an append-only log — overwrite the
previous content each time.

Filename: project-state.md
Location: ../pm/logs/project-state.md

---
last_updated: YYYY-MM-DD
current_iteration: [iteration-id] | none
---

## Completed requirements
[Running list of requirements delivered and accepted by human.
Add after each human-accepted iteration.]

## Outstanding requirements
[Requirements received but not yet planned into an iteration.
Remove each one once it enters an iteration plan.]

## Out-of-scope issues flagged
[Issues flagged by engineer or architect not yet actioned.
Remove once addressed in a subsequent iteration.]

## Architect design notes
[Patterns and conventions introduced across iterations.
Append after each accepted arch-review. Never remove.]