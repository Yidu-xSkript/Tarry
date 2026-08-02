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

import { parseRef, refToPath, bibleGatewayUrl, plainVerse } from './lib.js';

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

async function openStudy() {
  const ref = parseRef($('#study-ref').value);
  const cols = $('#study-cols');
  cols.innerHTML = '';
  if (!ref) { cols.textContent = 'Try "john 3" or "1 John 4:9".'; return; }

  $('#amp-link').href = bibleGatewayUrl(ref);

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

$('#study-go').addEventListener('click', openStudy);
$('#study-ref').addEventListener('keydown', e => { if (e.key === 'Enter') openStudy(); });

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

async function renderXrefs(ref) {
  if (!ref.verse) return;
  const map = await loadXrefs();
  const list = map[`${ref.book}.${ref.chapter}.${ref.verse}`] ?? [];
  if (!list.length) return;
  const box = document.createElement('div');
  box.innerHTML = '<h3>CROSS REFERENCES</h3>';
  list.forEach(target => {
    const b = document.createElement('button');
    b.textContent = target.replace(/\./g, ' ');
    b.addEventListener('click', () => { $('#study-ref').value = target; openStudy(); });
    box.append(b);
  });
  $('#study-cols').append(box);
}
