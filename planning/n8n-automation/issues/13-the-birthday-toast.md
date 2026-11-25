# 13: The birthday toast

**What to build:** A user who is on any page of WebCity when the automation sends a birthday notification sees a toast that names the friend, and a click takes them to that friend.

- **A fifth toast.** The hub client maps `ReceiveNotification` to the toast rules, beside the four events from frontend ticket 21.
- **For the kind `BIRTHDAY`,** the text comes from the dictionaries, in English and Georgian:
  - one friend: the friend's name, and that it is their birthday today;
  - several: the first friend's name, the number of others, and that it is their birthday today.
- **A click** opens the conversation with the friend when there is one, and the friends page when there are several.
- **A kind the frontend does not know is ignored:** no toast, no error.
- **The toast store's own limits** apply: 5 seconds on screen, three at most.
- **The rule that turns a notification into a toast** lives with the other toast rules, in the place with no template, so it can be unit-tested.

Read `DESIGN.md` and `frontend/CLAUDE.md` before touching a template or a style. Nothing in the frontend ever calls n8n.

This is visual work: the branch waits for the owner's review before it is merged.

Birthdays are second on the roadmap's "Last in line" list, after the digest.

Decisions are under "Frontend" in `planning/n8n-automation/spec.md`, and under "Toasts" in `planning/frontend/spec.md`. The event and its payload are in `docs/backend/signalr.md` once ticket 11 is done. Notification and Toast are defined in `GLOSSARY.md`: the notification is what the automation tells the user, and the toast is only how it is shown.

**Blocked by:** 11 (The backend lists today's birthdays and delivers notifications), and frontend ticket 21 (Live toasts) with everything that ticket waits for

**Status:** ready-for-agent

**Difficulty:** routine (Opus 5.5 medium): the rule is small and fully specified, but it changes toast state that is fed by the live connection.

- [ ] A `BIRTHDAY` notification with one friend shows a toast with that friend's name, and a click opens the conversation with them (unit-tested)
- [ ] A notification with three friends shows the first name and "2 others", and a click opens the friends page (unit-tested)
- [ ] A notification of an unknown kind shows nothing and logs no error (unit-tested)
- [ ] The toast leaves after 5 seconds and counts toward the limit of three, like the other four
- [ ] Both texts come from the dictionaries, in both languages, and read correctly with one friend and with several
- [ ] Checked in the running app with two accounts in two browsers: one account's date of birth set to today, the birthday workflow started by hand, and the toast appearing for the friend
