# Bible data spike — license, source, size

**Date verified:** 2026-08-02
**Method:** every file below was actually downloaded (via `curl`) and measured locally (raw bytes + `gzip -9`), not estimated from a vendor's claimed size, except where explicitly marked "reported, not measured." All URLs are primary sources — the repo/site that actually holds the rights or does the tagging, not a third-party mirror's say-so.

**Bottom line up front:** All four data needs clear a verified license. The BSB fallback (WEB) was **not** needed — BSB's own site publishes a public-domain dedication and a genuine word-level Strong's alignment file. The KJV+Strong's dataset that actually exists is **not** `openscriptures/strongs` (that repo is the dictionary only) — it's the CrossWire Bible Society's OSIS-tagged KJV module, a different and better primary source than the plan named. One real license trap was found and avoided: a STEPBible file labeled "CC BY" turns out to require separate permission from a third party for its underlying content. Details below.

---

## 1. KJV with Strong's tagging

### What the plan named vs. what's actually authoritative

The plan pointed at `openscriptures/strongs` and STEPBible-Data as candidates for "KJV with Strong's." Neither is actually a KJV-text-with-Strong's-numbers dataset:

- `openscriptures/strongs` (checked via GitHub API, default branch `master`) contains **only** the Strong's Hebrew/Greek *dictionaries* — no Bible text at all. See §3.
- STEPBible-Data's `Translators Amalgamated OT+NT` folder contains `TAHOT`/`TAGNT` — the **Hebrew and Greek source text** tagged with Strong's numbers and an English gloss, not the KJV's actual English wording in KJV word order. Using it to build an English KJV-with-Strong's file would mean reconstructing KJV phrasing and versification from gloss data — a much bigger and riskier engineering job than the plan's `build-bible-data.mjs` sketch implies. License confirmed CC BY 4.0 (repo README: "STEPBible Data Repository **CC BY 4.0**", "Credit it to 'STEP Bible' linked to www.STEPBible.org"), so it remains a legitimate *fallback* for OT/NT tagging if the primary source below ever becomes unavailable, but it is not the practical first choice.

### The actual primary source: CrossWire Bible Society's KJV OSIS module

- **Repo (downloaded directly):** https://gitlab.com/crosswire-bible-society/kjv — file `kjv.osis.xml`
- **Module documentation:** https://wiki.crosswire.org/CrossWire_KJV
- **Module conf (fetched directly):** https://www.crosswire.org/ftpmirror/pub/sword/raw/mods.d/kjv.conf

This is the real, machine-readable, word-tagged KJV. Confirmed by direct inspection of the downloaded XML — Genesis 1:1:

```xml
<w lemma="strong:H07225">In the beginning</w> <w lemma="strong:H0430">God</w>
<w morph="strongMorph:TH8804" lemma="strong:H0853 strong:H01254">created</w>
<w lemma="strong:H08064">the heaven</w> <w lemma="strong:H0853">and</w> <w lemma="strong:H0776">the earth</w>.
```

and John 3:16 (Greek, including function words with no separate English rendering, marked as empty `<w>` elements):

```xml
<w src="17" lemma="strong:G3588 lemma.TR:ο" morph="robinson:T-NSM"/>
<w src="2" lemma="strong:G1063 lemma.TR:γαρ" morph="robinson:CONJ">For</w>
<w src="4 5" lemma="strong:G3588 strong:G2316 ..." morph="...">God</w> ...
```

**Gotcha for Task 12:** Hebrew Strong's numbers here are zero-padded to 4 digits (`H07225`), while the openscriptures dictionary (§3) keys are unpadded (`H7225`). Must strip leading zeros when joining token → dictionary entry. Also note some `<w>` tags are empty (self-closing, no English text) — untranslated Greek function words — the conversion script must skip these rather than emit blank tokens.

### License — quoted verbatim from `kjv.conf` (the module's own authoritative metadata, fetched 2026-08-02)

> "This is the King James Version of the Holy Bible (also known as the Authorized Version) with embedded Strong's Numbers. **The rights to the base text are held by the Crown of England.** The Strong's numbers in the OT were obtained from The Bible Foundation... The NT Strong's data was obtained from The KJV2003 Project at CrossWire... **Any copyright that might be obtained for this effort is held by CrossWire Bible Society © 2003-2023 and CrossWire Bible Society hereby grants a general public license to use this text for any purpose.**"
>
> `DistributionLicense=GPL`
> `TextSource=https://gitlab.com/crosswire-bible-society/kjv`

So there are two separate license facts here, exactly as the task warned to distinguish:

1. **The underlying KJV text (1769 Oxford/Blayney edition):** public domain in the United States. **Under perpetual Crown copyright in the United Kingdom** — rights vested in the Crown, printing administered under Letters Patent by Cambridge University Press, Oxford University Press, and Collins (confirmed via general web research: Cambridge's own "Rights and Permissions" page, https://www.cambridge.org/us/universitypress/bibles/about/rights-and-permissions, and multiple independent explainers). The Berne Convention does not recognize Crown copyright, which is why the KJV is treated as public domain outside the UK. **This nuance is recorded, not papered over**, per the task's explicit instruction — it does not block a US-hosted GitHub Pages app, but it is real and it is the Crown's, not nobody's.
2. **The Strong's tagging/OSIS markup effort:** CrossWire Bible Society explicitly grants "a general public license to use this text for any purpose," `DistributionLicense=GPL`.

**Verdict: VERIFIED.** Both the base text and the tagging effort clear for redistribution inside an offline app.

### Measured size

| File | Raw | Gzipped |
|---|---|---|
| `kjv.osis.xml` (full OT+NT, OSIS XML w/ Strong's + morphology + notes + headings) | 28,043,075 B (26.75 MB) | 4,124,494 B (3.93 MB) |

This is the **source** file (before Task 12 strips notes/headings/morphology down to the canonical `{t,s}` shape) — the final `data/kjv/*.json` will differ from this number; see §5.

---

## 2. BSB text (and Strong's tagging for it)

**Source pages (fetched directly, 2026-08-02):**
- https://berean.bible/downloads.htm — download index
- https://berean.bible/terms.htm — terms and conditions (dated 2023-04-30)
- https://berean.bible/licensing.htm — licensing summary
- Direct files: `https://bereanbible.com/bsb.txt` (plain verse text), `https://bereanbible.com/bsb_tables.tsv` (word-level Hebrew/Greek + Strong's + English alignment)

### License — quoted verbatim from `berean.bible/terms.htm`

> "Terms and Conditions: April 30, 2023. **The Berean Bible and Majority Bible texts are officially dedicated to the public domain as of April 30, 2023. All uses are freely permitted.**"
>
> Attribution Notice (appreciated but not required): "The Holy Bible, Berean Standard Bible, BSB is produced in cooperation with Bible Hub, Discovery Bible, OpenBible.com, and the Berean Bible Translation Committee. This text of God's Word has been dedicated to the public domain."
>
> "By definition all public domain materials may be freely reproduced, integrated, and adapted for both free and commercial resources... **Developers and Publishers are now free to produce and sell the full Berean Bible in any print format.**"

Also embedded as a header comment inside the downloaded `bsb.txt` itself:

> "The Holy Bible, Berean Standard Bible, BSB is produced in cooperation with Bible Hub, Discovery Bible, unfoldingWord, Bible Aquifer, OpenBible.com, and the Berean Bible Translation Committee. This text of God's Word has been dedicated to the public domain."

**Verdict: VERIFIED public domain, redistribution inside an app explicitly permitted, no required attribution (a credit line is easy and appropriate to include anyway).** The plan's fallback (World English Bible) was **not needed** — recorded here per the instructions, but no WEB data was downloaded since it wasn't required.

### Resolving one apparent conflict, explicitly

An initial general web search returned a snippet claiming "The Holy Bible, Berean Interlinear Bible, BIB is copyrighted by Bible Hub." This looked like it might contradict the public-domain dedication above, so it was checked directly rather than accepted at face value:

- `interlinearbible.com` (the Berean Interlinear Bible's own domain) was fetched directly. It uses the **identical site template, navigation, and Terms-and-Conditions link** as `berean.bible`, and lists "Berean Interlinear Bible" as one of the "Berean Translations" family alongside Berean Standard Bible, Berean Literal Bible, and Berean Annotated Bible. `berean.bible/terms.htm` itself explicitly links to `interlinearbible.com` as one of its own properties.
- Conclusion: the "copyrighted by Bible Hub" snippet most likely reflects a stale or generic site-wide notice on `biblehub.com` (a much larger, older site that also hosts many *other*, genuinely copyrighted translations, and is a separate domain from `interlinearbible.com`/`bereanbible.com`). It is **not** describing the Berean Interlinear Bible product itself, which the primary terms page places under the same 2023 public-domain dedication.
- Because our actual data source is `bereanbible.com`'s own `bsb_tables.tsv` file — not scraped from `biblehub.com` — this doesn't block anything. Flagged here as a loose end worth a final glance before Task 12 ships, not as a blocker.

### Does BSB actually have Strong's tagging? (the plan's critical question)

**Yes — confirmed by direct download and inspection.** `bsb_tables.tsv`, downloaded from `bereanbible.com`'s own official downloads page, is a genuine word-level alignment table. Sample row (Genesis 1:1, tab-separated, columns abridged for readability):

```
Heb Sort  Str Heb  Verse          BSB version
1         7225     Genesis 1:1     In the beginning
3         430      Genesis 1:1     God
4         853      Genesis 1:1     -
2         1254     Genesis 1:1     created
5         8064     Genesis 1:1     the heavens
6         853      Genesis 1:1     and
7         776      Genesis 1:1     the earth
```

Each row carries the Hebrew/Greek word, transliteration, full parsing, the plain Strong's number (`Str Heb` / `Str Grk` — bare numeric, no `H`/`G` prefix, so both columns need the prefix added and only one will be populated per row), and the aligned BSB English rendering.

**This directly answers the plan's critical question in the affirmative: a freely-licensed, Strong's-tagged, modern-English Bible text does exist and is downloadable today.** It is not, however, a drop-in file — see the engineering note below.

**Engineering note for Task 12 (not this task, but worth recording now):** the table is ordered by *original-language* word position, not English reading order, and English phrases sometimes span multiple source-language rows or are blank (untranslated function words, marked `-`). Turning this into one Strong's code per English token, in English reading order, is real alignment work — a `split(' ')` will not do it. This is a bigger lift than the one-page pipeline sketch in the plan's Task 12, and whoever picks up Task 12 should budget for that.

### Measured size

| File | Raw | Gzipped |
|---|---|---|
| `bsb.txt` (plain verse text, both testaments) | 4,331,393 B (4.13 MB) | 1,334,864 B (1.27 MB) |
| `bsb_tables.tsv` (word-level Strong's alignment, both testaments) | 35,559,985 B (33.91 MB) | 6,572,068 B (6.27 MB) |

---

## 3. Strong's dictionary

**Source (downloaded directly, 2026-08-02):** https://github.com/openscriptures/strongs — files `hebrew/strongs-hebrew-dictionary.js`, `greek/strongs-greek-dictionary.js`

Checked via the GitHub API directly: this repository has **no LICENSE file and no README.md** (`repos/openscriptures/strongs` → `"license": null`; `contents/` listing has no README). The only license statement anywhere in the repo is a header comment embedded in the data files themselves:

```
/**
 * A Concise Dictionary of the Words in the Hebrew Bible
 *    with their Renderings in the King James Version
 * by James Strong, LL.D., S.T.D.
 * 1894
 *
 * JSON version
 * ============
 * Copyright 2010, Open Scriptures. CC-BY-SA. Derived from XML.
 ...
```

(The Greek file carries the identical pattern: "Copyright 2009, Open Scriptures. CC-BY-SA. Derived from XML.")

Two license facts, again kept separate per the task's instruction:

1. **Underlying dictionary text:** James Strong's *Strong's Exhaustive Concordance* dictionaries, published 1890/1894. **Public domain** in the US by age (author died 1894; nothing this old and unrenewed carries US copyright).
2. **The Open Scriptures JSON/JS encoding of it:** **CC BY-SA**, per the embedded comment — attribution *and* share-alike required for this specific dataset. This is **not** a formal repository LICENSE file, just a comment the maintainers left in the file, so treat it as the best available (and only) statement of intent rather than a lawyer-reviewed license grant.

**Also noted, not glossed over:** the same repository ships a *different* derivative, `strongs-dictionary.xhtml` ("Unified Strong's Dictionaries... alpha release"), whose own header states **GPL 3.0** — a different license than the JS files, in the same repo. This repo's licensing is internally inconsistent across its own files. Since Task 12 would use the JS/JSON dictionary files (matching the canonical `data/strongs.json` shape), **CC BY-SA is the license that applies to what we'd actually bundle.**

**Verdict: VERIFIED, but the correct label is "CC BY-SA dataset built on public-domain 1890s text," not plain "public domain."** Recommend crediting Open Scriptures + James Strong in `VERSIONS.json` and wherever else licenses are surfaced, to satisfy the attribution term.

### A real license trap that was checked and avoided

STEPBible-Data's `Lexicons/TBESH - ... - STEPBible.org CC BY.txt` looked like a cleaner-licensed alternative (filename literally says "CC BY," and the repo README confirms **CC BY 4.0** at the repository level). Downloading and reading the file's own header revealed a catch the filename doesn't disclose:

> "The Brief lexicon is based on **Abridged BDB by Online Bible**, and edited to conform with the extended Strongs. This is provided for guidance only. **Permission should be gained from Online Bible before these definitions are applied in any project.**"

So the STEPBible **tagging/compilation** is CC BY 4.0, but the **dictionary definitions themselves** are a third party's ("Online Bible") copyrighted abridgment of BDB, requiring separate permission STEPBible cannot grant on Online Bible's behalf. This is exactly the "dataset license vs. underlying text license" distinction the task warned about, and it's why **`openscriptures/strongs` (built directly on the public-domain 1890s Strong's text, no third-party middleman) is the safer and recommended choice for the dictionary**, despite STEPBible's cleaner-looking top-level license.

### Measured size

| File | Raw | Gzipped |
|---|---|---|
| `strongs-hebrew-dictionary.js` | 2,003,130 B (1.91 MB) | 506,411 B (0.48 MB) |
| `strongs-greek-dictionary.js` | 1,200,839 B (1.15 MB) | 369,512 B (0.35 MB) |

---

## 4. Cross-references

**Source (downloaded directly, 2026-08-02):** https://www.openbible.info/labs/cross-references/ → https://a.openbible.info/data/cross-references.zip → `cross_references.txt`

### License

Page footer (fetched directly): "This data draws primarily from public-domain sources, especially the Treasury of Scripture Knowledge... Unless otherwise indicated, all content is licensed under a **Creative Commons Attribution License**." The link target was checked directly rather than assumed: `href="http://creativecommons.org/licenses/by/4.0/"` — **CC BY 4.0**, exactly as the plan expected. The downloaded data file itself carries a matching header line: `#www.openbible.info CC-BY 2026-07-27`.

**Attribution requirement:** the page states no specific suggested credit string beyond the license link itself. Recommended plain-language attribution for `VERSIONS.json` / an about screen: *"Cross-reference data: openbible.info, CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/), drawing primarily from the Treasury of Scripture Knowledge."*

**Verdict: VERIFIED CC BY 4.0.**

### Format note for Task 12

The raw file is `From Verse / To Verse / Votes` (e.g. `Gen.1.1  Ps.33.6  66`), a flat weighted edge list (~340,000 rows per the source page), not pre-grouped per verse and not filtered by strength. Task 12 will need to pick a votes threshold or a max-per-verse cap when collapsing this into the canonical `"book.chapter.verse": [...]` shape, or `xrefs.json` will bloat with low-signal cross-references (some rows carry negative votes, e.g. `Gen.1.1  Exod.31.18  -38`, meaning the community-sourced weighting explicitly down-ranks some pairings).

### Measured size

| File | Raw | Gzipped |
|---|---|---|
| `cross_references.txt` (unzipped) | 8,301,787 B (7.92 MB) | 1,981,801 B (1.89 MB) |
| `cross-references.zip` (as published) | 1,981,973 B (1.89 MB) — matches the page's stated "2 MB .zip" | — |

---

## 5. Size rollup and caching decision

Sum of **measured** gzipped sizes of the raw source datasets identified above (before Task 12 converts them into the canonical per-book shape):

| Source | Gzipped |
|---|---|
| `kjv.osis.xml` | 4,124,494 B |
| `bsb_tables.tsv` | 6,572,068 B |
| `bsb.txt` | 1,334,864 B |
| `strongs-hebrew-dictionary.js` | 506,411 B |
| `strongs-greek-dictionary.js` | 369,512 B |
| `cross_references.txt` | 1,981,801 B |
| **Total** | **14,889,150 B ≈ 14.89 MB** |

This sits right at the plan's ~15 MB line — **and this is the raw, pre-conversion source material**, not the final `data/kjv/*.json` / `data/bsb/*.json` that Task 12 will actually produce. The final canonical files will differ in both directions: they'll drop a lot of dead weight these sources carry (Hebrew/Greek script, transliteration, full morphological parse strings, footnotes, headings, versification apparatus, duplicate columns) but will add back JSON key/value overhead per token (`{"t":"…","s":"…"}` per word instead of whitespace-separated text). Which effect wins is genuinely not knowable until Task 12's script exists and runs — this is not a number to guess at.

**Decision: precache only the small, universally-needed files; fetch book text on demand.**

Given the raw sources already sit at ~14.9 MB before any conversion, given the app only ever needs a couple of books open in a session (not all 66 at once), and given the service worker's existing cache-first `fetch` handler already keeps every book permanently once a user visits it, the conservative choice is:

- **Precache in `sw.js`:** `data/VERSIONS.json`, `data/strongs.json`, `data/xrefs.json` — combined gzipped size will be on the order of the measured dictionary+xref numbers above (≈ 2.8 MB gzipped for the raw sources; likely smaller once trimmed to just `{lemma, translit, def}` per entry and a votes-filtered xref map).
- **Do not precache** `data/kjv/*.json` or `data/bsb/*.json`. Let the existing cache-first handler pick each book up the first time it's opened, exactly as the plan's Task 16 fallback branch describes.

**Action for whoever runs Task 16:** re-measure the actual gzipped size of the finished `data/` directory once Task 12 exists. Only switch to full precache (the plan's other branch) if that *measured* number is comfortably under 15 MB — don't flip the strategy on the estimate above.

---

## 6. Answering the plan's explicit critical question

> Does a freely-licensed, Strong's-tagged, modern-English text actually exist and is it downloadable right now?

**Yes.** The Berean Standard Bible's own official site (`bereanbible.com`, operated by the Berean Bible Translation Committee) publishes `bsb_tables.tsv` — a real, word-level Hebrew/Greek-to-English alignment table carrying a Strong's number per source word — under an explicit public-domain dedication dated 2023-04-30, confirmed by direct download and inspection, not taken on a third party's word. This was the design's central open assumption ("Task 12 will convert whatever you identify... The BSB's interlinear/Strong's data is the assumption in the plan — verify it rather than assuming"), and it holds up.

The caveat that matters for planning, not licensing: the data is **not** already in per-English-word, reading-order form. It's aligned to source-language word order and needs real conversion work (see §2's engineering note). The plan's one-page `build-bible-data.mjs` sketch understates that effort; Task 12 should budget more time for the BSB alignment step than for the KJV step, where the CrossWire OSIS file already carries Strong's numbers as inline word-order tags ready to walk linearly.

---

## 7. Sources actually downloaded and measured (for re-verification)

- https://gitlab.com/crosswire-bible-society/kjv (raw file `kjv.osis.xml`)
- https://wiki.crosswire.org/CrossWire_KJV
- https://www.crosswire.org/ftpmirror/pub/sword/raw/mods.d/kjv.conf
- https://berean.bible/terms.htm
- https://berean.bible/licensing.htm
- https://berean.bible/downloads.htm
- https://bereanbible.com/bsb.txt
- https://bereanbible.com/bsb_tables.tsv
- https://interlinearbible.com/ (spot-check of site identity, see §2)
- https://github.com/openscriptures/strongs (`hebrew/strongs-hebrew-dictionary.js`, `greek/strongs-greek-dictionary.js`, `strongs-dictionary.xhtml`)
- https://github.com/STEPBible/STEPBible-Data (README.md, `Lexicons/TBESH...txt`, `Translators Amalgamated OT+NT/` listing)
- https://www.openbible.info/labs/cross-references/
- https://a.openbible.info/data/cross-references.zip

### Also checked and explicitly ruled out as the KJV+Strong's / BSB+Strong's source

- `scrollmapper/bible_databases` (https://github.com/scrollmapper/bible_databases, MIT-licensed *compilation* — the license on this repo covers the scripts/schema, not the underlying Bible texts it repackages). Its current `master` branch lists a translation labeled "KJV: King James Version (1769) with Strongs Numbers and Morphology and CatchWords," but the actual `formats/json/KJV.json` file downloaded and inspected **contains no Strong's numbers or morphology at all** — verse text only (`grep` for `H[0-9]` and the literal string `strongs` across the full 8.4 MB file: zero matches). The translation *label* is inherited from the original e-Sword module metadata; the tagging itself did not survive this project's conversion pipeline (per its own `docs/4_adding_texts.md`, texts are extracted from e-Sword `.zip` modules via `pysword`, which is a plain-text extraction path). **Not used** — this is why the CrossWire OSIS source (§1) was pursued instead and is the one actually recommended.

### Not needed

- World English Bible (WEB) — the plan's designated fallback if BSB failed. BSB cleared both the license and Strong's-data-availability checks, so WEB was not downloaded or measured. If it's ever needed: eBible.org states plainly it is public domain ("World English Bible is a Trademark of eBible.org... if you CHANGE the actual text... you not call the result the World English Bible"), but no Strong's-tagged WEB dataset was located or verified in this spike — that would need its own check if BSB is ever dropped.
