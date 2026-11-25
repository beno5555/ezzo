# 39: A photo open in the viewer is saved to the device

**What to build:** A user saves the photo they are looking at, from a post or from a message, straight into their device's storage, with nothing to extract.

- **Save in the viewer.** The photo viewer's top bar gets a Save button (owner, 2026-11-23: "Save", not "Download") for the photo on screen. It works the same for a post's photos and a message's photos, for either side of the conversation. Picking one photo needs no selection mode: opening it in the viewer is the choice.
- **No icons over the thumbnails.** The feed, the post card and the chat show no save or download control on a photo; saving starts in the viewer only.
- **How the photo reaches the device.** Where the browser can share files (the Web Share API with files, as on an iPhone), Save opens the system's share sheet with the photo attached, so "Save Image" puts it into the photo library; a plain download on an iPhone would land in the Files app instead. Everywhere else (Android, desktop), Save downloads the file directly, under a readable name rather than the stored random one. Never a ZIP: the user must not have to extract anything.
- **One shared piece.** The saving is one small service the viewer calls with the photos to save. Ticket 40 calls the same service with a whole group, so it takes a list from the start.
- **Failure.** A photo that cannot be fetched shows a toast; closing the share sheet without choosing anything is not a failure and shows nothing.

Images are public at their relative address (`docs/backend/controllers.md`, Images; ADR 0004), so the files are fetched from the same origin without the access token. The viewer is the one from ticket 09, and ticket 19 gave it a Remove button for photos picked before sending; Save is for photos already posted or sent, not for picked ones.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

**Difficulty:** tricky: what happens differs between iPhone, Android and desktop browsers, unit tests cannot see it, so it needs real phones, and it creates the saving service that ticket 40 copies.

- [ ] The viewer shows Save for a post's photos and for a message's photos, and not for photos picked but not yet sent
- [ ] On a browser that can share files, Save opens the share sheet with the photo; elsewhere it downloads the file directly, with no ZIP
- [ ] A downloaded file has a readable name and its own extension
- [ ] A photo that cannot be fetched shows a toast; closing the share sheet shows nothing
- [ ] The choice between sharing and downloading is unit-tested with the browser's abilities stubbed
- [ ] Checked on a real iPhone (the photo lands in Photos), a real Android phone and a desktop browser
