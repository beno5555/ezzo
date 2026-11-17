# 04: README describes WebCity as a full-stack product

**What to build:** A visitor to the repository reads about WebCity as it is once the frontend exists: a full-stack product with a backend and an Angular frontend, served from one origin (ADR 0001). The README names both halves and tells a reader how to run each. What it says about the frontend depends on what the frontend turns out to be, which is why this ticket waits for the scaffold.

Together with 03, this replaces the former ticket 02.

**Blocked by:** 03 (README describes the backend as it is now, and the repository is called webcity), and the Angular frontend being scaffolded in `frontend/` (frontend ticket 02, done 2026-11-15). Both are met. The roadmap schedules this ticket for the finish on Tue 24 (step 10), once the pages exist for the README to describe.

**Status:** ready-for-agent

**Difficulty:** routine: writing checked against the code, in the layout decided below.

## Decisions

- **One root README** for both halves (owner, 2026-11-17). If it grows too complex, the session may propose a short root README plus `backend/README.md` and `frontend/README.md`; the owner decides.

## Acceptance

- [ ] The README describes WebCity as a product, names both halves, and tells a reader how to run each
- [ ] Every statement in the README (or READMEs) is true of the code
- [ ] `CLAUDE.md`'s description of the README matches the chosen layout
