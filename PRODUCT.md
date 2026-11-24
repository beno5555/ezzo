# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

People who make things as a hobby (cooking, photography, drawing, crafts). They come to show what they made, get feedback in the comments, and find people who share their hobby, through the feed and then through friendship and chat.

The audience is not limited to Georgian speakers. English is the default interface language and Georgian the second; Russian and Spanish come after the presentation (ADR 0006).

## Product Purpose

A small social platform where people post text and photos, like and comment, become friends, and message their friends in real time. Administrators manage users and content; the automation moderates content, sends email and watches the system. `webcity-documentation.md` at the repo root is the feature list sent to the academy, and all of it is due for the presentation on 2026-11-25.

## Positioning

A place to show your work to friends and to people who share your hobby. The niche is carried by words (the name, the tagline, the landing page, the emails and the demo content), not by features: it adds none to the document's list, and the features are the same for every hobby.

## Capabilities and Constraints

- No control in the app stands for a feature that does not work: no disabled "coming soon" buttons. Video posts are not part of the product; at most, the landing page says in one line that they are coming.
- The interface is fully translatable, but text from the server (failure messages, emails) stays English (ADR 0006). A Georgian interface is therefore partly English, which is why English is the default. A browser that prefers Georgian still starts in Georgian. Full Georgian, with server text translated, comes after the presentation.

## Brand Commitments

- **The name is Ezzo** (in Georgian letters ეზო), from the Georgian word for a courtyard: the shared yard where neighbours meet and show what they have made. The double "z" is there so that English readers say it the Georgian way, "EH-zo".
- **How it is written:** "Ezzo" in every text, and "ezzo", all lowercase, in the logo. Never mixed capitals.
- **The tagline is "Bring what you made."** In Georgian it is its own line, not a translation: "გაგვიზიარე, რაც შექმენი." ("Share with us what you made."). It is always shown next to the name, which answers "bring it where?", and it stands alone, with no second sentence. "Bring" rather than "show": you bring something to a place and to people, which is the courtyard and the social part; "show" is only about you.
- **Voice:** short, warm, direct invitations that speak as a community ("us"), in place of descriptions of the product.
- **The name works on sound first.** It should please people who do not know what it means; the courtyard is a story for those who ask.
- **A rename changes only what users see.** Every text a user reads says Ezzo: the screens, the browser tab, the logo and the emails. Code names (`webcity` in `package.json`, the `webcity-conventions` skill, `~/.webcity-test/`) stay WebCity.
