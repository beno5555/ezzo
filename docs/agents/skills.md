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
- **Impeccable** (`pbakaus/impeccable`, Apache 2.0): skill 4.10.0 with engine 0.1.27, copied on 2026-11-21 from commit `b49177d` byte for byte (frontend ticket 30). It is used through its named commands (`critique`, `audit`, `adapt`, `polish`) at approval points and on a page's responsive check. Its hook is on trial (below).

### Impeccable

**What it runs.** Everything goes through the launcher `.claude/skills/impeccable/scripts/impeccable` (`impeccable.cmd` for cmd). On first use the launcher downloads one program, the engine (about 24 MB for Windows), from the skill's GitHub release `engine-v0.1.27`. It checks the download against `scripts/engine-checksums.txt` and keeps it per user in `~/.impeccable/bin/0.1.27/`, outside the repo. The Windows engine is signed by Renaissance Geek, Inc. Some commands do more: `live` serves a page on port 8400 and adds a script to `frontend/src/index.html`. `component-review` serves pages on local ports. `shot` and the motion and font checks open a headless browser. Font lookups reach Google Fonts. Image generation needs a key the project does not have.

**Files in the project.**

- `.impeccable/config.json` is committed. It holds the hook's on switch and quiet mode, and it turns off telemetry, the update check and the staleness check.
- `.impeccable/config.local.json` (the local consent to the hook), `hook.cache.json` and `hook.pending.json` are per developer and listed in `.gitignore`. Turning the hook on also adds them to the clone's `.git/info/exclude`, which every worktree shares.
- Change the config only through `impeccable hooks ...`, never by hand. The one exception is `detector.extensions`, which has no command.

**Never run** `init`, `document` or `doctor --fix`. `init` writes `PRODUCT.md` from an interview about audience and positioning, and those are the questions for the name session. `document` rewrites `DESIGN.md`. `doctor --fix` changes files without asking.

**The hook (on trial).** It checks a file after each Edit or Write, and it runs a full pass when the session stops. The check after an edit reports only mechanical faults: contrast, overflow, gradient text, glow, design-system drift. It reads `.ts` files too, because `DESIGN.md` exists. Quiet mode hides the "all clean" notes. The hook is wired only in a checkout's gitignored `.claude/settings.local.json`, so neither the repo nor the owner's `~/.claude/settings.json` turns it on. A new worktree copies that file from the main checkout, so it gets the hook too. To wire the main checkout, run this once from the repo root:

```bash
.claude/skills/impeccable/scripts/impeccable hooks on
```

`hooks status` shows where it is wired. `hooks off` turns it off. `claude --settings '{"disableAllHooks": true}'` starts one session without any hooks.

**Hook findings: ask before you ignore one (owner, 2026-11-21).** The hook's message tells an agent to add an exception itself (`hooks ignore-value`) when it judges a finding wrong. Do not. Fix a finding that is right. Show the owner a finding you think is wrong, with the line and your reason. Add the narrowest exception only after the owner agrees, and write `owner confirmed` in its `--reason`. The owner judges by looking, not by reading code, and may follow the session from another device. So when the dispute is about how something looks, send a screenshot of the element into the chat, with the code beside it when the code helps. Where it makes the difference clearer, add a second screenshot of the hook's proposed fix.

**What the detector misses.** In the trial run outside the repo, a test page with known faults got 5 findings and one advisory: a side stripe, gradient text, 1.6:1 contrast, a glow, cramped padding, and a hard offset shadow. It did not flag a spaced all-caps label over a heading, an emoji used as an icon, or the Inter font. `DESIGN.md` bans all three, so a review still checks them by eye.

**Where it disagrees with `DESIGN.md`** (reported to the owner; the open ones are still to be decided on the merits):

- It calls a neutral shell with one accent colour the category default and asks for a coloured shell with a signature move. `DESIGN.md` keeps a neutral provisional skin until the name session. Open; it belongs to the brand session.
- It asks for one designed moment of motion. `DESIGN.md` allows motion only in answer to a user's action, and none on page load. Open.
- It wants lines of 65 to 75 characters. `DESIGN.md` says under about 80. Open.
- Cards: not a real disagreement. The skill bans one pattern: a page built from same-size cards of icon, heading and text. It also bans a card inside a card. A post in a card, as `DESIGN.md` has it, is allowed.
- Scrollbars: decided for the skill (owner, 2026-11-21). The browser's own scrollbars stay, coloured from the palette, never replaced by custom ones. `design-tokens.css` already makes them follow the light or dark theme (`color-scheme`). Colouring them from the palette is left for the brand session, which replaces the palette. That session adds the rule to `DESIGN.md`.

**A file scan is not a page scan.** The skill's README says a source file gets the pattern rules only. Rules that need the rendered page, such as low contrast and tiny text, run only when the detector is pointed at a URL. Our templates take their colours from token classes, so the hook will rarely see a contrast fault in them. On a page's responsive check, with the dev server running, run `.claude/skills/impeccable/scripts/impeccable detect http://localhost:4200/<page>` as well. It opens the installed Chrome or Edge without a window. It has not been tried on a page that needs a sign-in, which it may see as the sign-in page.

**Trial evidence (frontend ticket 10, the post composer, 2026-11-21).** The hook was on for the whole ticket and found nothing: 0 findings on 4 templates (`photo-picker.html`, `post-composer.html`, `post-card.html` across 3 edits, `feed-page.html`) and on the new `.ts` files. In quiet mode a clean check prints nothing at all, so the only sign that it ran is its cache (`.impeccable/hook.cache.json`), which lists every file it checked. No finding was disputed and no exception was added. The silence fits the code: every colour, radius and size is a token class, and the lint rule already refuses anything else, so the hook's mechanical checks have little left to catch. The URL scan found nothing either, but for the wrong reason. `detect http://localhost:4200/feed` printed nothing in text mode and `[]` with `--json`. Its browser has no session, so the address sends it to the sign-in page, and it scanned that page (`impeccable shot` on the same address photographs the sign-in form). On a page behind the sign-in, a clean URL scan therefore proves nothing. `impeccable context` also misread the project: it reported no visual implementation and asked for `PRODUCT.md` and a surface brief. The agent followed `DESIGN.md` and ran neither `init` nor `document`.

**Trial verdict:** recommendation to keep the hook on, owner to decide. It cost no time that could be noticed and stays silent on clean files. Its rules reach past the lint rule's (a side stripe, gradient text, a glow, cramped padding: "What the detector misses" above), and those faults can be built from tokens alone. Until the URL scan can sign in, run it only on pages a guest can open (`/sign-in`, `/register`), and check pages behind the sign-in with the screenshot command and by eye.

**Cloud sessions.** A cloud session has no `.claude/settings.local.json`, so the hook does not run there. Its skill list still has Impeccable, from the committed folder. The launcher has not been tried in a cloud session: it would download the Linux engine from GitHub's release servers. If it fails there, an agent uses the playbooks without the engine: it reads `reference/` and checks the page by eye against `DESIGN.md`. It says in its report that the detector did not run.

### Rules for any further skill

- At most two design skills. A third would contradict the other two and `DESIGN.md`.
- Read a skill in full before installing it, and say what it runs: scripts, hooks, downloads.
- A skill does not override `DESIGN.md` or the conventions, and they do not override it. See "When a design skill and these documents disagree" in the conventions skill's TypeScript reference.
