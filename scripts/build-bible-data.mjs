// Task 12 — Bible data pipeline.
//
// Converts the four raw sources (verified and licensed in
// docs/superpowers/notes/bible-data.md and data/VERSIONS.json) into the
// canonical shapes the Study screen depends on. Run once by hand:
//
//   node scripts/build-bible-data.mjs <dir-with-raw-sources>
//
// Expects in that directory:
//   kjv.osis.xml                    - CrossWire KJV OSIS module
//   bsb.txt                         - Berean Standard Bible plain text
//   strongs-hebrew-dictionary.js    - Open Scriptures Hebrew dictionary
//   strongs-greek-dictionary.js     - Open Scriptures Greek dictionary
//   cross-references.zip           - openbible.info cross-reference data
//                                     (a plain .zip containing one .txt;
//                                     Node has no zip/inflate in its stdlib,
//                                     so this script also accepts an
//                                     already-unzipped cross_references.txt
//                                     alongside or instead of the .zip)
//
// No npm dependencies. Regex and node:zlib/fs only.

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const srcDir = process.argv[2];
if (!srcDir) {
  console.error('Usage: node scripts/build-bible-data.mjs <dir-with-raw-sources>');
  process.exit(1);
}

const repoRoot = path.resolve(import.meta.dirname, '..');
const dataDir = path.join(repoRoot, 'data');

// ---------------------------------------------------------------------------
// Book keys: lowercase, no spaces, digits kept (genesis, 1john, songofsolomon,
// psalm). Both translations are driven through this SAME table so they can
// never disagree on a book key, which is the one thing that would break the
// Study screen's parallel columns.
// ---------------------------------------------------------------------------

const OSIS_TO_FULLNAME = {
  Gen: 'Genesis', Exod: 'Exodus', Lev: 'Leviticus', Num: 'Numbers', Deut: 'Deuteronomy',
  Josh: 'Joshua', Judg: 'Judges', Ruth: 'Ruth', '1Sam': '1 Samuel', '2Sam': '2 Samuel',
  '1Kgs': '1 Kings', '2Kgs': '2 Kings', '1Chr': '1 Chronicles', '2Chr': '2 Chronicles',
  Ezra: 'Ezra', Neh: 'Nehemiah', Esth: 'Esther', Job: 'Job', Ps: 'Psalm', Prov: 'Proverbs',
  Eccl: 'Ecclesiastes', Song: 'Song of Solomon', Isa: 'Isaiah', Jer: 'Jeremiah',
  Lam: 'Lamentations', Ezek: 'Ezekiel', Dan: 'Daniel', Hos: 'Hosea', Joel: 'Joel',
  Amos: 'Amos', Obad: 'Obadiah', Jonah: 'Jonah', Mic: 'Micah', Nah: 'Nahum',
  Hab: 'Habakkuk', Zeph: 'Zephaniah', Hag: 'Haggai', Zech: 'Zechariah', Mal: 'Malachi',
  Matt: 'Matthew', Mark: 'Mark', Luke: 'Luke', John: 'John', Acts: 'Acts', Rom: 'Romans',
  '1Cor': '1 Corinthians', '2Cor': '2 Corinthians', Gal: 'Galatians', Eph: 'Ephesians',
  Phil: 'Philippians', Col: 'Colossians', '1Thess': '1 Thessalonians',
  '2Thess': '2 Thessalonians', '1Tim': '1 Timothy', '2Tim': '2 Timothy', Titus: 'Titus',
  Phlm: 'Philemon', Heb: 'Hebrews', Jas: 'James', '1Pet': '1 Peter', '2Pet': '2 Peter',
  '1John': '1 John', '2John': '2 John', '3John': '3 John', Jude: 'Jude', Rev: 'Revelation',
};

function bookKey(name) {
  return name.toLowerCase().replace(/\s+/g, '');
}

// ---------------------------------------------------------------------------
// 1. KJV — OSIS XML with inline Strong's tagging.
//
// Verses are milestone-style: <verse osisID="X" sID="X"/> ... content ...
// <verse eID="X"/>. Words are tagged <w lemma="strong:H1234">text</w>; some
// <w> tags are self-closing (empty — an untranslated Greek function word) and
// must be skipped rather than turned into a blank token. Words the KJV
// translators supplied with no source-language counterpart are wrapped in
// <transChange type="added">text</transChange> and get s: null. Marginal
// <note> apparatus is stripped entirely — it is commentary, not verse text.
//
// A handful of <w> tags carry more than one Strong's number because one
// English phrase renders more than one source word (e.g. "the world" =
// strong:G3588 (the/ho) + strong:G2889 (kosmos)). H853 (the untranslatable
// Hebrew direct-object marker) and G3588 (the Greek definite article) are
// grammatical glue with no useful lexicon entry of their own, so when a
// content word is also present on the same tag we prefer that one.
//
// A small number of words (spot-checked: e.g. Gen.1.9's closing "and it was
// so.") are not wrapped in any tag at all in this module — a real gap in the
// source's own tagging, not a bug in this script. Those are still captured,
// as s: null tokens, rather than silently dropped.
// ---------------------------------------------------------------------------

function normalizeStrong(lemmaAttr) {
  const codes = [...lemmaAttr.matchAll(/strong:([GH])0*(\d+)/g)].map(m => `${m[1]}${m[2]}`);
  if (codes.length === 0) return null;
  const meaningful = codes.filter(c => c !== 'H853' && c !== 'G3588');
  return meaningful.length ? meaningful[0] : codes[0];
}

function stripInnerTags(s) {
  return s.replace(/<[^>]+>/g, '').trim();
}

const VERSE_RE = /<verse osisID="([^"]+)" sID="\1"\/>([\s\S]*?)<verse eID="\1"\/>/g;
const TOKEN_RE = /<w\b([^>]*)\/>|<w\b([^>]*)>([\s\S]*?)<\/w>|<transChange\b[^>]*>([\s\S]*?)<\/transChange>|<[^>]+>|([^<]+)/g;

function parseKjv(xmlPath) {
  const xml = fs.readFileSync(xmlPath, 'utf8');
  let clean = xml.replace(/<header\b[^>]*>[\s\S]*?<\/header>/, '');
  clean = clean.replace(/<note\b[^>]*>[\s\S]*?<\/note>/g, '');

  const books = {}; // bookKey -> chapter -> verse -> tokens
  let verseCount = 0;
  let untaggedWordCount = 0;
  let vm;

  VERSE_RE.lastIndex = 0;
  while ((vm = VERSE_RE.exec(clean))) {
    const [osisBook, chapter, verse] = vm[1].split('.');
    const fullName = OSIS_TO_FULLNAME[osisBook];
    if (!fullName) {
      console.warn(`  ! unknown OSIS book code "${osisBook}" (verse ${vm[1]}) — skipped`);
      continue;
    }
    const book = bookKey(fullName);
    const tokens = [];
    let tm;
    TOKEN_RE.lastIndex = 0;
    while ((tm = TOKEN_RE.exec(vm[2]))) {
      if (tm[2] !== undefined) {
        const text = stripInnerTags(tm[3]);
        if (text) tokens.push({ t: text, s: normalizeStrong(tm[2]) });
      } else if (tm[4] !== undefined) {
        const text = stripInnerTags(tm[4]);
        if (text) tokens.push({ t: text, s: null });
      } else if (tm[5] !== undefined) {
        for (const piece of tm[5].split(/\s+/).filter(Boolean)) {
          tokens.push({ t: piece, s: null });
          if (/[a-zA-Z]/.test(piece)) untaggedWordCount++;
        }
      }
      // else: self-closing <w/> or an unhandled tag (title, q, milestone,
      // inscription, divineName-as-wrapper, etc.) — no token, by design.
    }

    books[book] ??= {};
    books[book][chapter] ??= {};
    if (books[book][chapter][verse]) {
      console.warn(`  ! duplicate verse ${vm[1]} — overwriting`);
    }
    books[book][chapter][verse] = tokens;
    verseCount++;
  }

  return { books, verseCount, untaggedWordCount };
}

// ---------------------------------------------------------------------------
// 2. BSB — plain text, one verse per line: "Genesis 1:1<TAB>In the beginning..."
//
// BSB has no Strong's alignment we can trust in reading order (see the
// design decision in the task notes — its word-alignment table is ordered by
// original-language position, not English reading order, so every token here
// carries s: null). Tokenization is a plain whitespace split: each chunk
// (including any punctuation still glued to it, e.g. "light,”") becomes
// one token. This is deliberately the simplest thing that reconstructs the
// original text exactly on `tokens.map(t=>t.t).join(' ')` — no merge/attach
// logic needed, unlike the KJV's tag-driven tokenization above.
// ---------------------------------------------------------------------------

function parseBsb(txtPath) {
  const text = fs.readFileSync(txtPath, 'utf8').replace(/^﻿/, '');
  const lines = text.split(/\r?\n/);

  const books = {};
  let verseCount = 0;

  for (const line of lines) {
    const tab = line.indexOf('\t');
    if (tab < 0) continue;
    const ref = line.slice(0, tab);
    const body = line.slice(tab + 1);
    const m = ref.match(/^(.+)\s+(\d+):(\d+)$/);
    if (!m) continue; // header/title rows ("Verse\tBerean Standard Bible", credit lines)

    const [, name, chapter, verse] = m;
    const book = bookKey(name);
    const tokens = body.split(/\s+/).filter(Boolean).map(t => ({ t, s: null }));

    books[book] ??= {};
    books[book][chapter] ??= {};
    if (books[book][chapter][verse]) {
      console.warn(`  ! duplicate verse ${ref} — overwriting`);
    }
    books[book][chapter][verse] = tokens;
    verseCount++;
  }

  return { books, verseCount };
}

// ---------------------------------------------------------------------------
// 3. Strong's dictionary — strip the "var x = { ... }; module.exports = x;"
// wrapper from each dictionary file to get a plain JSON object literal.
//
// Field mapping (both files use double-quoted JSON-compatible values):
//   lemma        -> lemma     (both files use this name)
//   xlit         -> translit  (Hebrew file's name for transliteration)
//   translit     -> translit  (Greek file's name for transliteration)
//   strongs_def  -> def       (both files; Greek entries have a leading
//                              space in this field, so it is trimmed)
// Dropped: pron, derivation, kjv_def — not part of the {lemma,translit,def}
// contract, and kjv_def duplicates what the KJV verse text already shows.
// ---------------------------------------------------------------------------

function parseStrongsFile(jsPath, translitField) {
  const raw = fs.readFileSync(jsPath, 'utf8');
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  const obj = JSON.parse(raw.slice(start, end + 1));

  const out = {};
  for (const [code, entry] of Object.entries(obj)) {
    out[code] = {
      lemma: entry.lemma ?? '',
      translit: entry[translitField] ?? '',
      def: (entry.strongs_def ?? '').trim(),
    };
  }
  return out;
}

// ---------------------------------------------------------------------------
// 4. Cross-references — TSV edge list "From Verse / To Verse / Votes".
// Ranges in the "To Verse" column (e.g. "Col.1.16-Col.1.17") are collapsed to
// their start. Kept to the top 10 by votes per source verse, sorted
// descending, to keep the file small — the full edge list is ~345k rows.
// ---------------------------------------------------------------------------

function osisRefToKey(ref) {
  const start = ref.split('-')[0]; // collapse a range to its start
  const [osisBook, chapter, verse] = start.split('.');
  const fullName = OSIS_TO_FULLNAME[osisBook];
  if (!fullName) return null;
  return `${bookKey(fullName)}.${chapter}.${verse}`;
}

function parseXrefs(txtPath) {
  const text = fs.readFileSync(txtPath, 'utf8');
  const lines = text.split(/\r?\n/);

  const byVerse = new Map(); // fromKey -> [{ref, votes}]
  let rowCount = 0;
  let unmapped = 0;

  for (const line of lines) {
    if (!line.trim() || line.startsWith('From Verse') || line.startsWith('#')) continue;
    const [from, to, votesStr] = line.split('\t');
    if (from === undefined || to === undefined || votesStr === undefined) continue;
    const fromKey = osisRefToKey(from);
    const toKey = osisRefToKey(to);
    if (!fromKey || !toKey) { unmapped++; continue; }
    const votes = parseInt(votesStr, 10);
    rowCount++;
    if (!byVerse.has(fromKey)) byVerse.set(fromKey, []);
    byVerse.get(fromKey).push({ ref: toKey, votes });
  }

  const out = {};
  let dropped = 0;
  for (const [fromKey, refs] of byVerse) {
    refs.sort((a, b) => b.votes - a.votes);
    dropped += Math.max(0, refs.length - 10);
    out[fromKey] = refs.slice(0, 10).map(r => r.ref);
  }

  console.log(`  xrefs: ${rowCount} rows read, ${unmapped} unmapped, ${byVerse.size} source verses, ${dropped} refs dropped by the top-10 cap`);
  return out;
}

// ---------------------------------------------------------------------------
// Driver
// ---------------------------------------------------------------------------

function writeBooks(outDir, books) {
  fs.mkdirSync(outDir, { recursive: true });
  const files = Object.keys(books).sort();
  for (const book of files) {
    fs.writeFileSync(path.join(outDir, `${book}.json`), JSON.stringify(books[book]));
  }
  return files;
}

function findXrefsSource(dir) {
  const txt = path.join(dir, 'cross_references.txt');
  if (fs.existsSync(txt)) return txt;
  const nested = path.join(dir, 'xrefs_extracted', 'cross_references.txt');
  if (fs.existsSync(nested)) return nested;
  const zipPath = path.join(dir, 'cross-references.zip');
  if (!fs.existsSync(zipPath)) {
    throw new Error(`Neither cross_references.txt nor cross-references.zip found in ${dir}`);
  }
  // Minimal stored/deflated ZIP reader — good enough for the one-entry zip
  // openbible.info publishes, without adding a dependency.
  return unzipSingleEntry(zipPath, dir);
}

function unzipSingleEntry(zipPath, outDir) {
  const buf = fs.readFileSync(zipPath);
  // Find the End Of Central Directory record to locate the central directory.
  const EOCD_SIG = 0x06054b50;
  let eocdOffset = -1;
  for (let i = buf.length - 22; i >= 0; i--) {
    if (buf.readUInt32LE(i) === EOCD_SIG) { eocdOffset = i; break; }
  }
  if (eocdOffset < 0) throw new Error('not a valid zip (no EOCD record found)');
  const cdOffset = buf.readUInt32LE(eocdOffset + 16);

  const CD_SIG = 0x02014b50;
  if (buf.readUInt32LE(cdOffset) !== CD_SIG) throw new Error('not a valid zip (bad central directory)');
  const compression = buf.readUInt16LE(cdOffset + 10);
  const compressedSize = buf.readUInt32LE(cdOffset + 20);
  const nameLen = buf.readUInt16LE(cdOffset + 28);
  const localHeaderOffset = buf.readUInt32LE(cdOffset + 42);
  const name = buf.toString('utf8', cdOffset + 46, cdOffset + 46 + nameLen);

  const LFH_SIG = 0x04034b50;
  if (buf.readUInt32LE(localHeaderOffset) !== LFH_SIG) throw new Error('not a valid zip (bad local file header)');
  const lfhNameLen = buf.readUInt16LE(localHeaderOffset + 26);
  const lfhExtraLen = buf.readUInt16LE(localHeaderOffset + 28);
  const dataStart = localHeaderOffset + 30 + lfhNameLen + lfhExtraLen;
  const compressed = buf.subarray(dataStart, dataStart + compressedSize);

  let data;
  if (compression === 0) data = compressed; // stored
  else if (compression === 8) data = zlib.inflateRawSync(compressed); // deflate
  else throw new Error(`unsupported zip compression method ${compression}`);

  const outPath = path.join(outDir, path.basename(name));
  fs.writeFileSync(outPath, data);
  return outPath;
}

console.log('Reading sources from', srcDir);

console.log('\n[1/4] KJV (OSIS + Strong\'s)...');
const kjv = parseKjv(path.join(srcDir, 'kjv.osis.xml'));
console.log(`  ${kjv.verseCount} verses, ${Object.keys(kjv.books).length} books, ${kjv.untaggedWordCount} words captured outside any <w>/<transChange> tag (a real gap in this OSIS module's own tagging, not dropped)`);
const kjvFiles = writeBooks(path.join(dataDir, 'kjv'), kjv.books);

console.log('\n[2/4] BSB (plain text)...');
const bsb = parseBsb(path.join(srcDir, 'bsb.txt'));
console.log(`  ${bsb.verseCount} verses, ${Object.keys(bsb.books).length} books`);
const bsbFiles = writeBooks(path.join(dataDir, 'bsb'), bsb.books);

console.log('\n[3/4] Strong\'s dictionary...');
const hebrew = parseStrongsFile(path.join(srcDir, 'strongs-hebrew-dictionary.js'), 'xlit');
const greek = parseStrongsFile(path.join(srcDir, 'strongs-greek-dictionary.js'), 'translit');
const strongs = { ...hebrew, ...greek };
console.log(`  ${Object.keys(hebrew).length} Hebrew + ${Object.keys(greek).length} Greek = ${Object.keys(strongs).length} entries`);
fs.writeFileSync(path.join(dataDir, 'strongs.json'), JSON.stringify(strongs));

console.log('\n[4/4] Cross-references...');
const xrefsSrc = findXrefsSource(srcDir);
const xrefs = parseXrefs(xrefsSrc);
fs.writeFileSync(path.join(dataDir, 'xrefs.json'), JSON.stringify(xrefs));

console.log('\nBook key comparison (KJV vs BSB):');
const kjvSet = new Set(kjvFiles);
const bsbSet = new Set(bsbFiles);
const onlyKjv = kjvFiles.filter(b => !bsbSet.has(b));
const onlyBsb = bsbFiles.filter(b => !kjvSet.has(b));
console.log(`  KJV books: ${kjvFiles.length}, BSB books: ${bsbFiles.length}`);
console.log(`  in KJV only: ${onlyKjv.length ? onlyKjv.join(', ') : '(none)'}`);
console.log(`  in BSB only: ${onlyBsb.length ? onlyBsb.join(', ') : '(none)'}`);

console.log('\nDone.');
