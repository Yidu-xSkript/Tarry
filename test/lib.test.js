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
