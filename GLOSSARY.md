# WebCity

A small social platform where people post, comment, befriend each other and exchange direct messages.

## Language

**WebCity**:
The product as a whole: the platform its users see, regardless of which part of the system serves them.
_Avoid_: AspNetProject, aspnetproject (that is only the name of the backend code project)

**Guest**:
A visitor who is not signed in. A guest can find people and read what they have published, but cannot act: no posting, liking, commenting, reporting, befriending or messaging.
_Avoid_: anonymous user, visitor, unauthorized user

**Profile picture**:
The image that stands for a user wherever the user appears. A user who has not set one is shown a default made from their initials.
_Avoid_: avatar, pfp, user image, photo (a photo is an image attached to a post or a message)

**Automation**:
The part of WebCity that acts without a person asking: it reacts to what happens on the platform and to the calendar.
_Avoid_: n8n (that is only the tool it runs on), bot, workflow engine

**Notification**:
Something the automation tells a user inside WebCity while they are using it. A message, a comment or a like reaching a user is not a notification.
_Avoid_: alert, toast, push, live notification

**Alert**:
Something the automation tells administrators or developers outside WebCity.
_Avoid_: notification, warning

**Toast**:
The short-lived element on the screen that shows a user something that just happened. It is the display, never the thing displayed.
_Avoid_: notification, popup, snackbar

**Report**:
A user's complaint about a post, a comment or another user, with a reason, for an administrator to decide.
_Avoid_: flag, complaint, ticket

**Flagged**:
Marked as doubtful and waiting for an administrator, while still visible to everyone. An administrator or the automation flags content; a user never does, a user reports.
_Avoid_: reported, suspicious, pending

**Hidden**:
Visible only to its author and to administrators.
_Avoid_: removed, deleted, blocked, banned

**Digest**:
The weekly email that tells a user what they missed.
_Avoid_: newsletter, summary email, weekly report
