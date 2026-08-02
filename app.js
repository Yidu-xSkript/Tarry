import { MOVEMENTS, releaseState, TAGS, addEntry, answerEntry,
         testimonies, byTag, toPlainText, icsFor } from './lib.js';

// ponytail: ?fast=2 shrinks every floor to 2 seconds so the whole altar can be
// walked in a minute. The Wait still never releases — that is not a floor.
// Ship-safe: without the query param the real floors are untouched.
const fast = Number(new URLSearchParams(location.search).get('fast'));
if (fast > 0) {
  MOVEMENTS.forEach(m => { if (m.floor !== null) m.floor = fast; });
  document.body.classList.add('fast');   // shorten the fade too, or testing crawls
}

const $ = sel => document.querySelector(sel);
const screens = [...document.querySelectorAll('.screen')];

function show(id) {
  screens.forEach(s => { s.hidden = s.id !== id; });
  document.body.classList.remove('dark');
  window.scrollTo(0, 0);
}

document.querySelectorAll('[data-goto]').forEach(b =>
  b.addEventListener('click', () => show(b.dataset.goto)));

show('home');

let mIndex = 0;
let mStart = 0;
let tick = null;

function enterMovement(i) {
  mIndex = i;
  mStart = performance.now();
  const m = MOVEMENTS[i];

  $('#m-title').textContent = m.title;
  $('#m-body').textContent = m.body;
  $('#m-passage').textContent = '';
  document.body.classList.toggle('dark', !!m.dark);

  // Both exits start hidden. Only time reveals one of them.
  const release = $('#release');
  release.hidden = true;
  release.classList.remove('shown');
  $('#he-spoke').hidden = true;

  show('session');
  if (m.dark) document.body.classList.add('dark');
  if (m.passage) loadSessionPassage(m.passage);

  clearInterval(tick);
  tick = setInterval(() => {
    const state = releaseState(m, performance.now() - mStart);
    if (state.released) {
      release.textContent = state.label;
      release.hidden = false;
      requestAnimationFrame(() => release.classList.add('shown'));
      clearInterval(tick);
    }
  }, 1000);

  // The wait has no way out. The only thing offered is the mic.
  if (m.floor === null) {
    const spoke = $('#he-spoke');
    spoke.hidden = false;
    requestAnimationFrame(() => spoke.classList.add('shown'));
  }
}

$('#begin').addEventListener('click', () => enterMovement(0));

$('#release').addEventListener('click', () => {
  if (mIndex + 1 < MOVEMENTS.length) enterMovement(mIndex + 1);
});

$('#he-spoke').addEventListener('click', () => {
  clearInterval(tick);
  openComposer();
});

let VERSIONS = {};
fetch('data/VERSIONS.json').then(r => r.json()).then(v => { VERSIONS = v; }).catch(() => {});

let sessionScripture = null;   // snapshotted onto any entry written this session

async function loadSessionPassage(refString) {
  const ref = parseRef(refString);
  if (!ref?.verse) return;
  try {
    const book = await loadBook('bsb', ref);
    const text = plainVerse(book[ref.chapter], ref.verse);
    if (!text) return;
    // Deliberately plain text, not tokens: nothing here is tappable. Study is a
    // different activity and must not follow you onto the altar.
    $('#m-passage').textContent = text;
    sessionScripture = {
      text,
      ref: `${ref.book} ${ref.chapter}:${ref.verse}`,
      version: VERSIONS.bsb?.name ?? 'bsb',
    };
  } catch { /* no signal and not yet cached; the movement still works without it */ }
}

const KEY = 'tarry.entries';

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) ?? []; }
  catch { return []; }   // never let corrupt storage block prayer
}

function save(entries) {
  localStorage.setItem(KEY, JSON.stringify(entries));
}

const today = () => new Date().toISOString().slice(0, 10);
const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

let pendingTag = null;
let answeringId = null;   // set when the composer is capturing a testimony

function renderTags() {
  $('#tag-chips').innerHTML = '';
  TAGS.forEach(t => {
    const b = document.createElement('button');
    b.className = 'chip' + (pendingTag === t ? ' on' : '');
    b.textContent = t;
    b.addEventListener('click', () => { pendingTag = pendingTag === t ? null : t; renderTags(); });
    $('#tag-chips').append(b);
  });
}

function openComposer({ answerFor = null } = {}) {
  answeringId = answerFor;
  $('#entry-text').value = '';
  pendingTag = null;
  $('#journal h2').textContent = answerFor ? 'What did He do?' : 'Write';
  $('#tag-chips').hidden = !!answerFor;
  renderTags();
  show('journal');
  renderEntries();
  $('#entry-text').focus();
}

$('#save-entry').addEventListener('click', () => {
  const text = $('#entry-text').value.trim();
  if (!text) return;
  const entries = answeringId
    ? answerEntry(load(), answeringId, text, today())
    : addEntry(load(), { id: newId(), created: today(), text, tag: pendingTag, scripture: sessionScripture });
  save(entries);
  answeringId = null;
  $('#entry-text').value = '';
  pendingTag = null;
  $('#journal h2').textContent = 'Write';
  $('#tag-chips').hidden = false;
  renderTags();
  renderEntries();
});

function entryNode(e) {
  const div = document.createElement('div');
  div.className = 'entry';
  div.innerHTML = `<div class="when">${e.created}${e.tag ? ` · ${e.tag}` : ''}</div>`;
  const body = document.createElement('p');
  body.textContent = e.text;
  div.append(body);

  if (e.answer) {
    const ans = document.createElement('div');
    ans.className = 'answer';
    ans.innerHTML = `<div class="when">answered ${e.answer.date}</div>`;
    const at = document.createElement('p');
    at.textContent = e.answer.text;
    ans.append(at);
    div.append(ans);
  } else {
    const btn = document.createElement('button');
    btn.textContent = 'He answered';
    btn.addEventListener('click', () => openComposer({ answerFor: e.id }));
    div.append(btn);
  }
  return div;
}

let filterTag = null;

function renderEntries() {
  const list = $('#entry-list');
  list.innerHTML = '';
  byTag(load(), filterTag).slice().reverse().forEach(e => list.append(entryNode(e)));
}

function renderTestimonies() {
  const list = $('#testimony-list');
  list.innerHTML = '';
  const t = testimonies(load());
  if (!t.length) {
    list.textContent = 'Nothing here yet. Keep asking.';
    return;
  }
  t.forEach(e => list.append(entryNode(e)));
}

document.querySelector('[data-goto="journal"]').addEventListener('click', () => openComposer());
document.querySelector('[data-goto="testimony"]').addEventListener('click', renderTestimonies);

function download(filename, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

$('#export').addEventListener('click', () => {
  download(`tarry-${today()}.txt`, toPlainText(load()), 'text/plain');
});

$('#make-ics').addEventListener('click', () => {
  const start = today().replaceAll('-', '');
  download('tarry.ics', icsFor($('#reminder-time').value, start), 'text/calendar');
});

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');

import { parseRef, refToPath, bibleGatewayUrl, plainVerse, BOOKS, bookName } from './lib.js';

const bookCache = new Map();

async function loadBook(version, ref) {
  const path = refToPath(version, ref);
  if (!bookCache.has(path)) {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`no such book: ${ref.book}`);
    bookCache.set(path, await res.json());
  }
  return bookCache.get(path);
}

let strongs = null;
async function loadStrongs() {
  if (!strongs) strongs = await (await fetch('data/strongs.json')).json();
  return strongs;
}

function renderColumn(version, chapter, ref) {
  const col = document.createElement('div');
  col.innerHTML = `<h3>${version.toUpperCase()}</h3>`;
  const verses = ref.verse ? { [ref.verse]: chapter[ref.verse] } : chapter;
  for (const [n, tokens] of Object.entries(verses)) {
    if (!tokens) continue;
    const p = document.createElement('p');
    p.innerHTML = `<span class="when">${n}</span> `;
    tokens.forEach(tok => {
      const s = document.createElement('span');
      s.className = 'tok';
      s.textContent = tok.t + ' ';
      if (tok.s) { s.dataset.s = tok.s; }
      p.append(s);
    });
    col.append(p);
  }
  return col;
}

// --- the picker: book, chapter, verse. Native <select>, so iOS gives its own
// wheel and there is no dropdown widget to build or maintain.

function fillSelect(sel, values, labelFor = v => v) {
  sel.innerHTML = '';
  for (const v of values) {
    const o = document.createElement('option');
    o.value = v;
    o.textContent = labelFor(v);
    sel.append(o);
  }
}

function currentRef() {
  return {
    book: $('#sel-book').value,
    chapter: $('#sel-chapter').value,
    verse: $('#sel-verse').value || null,
  };
}

async function fillChapters(keepChapter) {
  const book = await loadBook('kjv', { book: $('#sel-book').value });
  const chapters = Object.keys(book).sort((a, b) => a - b);
  fillSelect($('#sel-chapter'), chapters, n => `Chapter ${n}`);
  if (keepChapter && chapters.includes(keepChapter)) $('#sel-chapter').value = keepChapter;
  return book;
}

async function fillVerses(keepVerse) {
  const book = await loadBook('kjv', { book: $('#sel-book').value });
  const verses = Object.keys(book[$('#sel-chapter').value] ?? {}).sort((a, b) => a - b);
  fillSelect($('#sel-verse'), ['', ...verses], v => (v ? `Verse ${v}` : 'Whole chapter'));
  if (keepVerse && verses.includes(keepVerse)) $('#sel-verse').value = keepVerse;
}

// Used by the cross-reference buttons: jump the picker somewhere and render it.
async function goTo(book, chapter, verse) {
  $('#sel-book').value = book;
  await fillChapters(chapter);
  await fillVerses(verse);
  await openStudy();
  // The cross references sit below the text, so a jump made from down there
  // renders off-screen and looks like nothing happened.
  window.scrollTo(0, 0);
}

fillSelect($('#sel-book'), BOOKS.map(b => b.key), bookName);
$('#sel-book').value = 'john';

// ponytail: one wrapper so a failed fetch lands on screen instead of dying
// silently in an unhandled promise rejection. Invisible failure is the worst
// kind — it looks like the feature was never built.
const guarded = fn => async (...args) => {
  try { await fn(...args); }
  catch (err) { $('#study-cols').textContent = `Could not load the text: ${err.message}`; }
};

$('#sel-book').addEventListener('change', guarded(async () => {
  await fillChapters(); await fillVerses(); await openStudy();
}));
$('#sel-chapter').addEventListener('change', guarded(async () => {
  await fillVerses(); await openStudy();
}));
$('#sel-verse').addEventListener('change', guarded(openStudy));

async function openStudy() {
  const ref = currentRef();
  const cols = $('#study-cols');
  cols.innerHTML = '';

  // Say plainly where we are. Without it, a jump to another passage is silent.
  const human = `${bookName(ref.book)} ${ref.chapter}${ref.verse ? `:${ref.verse}` : ''}`;
  $('#study-where').textContent = human;

  // Bible Gateway wants a human reference, not our filename key.
  $('#amp-link').href = bibleGatewayUrl({ ...ref, book: bookName(ref.book) });

  for (const version of ['kjv', 'bsb']) {
    try {
      const book = await loadBook(version, ref);
      const chapter = book[ref.chapter];
      if (!chapter) throw new Error('no such chapter');
      cols.append(renderColumn(version, chapter, ref));
    } catch (err) {
      const col = document.createElement('div');
      col.innerHTML = `<h3>${version.toUpperCase()}</h3>`;
      col.append(Object.assign(document.createElement('p'), { textContent: err.message }));
      cols.append(col);
    }
  }

  await renderXrefs(ref);
}

// Opening Study fills the chapter and verse menus. Selecting a book that is
// already selected fires no change event, so this cannot be left to the user.
document.querySelector('[data-goto="study"]').addEventListener('click', guarded(async () => {
  if (!$('#sel-chapter').options.length) {
    await fillChapters('3');
    await fillVerses('16');
  }
  await openStudy();
}));

let xrefs = null;
async function loadXrefs() {
  if (!xrefs) xrefs = await (await fetch('data/xrefs.json')).json();
  return xrefs;
}

$('#study-cols').addEventListener('click', async e => {
  const code = e.target.dataset?.s;
  if (!code) return;
  const dict = await loadStrongs();
  const entry = dict[code];
  const panel = $('#strongs-panel');
  panel.hidden = false;
  panel.innerHTML = entry
    ? `<div class="when">${code}</div>
       <p><strong>${entry.lemma}</strong> · ${entry.translit}</p>
       <p>${entry.def}</p>
       <button id="close-strongs">Close</button>`
    : `<div class="when">${code}</div><p>Not in the dictionary.</p>
       <button id="close-strongs">Close</button>`;
  $('#close-strongs').addEventListener('click', () => { panel.hidden = true; });
});

function say(box, text) {
  box.append(Object.assign(document.createElement('p'), { textContent: text }));
}

async function renderXrefs(ref) {
  // Always render the heading. Vanishing silently reads as "broken", and about
  // 1,700 of the 31,102 verses genuinely have no cross references.
  const box = document.createElement('div');
  box.className = 'xrefs';
  box.innerHTML = '<h3>CROSS REFERENCES</h3>';
  $('#study-cols').append(box);

  if (!ref.verse) {
    say(box, 'Pick a single verse to see where else Scripture speaks to it.');
    return;
  }
  const map = await loadXrefs();
  const list = map[`${ref.book}.${ref.chapter}.${ref.verse}`] ?? [];
  if (!list.length) {
    say(box, 'No cross references for this verse.');
    return;
  }
  list.forEach(target => {
    const b = document.createElement('button');
    const [tb, tc, tv] = target.split('.');
    b.textContent = `${bookName(tb)} ${tc}:${tv}`;
    b.addEventListener('click', () => goTo(tb, tc, tv));
    box.append(b);
  });
}
