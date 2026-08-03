# Tarry Review Concerns

Date: 2026-08-03

## Overall Read

Tarry is a strong first build. It is not just a generic prayer journal. The app has a clear spiritual thesis: slow down, wait before the Lord, pray, write, and remember what God answered.

The timed altar mechanic is the strongest part of the concept. It gives the app a real point of view and makes the experience feel more like a prayer closet than a productivity tool.

## What Is Working

- The app feels restrained, quiet, and focused.
- The "floor" mechanic is meaningful: release is withheld until time has passed.
- The final wait movement refuses to auto-complete, which reinforces the tarrying concept.
- The testimony loop is good: prayers can become answered records.
- The Study screen is serious for a first version: KJV, BSB, Strong's, cross-references, and an AMP link.
- The architecture is simple and strong: vanilla JavaScript, no dependencies, local Bible data, a service worker, and tests.
- The test suite currently passes.

## Main Concerns

### 1. The Session Can Feel Too Severe

The "wait has no way out" idea is spiritually bold, but as an app experience it can feel trapping. The app should invite surrender without making the user feel punished for needing to stop.

Recommended fix: keep the tarrying mechanic, but add a quiet escape path such as:

- "End for now"
- "Return home"
- "Close session"

This should not be visually dominant, but it should exist.

### 2. Mobile Study Layout May Feel Cramped

The Study screen currently uses two columns for KJV and BSB. On an iPhone, side-by-side Scripture columns will likely feel tight and hard to read.

Recommended fix: make Study mobile-first:

- Use tabs for KJV and BSB on small screens.
- Or stack the translations vertically.
- Keep side-by-side columns only for wider screens.

### 3. Muted Text Contrast Is Too Low

Some dim gray text does not appear to meet normal readability standards. This affects verse text, secondary navigation, labels, and other quieter UI elements.

Recommended fix:

- Raise the muted text color closer to the foreground color.
- Keep the quiet tone, but do not sacrifice readability.
- Add explicit focus-visible styles for keyboard and accessibility users.

### 4. Dark Soaking Mode May Be Too Hard To Read

The soaking/tongues mode lowers visible content opacity heavily. The atmosphere is fitting, but it may make the screen difficult to read, especially for low-vision users or in bright environments.

Recommended fix:

- Keep the dark atmosphere.
- Avoid dropping essential text to extremely low opacity.
- Consider fading only non-essential chrome instead of the actual movement text.

### 5. Journal Data Needs Better Protection

The journal stores deeply personal prayer content in localStorage. That is simple and private, but it is also fragile. A browser storage wipe, device issue, or reinstall could erase entries.

Recommended fix:

- Keep export.
- Add import.
- Add a clearer backup reminder in Settings.
- Consider optional encrypted backup later if the app becomes long-term.

### 6. Worship Could Be More Explicitly Centered On Jesus

The current flow includes stillness, Scripture, thanksgiving, confession, intercession, tongues/soaking, and waiting. It would be stronger if one movement were explicitly focused on adoration of Jesus as Lord and King.

Recommended fix: add a movement such as:

- "Behold the King"
- "Adore Jesus"
- "King of Kings"

The prompt should focus on worshiping Jesus for who He is, not only praying through needs.

## Recommended Next Steps

1. Add a quiet escape path from sessions.
2. Make Study responsive for iPhone screens.
3. Raise muted text contrast and add focus-visible styles.
4. Add journal import and clearer backup guidance.
5. Add one explicit worship/adoration movement centered on Jesus.

## Bottom Line

The foundation is good. Tarry has a soul. It just needs more grace, accessibility, and mobile polish before it feels ready to live on the iPhone dock every morning.
