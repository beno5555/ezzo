# 03: Bring repo docs in sync with the code

**What to build:** Make the repository docs concise and accurate so readers can find current setup and architecture guidance in one place. Review the root README, agent and frontend guidance, and backend area docs after the cleanup code has landed.

**Blocked by:** 01 (frontend cleanup) and 02 (backend cleanup) merged into `cleanup`. Both are merged.

**Status:** done

**Difficulty:** routine (Opus 5.5 medium): Claims and canonical references need to be checked across docs and code. In Codex, use GPT-6.2 Sol at high effort.

- [x] Replace the stale startup listing in the README with a short overview and a link to the startup source. Keep the setup instructions readers need.
- [x] Clarify that bulk writes execute without `SaveChangesAsync` and participate in the enclosing transaction when one exists.
- [x] For related passages, correct inaccurate claims, shorten excessive detail, remove obsolete or irrelevant material, and move repeated guidance to its canonical home. Keep a pointer where a reader still needs one, and remove obsolete copies and contradictions in the same change.
- [x] Check changed claims against the current code or configuration and verify any new or moved local links. Preserve established behavior and repository rules.

**Branch:** Use the current `cleanup` branch as the base and integration target. Review the docs against the code on that branch.

## Comments

### 2026-11-24 initial documentation pass

- Started from `cleanup` at `7651b2c`, which includes tickets 01 and 02. Shortened the background-job guide, consolidated the test database and test host guidance, and updated frontend setup, screenshot and Impeccable guidance.
- Checked the changed claims against the repository source and configuration. The link check, frontend Markdown Prettier check and `git diff --check` passed.
- The initial pass deferred the files that also change on the digest and birthdays branches. The owner clarified that this ticket cleans up the docs against the current `cleanup` code.

### 2026-11-24 accuracy review of the initial pass

- Standards and Spec independently reviewed the working diff against `cleanup` (`7651b2c`). They rechecked the corrections and closed all findings. The revised guides keep the allowed-origins and Node setup discoverable, scope the worktree rule to parallel lanes, and preserve the cleanup batch loop and zero-log assertion. The screenshot script points to the guide for usage examples.
- Verified 30 local links, ran Prettier on the changed frontend files, and ran `git diff --check`. Compared the screenshot script with the base and verified that only its leading comment changed.

### 2026-11-24 final pass against `cleanup`

- Replaced the README startup listing with links to `Program.cs` and the service registrations. The data guide now explains immediate bulk execution and rollback in an enclosing transaction. Consolidated setup and pagination and shortened the SignalR guide against the current code.
- Standards and Spec verified the final pass. Their findings restored the local test settings prerequisite, removed the contradictory agent setup copy, and clarified that the SignalR guide's `Authorization` header statement applies to JWTs.
- Verified 62 local links, frontend formatting, and `git diff --check`. The diff changes Markdown and one TypeScript comment, so runtime tests were not rerun.
