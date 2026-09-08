import { test } from 'node:test';
import assert from 'node:assert/strict';

import { HealthQueryDto } from './health-query.dto.js';

test('HealthQueryDto.create defaults verbose to false when absent', () => {
  const [error, dto] = HealthQueryDto.create({});

  assert.equal(error, '');
  assert.equal(dto?.verbose, false);
});

test('HealthQueryDto.create accepts the string "true"', () => {
  const [error, dto] = HealthQueryDto.create({ verbose: 'true' });

  assert.equal(error, '');
  assert.equal(dto?.verbose, true);
});

test('HealthQueryDto.create rejects a non-boolean value without throwing', () => {
  const [error, dto] = HealthQueryDto.create({ verbose: 'quizás' });

  assert.equal(dto, undefined);
  assert.match(String(error), /verbose/);
});
