# 30: Impeccable is installed, with its hook on trial

**Do this in an ordinary session with the owner, not through `/implement`.** It installs another author's program, and the owner decides at each step. There is no code to review afterwards, so the spec review at the end of `/implement` has nothing to do.

**What to build:** The design skill Impeccable (`pbakaus/impeccable`) is available in every session, local and cloud, and its hook checks styled files on trial, so that the owner can judge from one ticket's evidence whether it stays on.

- **Read first.** The agent reads the skill's playbooks in full and tells the owner what the skill runs: its launcher, what the launcher downloads and from where, its hook, and the files it writes into the project.
- **Run the launcher once outside the repo,** in a scratch folder, and show the owner what it did.
- **Install it** as a real folder committed under `.claude/skills/`, with no junction (`docs/agents/skills.md`).
- **Leave `PRODUCT.md` for the name session.** Impeccable's `init` command writes it from an interview about the audience and the positioning, which are that session's questions.
- **Turn the hook on in quiet mode** once ticket 27 is merged, so that it has styled files to check.
- **The trial.** The hook runs during the first styled ticket built after that, which is ticket 06 if this is done in time. Its findings are judged: are they correct for Angular templates with Tailwind classes, and do they catch what the lint check from ticket 27 misses? The owner then keeps the hook or turns it off.
- **Roles.** Impeccable is used through its named commands (`critique`, `audit`, `adapt`, `polish`) at approval points and on a page's responsive check. A conflict between the skill and `DESIGN.md` or the conventions is reported and decided on the merits (conventions, Styling).

The install itself needs nothing from ticket 27 and can be done earlier; only the hook waits for it.

Decisions are in `docs/agents/skills.md` and in `.scratch/roadmap.md` under "Settled on 2026-11-16".

**Blocked by:** 27 (The app takes its look from design tokens), for the hook only, and the owner being in the session

**Status:** ready-for-agent

**Difficulty:** tricky: it needs a full read of another author's skill and a judgment on what its program does on the owner's machine; done with the owner, not through `/implement`.

- [ ] The owner has been told what the launcher downloads and runs, and has seen one run of it outside the repo
- [ ] The skill is committed under `.claude/skills/` and a new session lists it
- [ ] The hook is on in quiet mode, and nothing else was changed in the owner's Claude Code settings without being named first
- [ ] No `PRODUCT.md` was written
- [ ] After the first styled ticket, `docs/agents/skills.md` records the trial's verdict: what the hook found, whether the findings were right, and whether it stays on
- [ ] If the launcher cannot run in a cloud session, that is recorded in `docs/agents/skills.md` with what an agent does instead
