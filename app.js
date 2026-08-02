import { MOVEMENTS, releaseState, TAGS, addEntry, answerEntry,
         testimonies, byTag, toPlainText, icsFor } from './lib.js';

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

// Placeholder until Task 12 wires real Bible data.
async function loadSessionPassage(ref) {
  $('#m-passage').textContent = '';
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
    : addEntry(load(), { id: newId(), created: today(), text, tag: pendingTag });
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
