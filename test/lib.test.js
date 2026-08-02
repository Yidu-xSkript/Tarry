import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MOVEMENTS } from '../lib.js';

test('the altar has eight movements ending in the wait', () => {
  assert.equal(MOVEMENTS.length, 8);
  assert.equal(MOVEMENTS.at(-1).id, 'wait');
});
