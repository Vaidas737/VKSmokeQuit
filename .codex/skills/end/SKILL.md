---
name: end
description: Update only AGENTS.md to match the project’s current state after work in the current session. Use when the user asks to refresh or reconcile AGENTS.md with completed session changes while enforcing minimal edits, verified facts only, and no changes to other files.
---

# End

## Objective

Update only `AGENTS.md` to reflect the project’s current state from work completed in the current session.

## Workflow

1. Review `AGENTS.md` and compare it against facts established in the repository and current session.
2. Apply the minimum possible edits needed for correctness.
3. Keep `AGENTS.md` compact and high signal.
4. Preserve existing structure unless a structural change is required for correctness or clarity.
5. Leave `AGENTS.md` unchanged if it is already accurate.

## Required Coverage

Include only what is needed to keep `AGENTS.md` accurate:

1. App overview.
2. Repo map and architecture.
3. Interfaces and integrations.
4. Key rules and constraints.
5. Operational notes.

## Hard Constraints

- Modify only `AGENTS.md`.
- Do not modify any other file.
- Do not add changelog, commentary, or meta text.
- Do not add speculative content.
- Use only facts verified in the repository or established in the current session.
- Avoid verbosity; prefer short sections and concrete bullets.

## Output Rule

If `AGENTS.md` is already accurate, make no changes and output nothing.
