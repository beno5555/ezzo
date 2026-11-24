# 03: Bring repo docs in sync with the code

**What to build:** Make the repository docs concise and accurate so readers can find current setup and architecture guidance in one place. Review the root README, agent and frontend guidance, and backend area docs after the cleanup code has landed.

**Blocked by:** 01 (frontend cleanup) and 02 (backend cleanup) merged into `cleanup`. For files touched by the n8n digest or birthdays work, wait for the corresponding merges into `master` and bring those changes into `cleanup` before editing the overlapping files.

**Status:** ready-for-agent

**Difficulty:** routine (Opus 5.5 medium): Claims and canonical references need to be checked across docs and code. In Codex, use GPT-6.2 Sol at high effort.

- [ ] Replace the stale startup listing in the README with a short overview and a link to the startup source. Keep the setup instructions readers need.
- [ ] Clarify that bulk writes execute without `SaveChangesAsync` and participate in the enclosing transaction when one exists.
- [ ] For related passages, correct inaccurate claims, shorten excessive detail, remove obsolete or irrelevant material, and move repeated guidance to its canonical home. Keep a pointer where a reader still needs one, and remove obsolete copies and contradictions in the same change.
- [ ] Check changed claims against the current code or configuration and verify any new or moved local links. Preserve established behavior and repository rules.

**Branch:** Start from the updated `cleanup` branch after the blockers clear and target `cleanup` for integration.
