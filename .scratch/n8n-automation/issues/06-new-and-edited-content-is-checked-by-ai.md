# 06: New and edited content is checked by AI

**What to build:** A post or a comment is published at once and checked a moment later by OpenAI's moderation endpoint. Doubtful content becomes Flagged and appears in the administrator's moderation queue; clearly violating content becomes Hidden. Either way, administrators get an alert on Telegram and by email.

- **The workflow** listens on `post-created`, `post-edited`, `comment-created` and `comment-edited`, each webhook starting with the signature check from ticket 02.
- **What is sent to OpenAI.** The text (for a post, the title and the text) in one call to the moderation endpoint with model `omni-moderation-latest`. For a new post, each photo in a call of its own: downloaded from the backend by its relative address, and sent as a base64 data URL. An edit cannot add photos, so an edit is checked on its text alone. Direct messages are never sent anywhere.
- **The rule.** The highest result across the calls decides. Marked as violating by OpenAI: Flagged. Any category score of 0.9 or more: Hidden. The 0.9 sits in one clearly named node at the top of the workflow.
- **Acting.** The workflow calls the backend's moderation route for the post or the comment with the API key credential. Content that arrives already Hidden is not checked. A `404` (the content was deleted meanwhile) and a `403` (the status may not be lowered) end the run quietly.
- **The alert,** for Flagged and for Hidden: one Telegram message to the administrators' chat and one email to the administrator address, with the content's text, its author, the outcome and the categories that decided it. Clean content sends nothing.
- **The checklist** for this workflow is added to the `n8n/` README.

Two things are not confirmed and are settled here: whether OpenAI serves the moderation endpoint to an account with no payment method, and whether it refuses more than one photo in a call. If the account is refused, stop and tell the owner; do not replace the service.

Runs on the owner's machine: it needs Docker running, the OpenAI key in n8n's credentials file and the administrator address in `.env`. This ticket is not done until the owner has run the checklist.

Decisions are under "The six workflows" and "Moderation by the automation" in `.scratch/n8n-automation/spec.md`. Flagged and Hidden are defined in `GLOSSARY.md`.

**Blocked by:** 02 (n8n starts from the repository and sends that failure to Telegram), 03 (The automation calls the backend with its own key and can only raise a moderation status), 04 (The backend tells the automation about new accounts, content and reports)

**Status:** in-progress

**Difficulty:** tricky: three systems joined for the first time, an external API whose behaviour with photos is unconfirmed, and no test to catch a mistake.

## How to work this ticket (workflow ticket: no `/implement`, no TDD)

No test catches a broken workflow, so this ticket is proven by running it, and the owner's run closes it.

1. Set the status to `in-progress`. Work on the current branch; read `n8n/README.md` and ticket 02's Comments first, and copy the exception-alert workflow's pattern.
2. Build the workflow file and its README checklist. Load it with `docker compose -f n8n/compose.yaml up -d` and prove every box that does not need the owner's accounts (the signature answers, the node chain, the real events). Secrets are never printed or committed. Docker must be running, and the Telegram, SMTP and OpenAI values are the owner's to fill in.
3. Run the `spec-review` skill against this ticket and the spec, and fix what it finds.
4. Append a report under `## Comments` as `**<date>, built (<model>).**`: what was built and any departure from the ticket with its reason; what was run against the real n8n and what it showed; and a `For the owner` block with the exact commands from the repo root, what each should show, and which credential and `.env` names to fill in first (names, never values). Say which boxes the session proved and which only the owner's run can prove.
5. Tick only the boxes the session proved. The status stays `in-progress` until the owner has run the checklist; never set `done`. The build and the full test suite are not needed when no backend file changed.
6. Commit to the current branch (the author and the `Co-Authored-By` line follow `CLAUDE.md`). Do not merge.

- [ ] A clean post stays Visible and sends no alert
- [ ] A post whose text OpenAI marks as violating becomes Flagged, stays visible to other users, and appears in the moderation queue
- [ ] A post whose text scores 0.9 or more in a category becomes Hidden within seconds: another user no longer sees it, and its author sees it marked hidden
- [ ] A post with clean text and a violating photo is flagged or hidden by the photo
- [ ] A comment is flagged and hidden by the same rule
- [ ] A clean post edited into a violating one is flagged or hidden after the edit
- [ ] A Hidden post edited into clean text stays Hidden
- [ ] Each flag and each hide sends one Telegram message to the administrators' chat and one email to the administrator address, with the text, the author, the outcome and the categories
- [ ] Deleting a post right after creating it leaves no failed execution that needs attention
- [ ] Changing the hide score in the workflow's settings node changes the outcome, with no backend change
- [x] The two unconfirmed points about OpenAI are recorded as confirmed or corrected in this ticket's comments
- [x] The workflow file is committed with a fixed id and no pinned data; the README's checklist is written
- [ ] The owner ran the checklist on their machine

## Known limits from ticket 01

Ticket 01 built the backend's sending side (`EventPublisher`, `docs/backend/automation.md`). These limits of it affect this ticket; the full list is in ticket 01's Comments.

- **A lost event is content nobody checks.** A post or comment created or edited while n8n is down stays Visible until someone reports it. The backend's `Log` row names the event, not the content, so it cannot be found and checked later.
- **Answer first.** The backend waits up to 3 seconds for n8n's answer inside the user's request. Respond to Webhook runs straight after the signature check, before any OpenAI call; the moderation calls take far longer than that.
- **Check the signature on the raw body**, as ticket 02 does.

## Comments

- **2026-11-24, built (Opus 5.5).** `n8n/workflows/ai-moderation.json` (id `wcAiModeration01`). Four webhooks (`post-created`, `post-edited`, `comment-created`, `comment-edited`) share the ticket 02 signature check. The rest of the chain:
  - `Settings: hide score` (`hideScore` 0.9).
  - `Not hidden yet?`: content that arrives Hidden ends the run.
  - `List the checks`: the text is one check (a post's title and text); each photo of a new post is a check of its own.
  - `Download the photo` → `Make the data URL` (base64). A photo that answers `404` is dropped; any other answer fails the run.
  - `All checks` (Merge) → `Ask OpenAI` (`omni-moderation-latest`, `Ezzo OpenAI` credential, retries twice).
  - `Decide`: the highest result across the checks decides. A score at or above `hideScore` hides; otherwise OpenAI's `flagged` flags.
  - `PUT /api/admin/{posts|comments}/{id}/moderation` on the `Ezzo automation API key` credential. A `200` sends one Telegram message and one email. A `404` or `403` ends the run quietly. Any other answer fails the run.

  The checklist is under "AI moderation" in `n8n/README.md`, and `docs/backend/automation.md` lists the workflow.
  - **The two points about OpenAI,** tested with the owner's key directly against `https://api.openai.com/v1/moderations`:
    - *Served:* `200` for text, for one image, and for text with one image. Whether the account has a payment method was not checked from here; the owner knows. Either way, this key works.
    - *Corrected, more than one photo per call:* refused. A call with two images answers `400` `too_many_images`, "Number of images (2) exceeds maximum of 1". The workflow sends one photo per call.
  - **Beyond the ticket, and why:**
    - Content that already has the outcome (a Flagged post edited and still flagged) gets no call and no alert. The route would change nothing, and a second alert would break "one message per flag".
    - The alert names the check each category came from (`text`, `photo 1`), shows scores to 3 decimals (so 0.896 does not read as 0.90), and links to the moderation queue (Flagged) or the post (Hidden), as Report handling links.
    - `Ask OpenAI` retries twice, five seconds apart. A photo that answers `404` is dropped, so deleting a post at once never fails the run.
  - **Run against the real n8n 2.47.7 and the real OpenAI,** with signed events from a scratch script (not committed) and this worktree's backend on 7102. Made-up ids were used, so every moderation call answered `404` and ended quietly. That proves the key was accepted (a bad key answers `401`). No real content was changed: that needs accounts on the owner's database.
    - A wrong and a missing signature on `post-created` and `comment-edited`: `401`.
    - Every event answered `200` in about 70 ms, before the OpenAI calls.
    - Clean text: `None`, no call.
    - `I hope you get hit by a bus.`: Flagged (harassment 0.650), then a `PUT` with `Flagged`.
    - `I will punch you in the face if I see you.`: violence 0.953, Hidden, on a comment.
    - A `post-edited` that arrives Hidden: the run stops at `Not hidden yet?`.
    - A `post-edited` that arrives Flagged and still flags: no call.
    - A post with a real photo (a test PNG placed in `Uploads/` and removed afterwards) and a missing one: the real photo was downloaded and sent as a data URL in its own call, the missing one was dropped, and a post with no photos ran the empty Merge lane fine.
    - `hideScore` lowered to 0.0005 in the file and loaded: the photo's tiny violence score hid the post, and the categories named `photo 1`. It was then set back to 0.9.
    - Escaping: `<`, `>`, `&` and `"` in the text and the username are escaped.
  - **Spec review (Opus 5.5).**
    - *Severe, fixed:* an edit to content that was already Flagged and still flagged sent a second alert. It now ends before the call.
    - *Tidy-ups, fixed:*
      - Conditions are named in `List the checks` and `Make the data URL`.
      - One map per outcome replaces four `isHidden ?` branches.
      - Scores show 3 decimals.
      - "Photos checked" counts the photos actually sent, not every address.
      - A duplicate node-internal id is gone.
      - The spec's OpenAI line says what was and was not checked.
    - *Open, the owner's call:* `escapeHtml` is now in a fourth Code node, and `truncate` and the email wrapper are each in a third workflow. They fall under the same decision as ticket 07's open item (a module mounted for n8n, or an exception in the conventions skill). Until then they are copied.
  - **Boxes:**
    - *Proven by the session:* the OpenAI points, and the committed file with its checklist.
    - *Partly shown, still the owner's:*
      - The flag, hide, photo, comment, edit and Hidden-stays-Hidden decisions, and the hide-score box. The decisions and the calls were right, but no real content changed.
      - The deleted-post box. A `404` on both the photo and the status ended quietly, but not from a real delete.
    - *Only the owner's run proves:* the real status changes seen by a reader, the author and the moderation queue; every Telegram message and email.
  - **For the owner:**
    1. Fill in, in `n8n/credentials.json`: the `Ezzo SMTP` entry (`user`, `password`). In `n8n/.env`: `WEBCITY_ADMINISTRATOR_EMAIL`. The OpenAI key, the bot token and `TELEGRAM_ADMINISTRATORS_CHAT_ID` are already set.
    2. `docker compose -f n8n/compose.yaml up -d`. `docker compose -f n8n/compose.yaml logs n8n-import` shows `Publishing workflow with ID: wcAiModeration01`.
    3. `dotnet run --project backend/aspnetproject --launch-profile https` and `npm start --prefix frontend`.
    4. Go through "AI moderation" in `n8n/README.md` with an author, a reader and an administrator. Its test texts and the scores they got are listed there.
