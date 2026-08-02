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
