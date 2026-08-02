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
