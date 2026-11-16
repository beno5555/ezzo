# Agent skills

Matt Pocock's engineering skills are committed under `.claude/skills/` so cloud sessions get them.

The copies in `~/.claude/skills/` with the same names are **Windows directory junctions into this repo**, so there is one copy on disk and editing through either path changes both.

- Never replace a junction with a real folder.
- Remove a junction with `cmd /c rmdir <path>`, not `rm -rf`, which can delete the repo copy through the link.
- The global SessionStart hook (`~/.claude/hooks/sync-remote.sh`) warns if a junction becomes a separate copy.

## Design skills

Two design skills from other authors serve the frontend. Each is a real folder committed under `.claude/skills/`, with no junction.

- **`frontend-design`** (Anthropic, Apache 2.0): one text file, copied on 2026-11-16 from `anthropics/skills` at commit `1780c5e`. It guides new visual work, such as the brand session.
- **Impeccable** (`pbakaus/impeccable`, Apache 2.0): not installed yet; frontend ticket 30 installs it, in a session with the owner. It is used through its named commands (`critique`, `audit`, `adapt`, `polish`) at approval points. Its launcher downloads a program from the skill's GitHub releases and checks it against checksums shipped with the skill. Its hook runs on trial, in quiet mode.

Rules for any further skill:

- At most two design skills. A third would contradict the other two and `DESIGN.md`.
- Read a skill in full before installing it, and say what it runs: scripts, hooks, downloads.
- A skill does not override `DESIGN.md` or the conventions, and they do not override it. See "When a design skill and these documents disagree" in the conventions skill's TypeScript reference.
