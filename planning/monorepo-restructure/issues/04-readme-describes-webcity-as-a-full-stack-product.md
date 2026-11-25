# 04: README describes WebCity as a full-stack product

**What to build:** A visitor to the repository reads about WebCity as it is once the frontend exists: a full-stack product with a backend and an Angular frontend, served from one origin (ADR 0001). The root README names both halves and tells a reader how to run each; the depth on each half lives in its own README. What it says about the frontend depends on what the frontend turns out to be, which is why this ticket waits for the scaffold.

Together with 03, this replaces the former ticket 02.

**Blocked by:** 03 (README describes the backend as it is now, and the repository is called webcity), and the Angular frontend being scaffolded in `frontend/` (frontend ticket 02, done 2026-11-15). Both are met. The roadmap schedules this ticket for the finish on Tue 24 (step 10), once the pages exist for the README to describe.

**Status:** superseded by `planning/documentation-update/issues/01-the-docs-describe-ezzo-as-it-is-now.md` (2026-11-25), which writes the root README this ticket asked for, splits the backend and frontend detail into their own READMEs, and renames the product to Ezzo.

**Difficulty:** routine: writing checked against the code, in the layout decided below.

## Decisions

- **Three READMEs: a short root README that hands off to `backend/README.md` and `frontend/README.md`** (owner, 2026-11-24; replaces the single root README decided on 2026-11-17). The root README alone, with the backend's depth and the frontend's added at the same depth, would run to about 450 lines and bury the product overview.
  - **Root `README.md`:** what the product is, its features as a user sees them, the stack in one paragraph, the repository layout, a quick start for the backend, the frontend and n8n, and links to the two READMEs below, `n8n/README.md` and `DESIGN.md`.
  - **`backend/README.md`:** the backend detail the root README holds today (packages, the API project tree, configuration, architecture, startup, design decisions), moved, not rewritten.
  - **`frontend/README.md`:** grows from its five lines to the stack (Angular, Tailwind, signals), the folder layout, pages loaded on demand, the single origin through the dev proxy, and the commands. It points to `frontend/CLAUDE.md` and `DESIGN.md` for the rules and the design rather than repeating them.

## Acceptance

- [ ] The root README describes WebCity as a product, names both halves, tells a reader how to run each, and links to `backend/README.md` and `frontend/README.md`
- [ ] The backend's detail is in `backend/README.md` and no longer in the root README; nothing is said in two of the READMEs
- [ ] Every statement in the three READMEs is true of the code
- [ ] Every pointer to the old root README follows the move: the "Design Decisions" pointer and the Docs section in `CLAUDE.md`, and the "See also" line at the top of each `docs/backend/*.md`
