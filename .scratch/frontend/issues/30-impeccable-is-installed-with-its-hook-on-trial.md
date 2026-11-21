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

**Status:** in-progress

**Difficulty:** tricky: it needs a full read of another author's skill and a judgment on what its program does on the owner's machine; done with the owner, not through `/implement`.

- [x] The owner has been told what the launcher downloads and runs, and has seen one run of it outside the repo
- [x] The skill is committed under `.claude/skills/` and a new session lists it
- [x] The hook is on in quiet mode, and nothing else was changed in the owner's Claude Code settings without being named first
- [x] No `PRODUCT.md` was written
- [ ] After the first styled ticket, `docs/agents/skills.md` records the trial's verdict: what the hook found, whether the findings were right, and whether it stays on
- [ ] If the launcher cannot run in a cloud session, that is recorded in `docs/agents/skills.md` with what an agent does instead

## Comments

- **2026-11-21, install session (Opus 5.5).** The owner read the agent's account of all 50 playbooks and watched one launcher run in a scratch folder. The engine download matched its checksum and carries a valid signature from Renaissance Geek, Inc. A clean page got no findings; a page with known faults got 5. The skill is copied byte for byte from `pbakaus/impeccable` at `b49177d`. `.gitattributes` keeps the sh launcher in LF and the `.cmd` in CRLF. This session's skill list, reloaded after the install, includes `impeccable`; no separate new session was started to check it.
- **What the hook changed.** In this worktree it added three hook entries (SessionStart, PostToolUse on Edit and Write, Stop) to the gitignored `.claude/settings.local.json`. It wrote `.impeccable/config.json`, which is committed, quiet, with telemetry, the update check and the staleness check off, and the local consent file `.impeccable/config.local.json`. It added three lines for its runtime files to the clone's shared `.git/info/exclude`. The same three files are now in `.gitignore`. It also downloaded the engine to `~/.impeccable/bin/0.1.27/`. `~/.claude/settings.json` is unchanged. The main checkout is not wired yet: the owner runs `.claude/skills/impeccable/scripts/impeccable hooks on` from the repo root after the merge. A probe file with gradient text and low contrast got both findings from the hook right after the Write. The probe was then deleted.
- **Owner's decisions.** The hook is wired in the local settings file only, and cloud is untouched. The config is committed. An agent asks the owner before adding any exception to the hook (`docs/agents/skills.md`, `frontend/CLAUDE.md`), against the hook's own message.
- **Still open.** Box 5 waits for the first styled ticket built with the hook on. Box 6: the launcher has not been tried in a cloud session. `docs/agents/skills.md` records what an agent does if it cannot run there, but the box stays open until a cloud session tries it.
- **2026-11-21, owner's follow-up.**
  - The skill must be available in local and cloud sessions alike. The committed folder already gives that.
  - No junction: the skill serves this repo only.
  - A visual dispute over a hook finding is shown to the owner as a screenshot in the chat, with code when it helps.
  - Scrollbars follow the skill: the browser's own, coloured from the palette; the colouring is left for the brand session.
  - Cards were not a real disagreement (`docs/agents/skills.md`).
- **Merge instructions, for the session in the main checkout on `master`** (owner, 2026-11-21: that session does the merge and settles every conflict).
  1. `git fetch`, then `git pull --ff-only` on `master`. Then run `git merge --no-ff worktree-frontend-30-impeccable`.
  2. **Conflicts.** The new files cannot conflict: `.claude/skills/impeccable/` (63 files, byte for byte upstream `b49177d`) and `.impeccable/config.json`. A conflict can come only in the shared text files: `.scratch/roadmap.md`, `CLAUDE.md`, `frontend/CLAUDE.md`, `docs/agents/skills.md`, `.gitignore` and `.gitattributes`. Keep both sides in each of them.
  3. **Line endings.** Run `git ls-files --eol .claude/skills/impeccable/scripts/impeccable .claude/skills/impeccable/scripts/impeccable.cmd`. The first must show `w/lf` and the second `w/crlf`. If not, delete the file and run `git checkout -- <file>`. The rules arrive in the same merge as the files.
  4. **Checks.** The branch changes no code. Its only file under `frontend/` is `frontend/CLAUDE.md`. If `master` has moved since `d4b0892`, run Prettier's check, lint, the unit tests and the build from `frontend/` before the push (root `CLAUDE.md`, "Checks on a merge into `master`"). Run the backend checks only if a conflict fix touched `backend/`. Then push `master`.
  5. **Wire the hook in the main checkout.** Copy the main checkout's `.claude/settings.local.json` to a scratch folder. Then run `.claude/skills/impeccable/scripts/impeccable hooks on` from the repo root. Then check:
     - `.claude/settings.local.json` gained only a `hooks` block (SessionStart, PostToolUse on Edit and Write, Stop) and a `description`. Everything else stays as it was.
     - `.impeccable/config.local.json` exists, and `git check-ignore` lists it.
     - `.git/info/exclude` holds the `impeccable-hook-ignore` block once, not twice.
     - `git status` is clean. If `.impeccable/config.json` changed, show the owner the diff and do not commit it unasked.
     - `~/.claude/settings.json` is unchanged.
     - `.claude/skills/impeccable/scripts/impeccable hooks status` says `wiring .claude: wired`.
  6. The hook works in sessions started after step 5. A new worktree copies the main checkout's `settings.local.json`, so it gets the hook. The worktrees that exist already do not; any of them runs the same command to get it.
  7. Leave this ticket `in-progress`, and leave boxes 5 and 6 open. Do not delete the branch or this worktree without asking the owner. Report to the owner every change from step 5.
- **2026-11-21, the trial ran on ticket 10 (the post composer).** Evidence and a recommendation are in `docs/agents/skills.md` ("Trial evidence", "Trial verdict"). In short: the hook checked 4 templates and the new `.ts` files and found nothing; no finding was disputed and no exception was added. The URL scan of `/feed` also found nothing, but only because its browser is not signed in: it scanned the sign-in page (`impeccable shot` photographed it). Recommendation: keep the hook on, and run the URL scan only on pages a guest can open. Box 5 stays open until the owner decides whether the hook stays on. Box 6 stays open: a local session cannot try the launcher in a cloud session.
