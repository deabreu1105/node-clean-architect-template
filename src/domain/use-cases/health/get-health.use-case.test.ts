import { test } from 'node:test';
import assert from 'node:assert/strict';

import { GetHealth } from './get-health.use-case.js';
import type { Clock } from '../../interfaces/clock.interface.js';
import type { HealthRepository, HealthSnapshot } from '../../repositories/health.repository.js';

// Los dobles son objetos literales tipados contra el puerto abstracto, escritos
// a mano. Sin librería de mocking, sin I/O real: ni .env, ni red, ni servidor.
const fakeRepository = ( snapshot: HealthSnapshot ): HealthRepository => ({
  getSnapshot: () => snapshot,
});

const snapshot: HealthSnapshot = {
  appName: 'mi-api',
  uptimeSeconds: 42,
  nodeVersion: 'v20.0.0',
};

test('GetHealth composes the entity from the repository snapshot', () => {
  const frozenClock: Clock = () => new Date('2026-01-01T00:00:00.000Z');

  const result = new GetHealth(fakeRepository(snapshot), frozenClock).execute();

  assert.equal(result.status, 'ok');
  assert.equal(result.appName, 'mi-api');
  assert.equal(result.uptimeSeconds, 42);
  assert.equal(result.checkedAt.toISOString(), '2026-01-01T00:00:00.000Z');
});

test('GetHealth takes the timestamp from the injected clock, never from Date directly', () => {
  let calls = 0;
  const countingClock: Clock = () => { calls++; return new Date(0); };

  new GetHealth(fakeRepository(snapshot), countingClock).execute();

  assert.equal(calls, 1);
});
