# 40: A message's or a post's photos are saved together

**What to build:** A user saves every photo of one message or one post in a single action.

- **Save all in the viewer.** When the viewer holds more than one photo, it offers "Save all (N)" beside ticket 39's Save. N is the number of photos in that one message or post. There is never a control for a whole conversation's photos (owner, 2026-11-23).
- **Save photos in a post's menu.** A post's "…" menu gets "Save photos", shown only when the post has photos, for everyone who can read the post. The feed itself shows no save icon (owner, 2026-11-23).
- **How a group reaches the device.** It goes through ticket 39's saving service. Where the browser can share files, every photo goes into one share sheet, so "Save N Images" puts them all into the photo library at once. Elsewhere the files download one after another, each with its own name; the browser may ask once to allow several downloads. Never a ZIP.
- **Failure.** If some photos cannot be fetched, the rest are still saved and a toast says how many failed.

**Blocked by:** 39 (A photo open in the viewer is saved to the device)

**Status:** ready-for-agent

**Difficulty:** routine (Opus 5.5 medium): it reuses ticket 39's service, but which control shows depends on several conditions at once (one photo or several, a post with or without photos, a picked photo or a sent one), and the result is checked mostly by looking.

- [ ] The viewer offers "Save all (N)" only when it holds more than one sent or posted photo
- [ ] A post's "…" menu offers "Save photos" only when the post has photos
- [ ] On a browser that can share files, all the photos go into one share sheet; elsewhere they download one by one, with no ZIP
- [ ] A partial failure saves the rest and says how many failed
- [ ] Checked on a real iPhone, a real Android phone and a desktop browser
