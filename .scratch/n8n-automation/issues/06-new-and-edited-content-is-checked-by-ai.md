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

**Status:** ready-for-agent

**Difficulty:** tricky: three systems joined for the first time, an external API whose behaviour with photos is unconfirmed, and no test to catch a mistake.

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
- [ ] The two unconfirmed points about OpenAI are recorded as confirmed or corrected in this ticket's comments
- [ ] The workflow file is committed with a fixed id and no pinned data; the README's checklist is written
- [ ] The owner ran the checklist on their machine
