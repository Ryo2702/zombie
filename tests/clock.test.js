import test from 'node:test';
import assert from 'node:assert/strict';
import { createSimulationClock } from '../src/engine/simulationClock.js';

test('play, pause, seek, replay and end retain exactly one animation loop', () => {
  const originalRequest = globalThis.requestAnimationFrame;
  const originalCancel = globalThis.cancelAnimationFrame;
  const originalPerformance = globalThis.performance;
  let now = 0;
  let id = 0;
  const pending = new Map();
  const frames = [];
  // Initialize GSAP before replacing RAF so its global housekeeping is not counted as a story frame.
  const clock = createSimulationClock(frame => frames.push(frame));
  globalThis.performance = { now: () => now };
  globalThis.requestAnimationFrame = callback => { pending.set(++id, callback); return id; };
  globalThis.cancelAnimationFrame = frame => pending.delete(frame);
  const advance = milliseconds => {
    now += milliseconds;
    const callbacks = [...pending.values()];
    pending.clear();
    callbacks.forEach(callback => callback(now));
  };
  try {
    assert.equal(clock.state.playing, false);
    clock.play();
    clock.play();
    assert.equal(pending.size, 1);
    advance(1000);
    assert.equal(clock.state.time, 1);
    clock.pause();
    assert.equal(pending.size, 0);
    advance(3000);
    assert.equal(clock.state.time, 1);
    clock.seek(48);
    assert.equal(clock.state.time, 48);
    assert.equal(clock.state.playing, false);
    clock.play();
    clock.seek(67);
    assert.equal(pending.size, 0);
    assert.equal(clock.state.playing, false);
    clock.play();
    assert.equal(clock.state.time, 0);
    assert.equal(pending.size, 1);
    clock.setRate(2);
    advance(500);
    assert.equal(clock.state.time, 1);
    clock.restart();
    assert.equal(clock.state.time, 0);
    assert.equal(pending.size, 1);
    clock.seek(66);
    advance(1000);
    assert.equal(clock.state.time, 67);
    assert.equal(clock.state.playing, false);
    assert.equal(pending.size, 0);
    assert.deepEqual(frames.at(-1), { time: 67, playing: false, rate: 2 });
    clock.seek(0);
    clock.play();
    clock.dispose();
    assert.equal(pending.size, 0);
  } finally {
    clock.dispose();
    globalThis.requestAnimationFrame = originalRequest;
    globalThis.cancelAnimationFrame = originalCancel;
    globalThis.performance = originalPerformance;
  }
});
