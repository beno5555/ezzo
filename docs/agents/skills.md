# Agent skills

Matt Pocock's engineering skills are committed under `.claude/skills/` so cloud sessions get them.

The copies in `~/.claude/skills/` with the same names are **Windows directory junctions into this repo**, so there is one copy on disk and editing through either path changes both.

- Never replace a junction with a real folder.
- Remove a junction with `cmd /c rmdir <path>`, not `rm -rf`, which can delete the repo copy through the link.
- The global SessionStart hook (`~/.claude/hooks/sync-remote.sh`) warns if a junction becomes a separate copy.

## Skills for Codex

Codex does not read `.claude/skills/`. It finds skills in `.agents/skills/`, which holds **git symlinks** (mode `120000`) to the skills any agent may start on its own: `webcity-conventions`, `tdd`, `codebase-design`, `domain-modeling`, `frontend-design`, `spec-review`. The skills the owner starts (`disable-model-invocation: true`, and `grilling`) get no link, because Codex would offer them to itself.

- `.claude/skills/` stays the only real copy. Edit a skill there.
- A Windows checkout needs `git config core.symlinks true` (and Windows Developer Mode, which is on). Without it, git writes each link as a small text file holding the path, and Codex finds no skills. Linux and cloud checkouts need nothing.
- Add a link from the repo root with `MSYS=winsymlinks:nativestrict ln -s ../../.claude/skills/<name> .agents/skills/<name>`. Without the `MSYS` setting, Git Bash copies the folder instead of linking it. Remove a link with `git rm .agents/skills/<name>`, with no trailing slash.

## Design skills

Two design skills from other authors serve the frontend. Each is a real folder committed under `.claude/skills/`, with no junction.

- **`frontend-design`** (Anthropic, Apache 2.0): one text file, copied on 2026-11-16 from `anthropics/skills` at commit `1780c5e`. It guides new visual work, such as the brand session.
- **Impeccable** (`pbakaus/impeccable`, Apache 2.0): not installed yet; frontend ticket 30 installs it, in a session with the owner. It is used through its named commands (`critique`, `audit`, `adapt`, `polish`) at approval points. Its launcher downloads a program from the skill's GitHub releases and checks it against checksums shipped with the skill. Its hook runs on trial, in quiet mode.

Rules for any further skill:

- At most two design skills. A third would contradict the other two and `DESIGN.md`.
- Read a skill in full before installing it, and say what it runs: scripts, hooks, downloads.
- A skill does not override `DESIGN.md` or the conventions, and they do not override it. See "When a design skill and these documents disagree" in the conventions skill's TypeScript reference.
