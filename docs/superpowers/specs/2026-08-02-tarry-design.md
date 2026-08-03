# Tarry — Design

> *"Tarry ye in the city of Jerusalem, until ye be endued with power from on high."* — Luke 24:49

**Date:** 2026-08-02

## The problem

Three frictions, one loop:

1. **I don't show up.** Days slip.
2. **When I do, it's five distracted minutes.** Shallow, rushed.
3. **I keep no record.** I forget what I prayed, forget words spoken over me, and miss it when God answers — so there's no fuel for faith.

The root of #2 is **hurry**. Hurry is the thing to kill. Everything below follows from that.

## The premise: an anti-timer

The app has no countdown, no visible clock, no "step 3 of 9", no progress bar, no streak counter. Each of those is hurry wearing a helpful face. Streaks are specifically excluded: they make you perform for software instead of waiting on a Person.

**The floor mechanic.** Entering a movement presents no way forward — no button, no gesture. After the movement's floor elapses, the continue affordance fades in slowly at the bottom of the screen. You may sit indefinitely longer. You cannot leave early.

Time becomes a floor you stand on, not a budget you spend down.

## The nine movements

Floors lengthen through the session, mirroring how prayer warms up.

| # | Movement | On screen | Floor |
|---|----------|-----------|-------|
| 1 | Be still | *"Be still, and know that I am God."* Ps 46:10 | 1 min |
| 2 | The Word | One passage, plainly shown. Read it slow. Read it again. | 2 min |
| 3 | Behold the King | *"Worthy is the Lamb that was slain."* Rev 5:12. Not what He has done — who He is. Tell Him. | 3 min |
| 4 | Thanksgiving | *"Enter into his gates with thanksgiving."* Ps 100:4. Name things out loud. | 3 min |
| 5 | Search me | *"Search me, O God, and know my heart."* Ps 139:23. Don't dig — let Him bring it up. | 3 min |
| 6 | Confess & release | Name it plainly. Then forgive whoever is owed — *"when ye stand praying, forgive."* Mk 11:25 | 3 min |
| 7 | Intercession | Your people, your list, one at a time. | 5 min |
| 8 | Tongues / soaking | Pray in the Spirit. Screen goes dark. | 8 min |
| 9 | **Wait** | *"They that wait upon the LORD shall renew their strength."* Isa 40:31 | **none** |

Total floor before waiting: 28 minutes.

Movement 3 exists because the rest of the altar is largely about what He does — gives, forgives, answers, speaks. This one is only about who He is. Adoration sits after the Word so that it responds to something just seen, and before Thanksgiving so that praise leads rather than follows gratitude.

### Movement 6 — the release detail

When movement 6's floor lifts, the word *continue* does **not** appear. The promise does:

> *"If we confess our sins, he is faithful and just to forgive us our sins, and to cleanse us from all unrighteousness."* — 1 John 1:9

Tapping the promise advances. You leave that movement washed, not condemned.

### Movement 9 — no exit

Movement 9 has no continue affordance at any point. The only element is **"He spoke"** — small, bottom of screen — which opens the journal composer with the mic ready.

### Ending a session

A quiet **"End for now"** sits in the corner of every movement. It ends the session and returns home — it can never advance you to the next movement, so the floor is untouched. Stopping is always permitted; hurrying never is. Without it the app traps someone who genuinely has to go, and an altar you cannot leave is a cage, not a discipline.

### Configurability

The movements are a plain array at the top of the source file: title, body text, scripture, floor in seconds, optional release text. Editing the altar means editing that array. It is the user's altar, not the developer's.

## The Word, and the Study screen

**Study and tarrying are different activities and must not share a screen.** A tappable Greek word in movement 2 is a distraction engine wearing a holy face: tap a lexicon entry, then a cross-reference, then another, and a genuinely good Bible study has quietly replaced the altar. Hurry's cousin is curiosity.

Therefore:

- **Movement 2 shows the passage plainly.** Nothing tappable, nothing to chase. Read it slow, read it again, pray it back.
- **The Study screen is a separate entry point from the home screen** — used before a session, after one, or any time that isn't the altar.

### Texts

Two translations bundled offline, shown in parallel columns on the Study screen:

| Text | Why |
|------|-----|
| **KJV** | Unchanged since the 1769 Blayney edition and incapable of changing. The best Strong's tagging in existence. The text most Pentecostal preaching and hymnody is built on. |
| **BSB** (Berean Standard Bible) | Plain modern English that reads clearly at 5am. Ships with full Strong's tagging. |

Seeing one verse in two renderings is itself a form of amplification — which is what draws people to the AMP in the first place.

### Study features

- **Tap any word** → its Hebrew or Greek, the root, and every other place that word appears.
- **Tap a cross-reference** → jump there. Scripture interpreting Scripture.
- **"Read in AMP"** → opens the same passage on Bible Gateway. The Amplified Bible is copyrighted by The Lockman Foundation and cannot be bundled; linking out gives access to it with no licensing exposure and no bundled bytes.

### Pinning

Translations get revised — on the scale of decades, not constantly, but they do. The AMP was substantially revised in 2015; the NASB in 2020; the Berean project is actively maintained.

**Each bundled text is pinned to a specific dated edition, with its version string stored in the file.** A new edition cannot reach the phone unless the user chooses to update it.

This is the strongest argument for bundling over calling an API: an API can change the wording between the day God spoke through a verse and the day it gets read again. A file on the phone cannot.

**Verify current license terms for every bundled text before shipping a single verse.**

## The journal

Reachable from the home screen at any time via a **Write** button — not only at the end of a session. Dreams come at 3am; burdens come while driving.

- Free text. The iPhone keyboard's mic button provides dictation — no transcription API, no audio storage.
- One optional tag per entry: `prayer` · `burden` · `dream` · `word` · `conviction`. Tap to skip.
- The list filters by tag — so every dream ever logged is one tap away.
- **Export** dumps all entries as plain text, testimonies included. Prayers must never live only inside this code.

### Testimony

> *"And they overcame him by the blood of the Lamb, and by the word of their testimony."* — Rev 12:11

Marking an answer is not a checkbox. Every entry carries a **He answered** action; tapping it opens the composer with today's date prefilled and one question:

**What did He do?**

You speak or type it. That answer attaches to the original entry, which from then on renders as a pair — the burden as you wrote it, the testimony beneath it, with both dates. The gap between the two dates is visible: *asked 4 March, answered 19 September*.

A **Testimonies** view lists only entries that have an answer, newest first. That is the screen to open when faith is low — a page of your own words, in your own voice, proving He moved. This view is the reason the whole app exists; friction #3 is the one that compounds.

Entry shape: `{ id, created, text, tag, scripture, answer: { text, date } | null }`.

`scripture` stores the verse text **as it read that day**, plus its version string — not a reference to be re-looked-up later. A testimony written in 2026 must still read exactly the way it read when He said it.

## The daily reminder

**Constraint:** iOS provides no API for a web app to schedule a local notification. Web Push (iOS 16.4+) requires a server, a cron, and VAPID keys — infrastructure that can fail silently at exactly the moment it's being trusted.

**Approach:** the app generates a `.ics` calendar file — a daily-recurring event (`RRULE:FREQ=DAILY`) with a `VALARM` at the chosen time. The user picks a time in the app, taps once, and iOS Calendar owns the reminder from then on. Fires forever, works offline, no server, no silent failure mode.

Roughly fifteen lines of string generation and a `data:text/calendar` link. One-time setup.

## Technical shape

- **One HTML file.** No framework, no build step, no bundler.
- **No server, no account, no login, no sync, no cloud.**
- **Storage:** `localStorage`, a JSON array of entries `{ id, created, text, tag, scripture, answer }`.
- **Bible data:** KJV and BSB with Strong's tagging, plus a cross-reference set, bundled as static JSON and cached by the service worker. Sized and license-checked before bundling.
- **Hosting:** GitHub Pages (HTTPS required for home-screen install).
- **Install:** Share → Add to Home Screen. Real icon, fullscreen, no Safari chrome.
- **Offline:** a minimal service worker caching the single file.

### Showing up

Put the Tarry icon in the iPhone dock, in the slot a distraction app currently occupies. This solves friction #1 better than any notification, at zero lines of code.

## Explicitly not building

| Excluded | Why |
|----------|-----|
| Streaks | You start performing for the app instead of waiting on Him. |
| Push notification infrastructure | A reminder that can silently stop is worse than no reminder. |
| Accounts, sync, sharing | Nothing between you and Him that needs a password. |
| AI-generated prayers | Nothing between you and Him that has an opinion. |
| Bundled commentary | Same principle. Matthew Henry is a godly man with an opinion; Strong's and cross-references are the text pointing at itself. Also the heaviest data by far. |
| Study tools inside a movement | Study is a different activity. Mixing them replaces the altar with a search. |
| Audio/music library | Your existing worship playlist already works. |
| Native iOS app (v1) | Buys background audio and real local notifications, at the cost of a Mac, Xcode, $99/yr, and App Store review. Revisit only if soaking-with-screen-off proves essential. |

## Verification

One runnable self-check covering the non-trivial logic:

- Floor timing: continue is absent before the floor elapses, present after.
- Movement 5 releases via the 1 John 1:9 promise, not a continue label.
- Movement 8 exposes no advance affordance under any elapsed time.
- Journal round-trip: save → reload → entry survives with tag and attached testimony.
- Testimonies view lists exactly the entries with a non-null answer, and no others.
- `.ics` output parses and contains `RRULE:FREQ=DAILY` and a `VALARM` at the selected time.
- Movement 2 renders no tappable study affordance at any point in the session.
- A journal entry's stored `scripture` text is unchanged after the bundled translation data is swapped for a newer edition.
