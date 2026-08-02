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
