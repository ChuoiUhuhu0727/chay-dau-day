// Test khởi đầu: logic.js load được. Tính năng thật bắt đầu từ F1.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createState } from '../logic.js';

test('createState trả về một object', () => {
  assert.equal(typeof createState(), 'object');
});
