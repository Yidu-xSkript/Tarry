import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MOVEMENTS } from '../lib.js';

test('the altar has eight movements ending in the wait', () => {
  assert.equal(MOVEMENTS.length, 8);
  assert.equal(MOVEMENTS.at(-1).id, 'wait');
});

import { releaseState, movementById } from '../lib.js';

test('the floor withholds release before it elapses', () => {
  const m = movementById('thanks');           // 180s floor
  assert.deepEqual(releaseState(m, 179_999), { released: false, label: null });
});

test('the floor releases with "continue" once it elapses', () => {
  const m = movementById('thanks');
  assert.deepEqual(releaseState(m, 180_000), { released: true, label: 'continue' });
});

test('confession releases with the promise, not with "continue"', () => {
  const m = movementById('confess');
  const state = releaseState(m, 180_000);
  assert.equal(state.released, true);
  assert.match(state.label, /faithful and just to forgive/);
});

test('the wait never releases, no matter how long you sit', () => {
  const m = movementById('wait');
  assert.deepEqual(releaseState(m, 10 * 60 * 60 * 1000), { released: false, label: null });
});

import { addEntry, answerEntry, testimonies, byTag, toPlainText } from '../lib.js';

const seed = () => addEntry([], {
  id: 'a', created: '2026-03-04', text: 'For my brother', tag: 'burden',
});

test('an entry starts unanswered', () => {
  const [e] = seed();
  assert.equal(e.answer, null);
  assert.equal(e.tag, 'burden');
});

test('answering attaches the testimony and its date', () => {
  const entries = answerEntry(seed(), 'a', 'He came home.', '2026-09-19');
  assert.deepEqual(entries[0].answer, { text: 'He came home.', date: '2026-09-19' });
  assert.equal(entries[0].created, '2026-03-04', 'the original must not be rewritten');
});

test('testimonies lists only answered entries, newest first', () => {
  let entries = addEntry(seed(), { id: 'b', created: '2026-04-01', text: 'unanswered' });
  entries = addEntry(entries, { id: 'c', created: '2026-01-01', text: 'older' });
  entries = answerEntry(entries, 'a', 'He came home.', '2026-09-19');
  entries = answerEntry(entries, 'c', 'He provided.', '2026-11-02');
  assert.deepEqual(testimonies(entries).map(e => e.id), ['c', 'a']);
});

test('byTag filters, and a null tag returns everything', () => {
  const entries = addEntry(seed(), { id: 'd', created: '2026-04-01', text: 'a dream', tag: 'dream' });
  assert.deepEqual(byTag(entries, 'dream').map(e => e.id), ['d']);
  assert.equal(byTag(entries, null).length, 2);
});

test('export includes the burden, its testimony, and both dates', () => {
  const out = toPlainText(answerEntry(seed(), 'a', 'He came home.', '2026-09-19'));
  assert.match(out, /2026-03-04/);
  assert.match(out, /For my brother/);
  assert.match(out, /2026-09-19/);
  assert.match(out, /He came home\./);
});

import { icsFor } from '../lib.js';

test('the calendar file repeats daily with an alarm at the chosen time', () => {
  const ics = icsFor('05:30', '20260803');
  assert.match(ics, /^BEGIN:VCALENDAR/);
  assert.match(ics, /RRULE:FREQ=DAILY/);
  assert.match(ics, /DTSTART:20260803T053000/);
  assert.match(ics, /BEGIN:VALARM[\s\S]*TRIGGER:PT0M[\s\S]*END:VALARM/);
  assert.match(ics, /END:VCALENDAR$/);
});

test('single-digit hours are zero-padded', () => {
  assert.match(icsFor('5:05', '20260803'), /DTSTART:20260803T050500/);
});

test('lines are CRLF terminated as the iCalendar spec requires', () => {
  assert.ok(icsFor('05:30', '20260803').includes('\r\n'));
});

import { parseRef, refToPath, bibleGatewayUrl, plainVerse } from '../lib.js';

test('parseRef reads book, chapter, and optional verse', () => {
  assert.deepEqual(parseRef('john 3'), { book: 'john', chapter: '3', verse: null });
  assert.deepEqual(parseRef('John 3:16'), { book: 'john', chapter: '3', verse: '16' });
  assert.deepEqual(parseRef('1 John 4:9'), { book: '1john', chapter: '4', verse: '9' });
  assert.deepEqual(parseRef('psalm.63.1'), { book: 'psalm', chapter: '63', verse: '1' });
});

test('parseRef rejects nonsense rather than guessing', () => {
  assert.equal(parseRef(''), null);
  assert.equal(parseRef('john'), null);
});

test('refToPath points at the per-book data file', () => {
  assert.equal(refToPath('bsb', parseRef('1 John 4:9')), 'data/bsb/1john.json');
});

test('the AMP link targets Bible Gateway at that passage', () => {
  const url = bibleGatewayUrl(parseRef('John 3:16'));
  assert.match(url, /biblegateway\.com/);
  assert.match(url, /version=AMP/);
  assert.match(url, /John(\+|%20)3/i);
});

test('plainVerse joins tokens into text with no Strong\'s markup', () => {
  const chapter = { '1': [{ t: 'O', s: null }, { t: 'God', s: 'H430' }] };
  assert.equal(plainVerse(chapter, '1'), 'O God');
});

test('plainVerse returns null for a missing verse rather than throwing', () => {
  assert.equal(plainVerse({}, '1'), null);
});

import { BOOKS, bookName } from '../lib.js';
import { readdirSync } from 'node:fs';

test('the canon runs Genesis to Revelation, 66 books', () => {
  assert.equal(BOOKS.length, 66);
  assert.equal(BOOKS[0].key, 'genesis');
  assert.equal(BOOKS.at(-1).key, 'revelation');
  assert.equal(BOOKS[39].key, 'matthew', 'the New Testament starts at index 39');
});

test('every book key has a data file, and every data file has a book key', () => {
  const onDisk = new Set(readdirSync('data/kjv').map(f => f.replace('.json', '')));
  const inCanon = new Set(BOOKS.map(b => b.key));
  assert.deepEqual([...inCanon].filter(k => !onDisk.has(k)), [], 'canon entries with no data file');
  assert.deepEqual([...onDisk].filter(k => !inCanon.has(k)), [], 'data files missing from the canon');
});

test('bookName gives the human name and falls back to the key', () => {
  assert.equal(bookName('1john'), '1 John');
  assert.equal(bookName('psalm'), 'Psalms');
  assert.equal(bookName('narnia'), 'narnia');
});

import { step } from '../lib.js';
import { readFileSync } from 'node:fs';

const INDEX = JSON.parse(readFileSync('data/index.json', 'utf8'));
const at = (book, chapter, verse = null) => ({ book, chapter, verse });

test('the index agrees with the text: 1189 chapters, 31102 verses', () => {
  assert.equal(Object.values(INDEX).reduce((a, c) => a + c.length, 0), 1189);
  assert.equal(Object.values(INDEX).flat().reduce((a, c) => a + c, 0), 31102);
});

test('stepping a verse moves within the chapter', () => {
  assert.deepEqual(step(at('john', '3', '16'), 1, INDEX), at('john', '3', '17'));
  assert.deepEqual(step(at('john', '3', '16'), -1, INDEX), at('john', '3', '15'));
});

test('the last verse of a chapter steps into the next chapter, verse 1', () => {
  assert.deepEqual(step(at('john', '3', '36'), 1, INDEX), at('john', '4', '1'));
});

test('the first verse of a chapter steps back to the last verse of the previous one', () => {
  assert.deepEqual(step(at('john', '4', '1'), -1, INDEX), at('john', '3', '36'));
});

test('stepping crosses the seam between books', () => {
  // Malachi 4:6 is the last verse of the Old Testament.
  assert.deepEqual(step(at('malachi', '4', '6'), 1, INDEX), at('matthew', '1', '1'));
  assert.deepEqual(step(at('matthew', '1', '1'), -1, INDEX), at('malachi', '4', '6'));
});

test('there is nowhere before Genesis 1:1 or after Revelation 22:21', () => {
  assert.equal(step(at('genesis', '1', '1'), -1, INDEX), null);
  assert.equal(step(at('revelation', '22', '21'), 1, INDEX), null);
});

test('on a whole chapter, stepping moves a chapter, not a verse', () => {
  assert.deepEqual(step(at('john', '3'), 1, INDEX), at('john', '4'));
  assert.deepEqual(step(at('john', '1'), -1, INDEX), at('luke', '24'));
  assert.deepEqual(step(at('revelation', '22'), 1, INDEX), null);
});

test('every verse in the canon steps forward exactly 31101 times and then stops', () => {
  let ref = at('genesis', '1', '1');
  let n = 0;
  while (true) {
    const next = step(ref, 1, INDEX);
    if (!next) break;
    ref = next;
    if (++n > 32000) break;   // guard against a cycle
  }
  assert.deepEqual(ref, at('revelation', '22', '21'));
  assert.equal(n, 31101);
});
