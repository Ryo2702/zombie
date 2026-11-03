import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveState, PHASES, DURATION } from '../src/engine/storyTimeline.js';
import { getVitals, cardiacCycles } from '../src/engine/physiologyEngine.js';
import { vitalKeyframes } from '../src/data/vitalKeyframes.js';

test('all ten phases cover the full timeline without gaps', () => {
  assert.equal(PHASES.length, 10);
  assert.equal(PHASES[0].start, 0);
  assert.equal(PHASES.at(-1).end, DURATION);
  for (let i = 0; i < PHASES.length; i++) {
    assert.equal(deriveState(PHASES[i].start).phase.id, PHASES[i].id);
    if (i) assert.equal(PHASES[i - 1].end, PHASES[i].start);
  }
});

test('specified keyframe readings remain exact', () => {
  for (const { time, hr, spo2, temp, infected } of vitalKeyframes) {
    assert.deepEqual(getVitals(time), { hr, spo2, temp, infected }, `at ${time}s`);
  }
});

test('bite is discrete, infection stays constant until spread and counts never reverse', () => {
  assert.equal(getVitals(35.499).infected, 1);
  assert.equal(getVitals(35.5).infected, 2);
  assert.equal(getVitals(53.499).infected, 2);
  let previous = 0;
  for (let i = 0; i <= 6700; i++) {
    const value = getVitals(i / 100).infected;
    assert.ok(Number.isInteger(value) && value >= previous);
    previous = value;
  }
});

test('death holds without premature reanimation; missing oxygen stays unavailable', () => {
  for (const t of [44, 45, 46, 46.99, 47]) {
    assert.equal(getVitals(t).hr, 0);
    assert.equal(getVitals(t).spo2, null);
  }
  assert.equal(cardiacCycles(44), cardiacCycles(47));
  assert.ok(getVitals(47.2).hr > 0);
});

test('seeking reconstructs every persistent effect and resets cleanly', () => {
  const first = deriveState(0);
  const final = deriveState(67);
  assert.equal(final.glitch.crackProgress, 1);
  assert.equal(final.vitals.infected, 308);
  assert.equal(final.patient.eyes, 1);
  assert.equal(deriveState(20).glitch.crackProgress, 0);
  assert.equal(deriveState(20).lighting.red, 0);
  assert.deepEqual(deriveState(0), first);
  for (const t of [0, 17.6, 35.55, 43, 48, 54, 60.5, 67]) assert.deepEqual(deriveState(t), deriveState(t));
  assert.equal(deriveState(48).phase.id, 'reanimation');
  assert.ok(deriveState(48).lighting.red > 0);
});

test('reduced effects preserve story, readings, and fracture', () => {
  for (const t of [35.55, 47.55, 60.45, 67]) {
    const reduced = deriveState(t, true);
    const full = deriveState(t);
    assert.deepEqual(reduced.vitals, full.vitals);
    assert.equal(reduced.phase, full.phase);
    assert.equal(reduced.glitch.shakeX, 0);
    assert.equal(reduced.glitch.rgb, 0);
    assert.equal(reduced.glitch.crackProgress, full.glitch.crackProgress);
  }
});

test('clock input clamps invalid and out-of-range timestamps', () => {
  assert.equal(deriveState(-100).time, 0);
  assert.equal(deriveState(NaN).time, 0);
  assert.equal(deriveState(100).time, 67);
});
