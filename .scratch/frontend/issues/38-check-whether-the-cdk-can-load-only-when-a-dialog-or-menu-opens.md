# 38: Check whether the CDK can load only when a dialog or menu opens

**What to build:** Find out whether the Angular CDK can leave the first download and load only when a dialog or menu first opens, without a delay anyone can see. If it can at a reasonable cost, make the change. If it cannot, record why in the ticket's comments, and the ticket ends there.

**Measured on `master` at `4f6a74f` (2026-11-22).** The CDK takes 92.7 kB of the first download's 600.17 kB raw (129.36 kB compressed). Its parts in use are the menu, the dialog and the overlay. The total is 174 bytes over ADR 0009's 600 kB limit.

- **The catch to start from.** The shell's own popover uses the CDK, and the shell is on every page. So for a signed-in user, the CDK may be needed by the shell itself, not only behind a dialog. Find out which parts the shell needs and which only dialogs and menus on lazy pages use. Then work out what can actually move, and for whom: a guest, a signed-in user, a phone, a desktop.
- **The bar for "no visible delay."** The first time a dialog or menu opens, it opens as quickly as it does today, including on a slow connection. If that requires fetching the library quietly in advance, say so and say when the fetch happens.
- **What counts as a reasonable cost.** The kB saved for each kind of visitor is weighed against what the change costs: code across many components, a pattern every later ticket has to follow, or a delay. Record the measurements and the reasoning in the comments, whatever the outcome.
- **The result is measured.** If anything changed, re-measure the first download once the change is done, and record it in the ticket's comments. Leave ADR 0009's limit as it is.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

**Difficulty:** tricky. It is an investigation that may end without a change, and judging both "no visible delay" and "a reasonable cost" needs measurements the ticket cannot give in advance.

- [ ] The comments list the CDK parts the shell needs and the parts only lazy pages use, with each part's share of the 92.7 kB
- [ ] The comments give a decision (move the CDK, move part of it, or leave it) with the measurements behind it
- [ ] If anything moved: every dialog and menu still opens without a visible delay, checked in the app on a throttled connection, and the first download's raw and compressed sizes, before and after, are in the comments
- [ ] ADR 0009's limit is unchanged
- [ ] If code changed: the unit tests, lint, Prettier and the build pass
