
PRE:
Project instructions are defined in AGENTS.md. **Read and follow it before making any changes.**

==========================================================================================================================================

POST:

Version 1:
==========
Update only AGENTS.md with the changes from the current session if needed to reflect the project’s current state. Make the minimum edits required; if it’s already accurate, do nothing. Do not describe or summarize any changes (no notes/changelog). Ensure the brief is useful for future AI development and includes a concise app overview, structure/architecture, and key application rules/constraints.

Version 2:
===========
Update **only** `AGENTS.md` to reflect the project’s current state based on work completed in this session.

* **Minimum change policy:** Make the smallest possible edits. If `AGENTS.md` is already accurate, make **no changes** and output nothing.
* **Scope:** Do **not** modify any other files.

`AGENTS.md` must remain a compact, high-signal brief for future AI development and should include (only as needed to stay accurate):

1. **App overview:** What the app is, primary users, core workflows, and the main execution/runtime context.
2. **Repo map & architecture:** Key directories/files and their roles; major modules/services; data flow; entry points; build/test/run commands if they are stable and essential.
3. **Interfaces & integrations:** APIs, external services, environments, and configuration sources (where secrets live, how config is loaded).
4. **Key rules & constraints:** Non-negotiable behaviors, invariants, security/privacy constraints, performance constraints, and any “don’t break” assumptions.
5. **Operational notes:** Migration/versioning expectations, deployment/runtime assumptions, and any gotchas that routinely cause errors—only if confirmed by the repo/session.

**Hard prohibitions:**

* No changelog, commentary, or meta text.
* No speculative additions. Only include facts verified in the repo or established during this session.
* Do not reformat large sections unless required for correctness or clarity.
* Avoid verbosity; prefer bullets, short sections, and concrete specifics over general advice.

==========================================================================================================================================

Prompt improvment prompt:
I'm working with codex, improve prompt below (after the colon), IMPROVMENT PROMT SHOULD HAVE COPY BUTTON FOR EASY COPING. The application is React Native for ios only:
