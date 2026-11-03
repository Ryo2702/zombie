import test from 'node:test';
import assert from 'node:assert/strict';
import { ecgSample, flatlineEnvelope, respirationSample, seededNoise, transmissionGeometry } from '../src/renderers/signals.js';
import { crackProgress } from '../src/renderers/CrackRenderer.js';
import { respirationCycle } from '../src/engine/physiologyEngine.js';
import { renderMonitor } from '../src/renderers/MonitorRenderer.js';
import { deriveState } from '../src/engine/storyTimeline.js';

test('ECG has separate positive P/R/T and negative Q/S lobes', () => {
  assert.ok(ecgSample(.16) > .1);
  assert.ok(ecgSample(.295) < -.1);
  assert.ok(ecgSample(.325) > .9);
  assert.ok(ecgSample(.36) < -.2);
  assert.ok(ecgSample(.57) > .2);
  assert.ok(Math.abs(ecgSample(.9)) < .001);
  assert.equal(ecgSample(.325), ecgSample(1.325));
});

test('signal collapse is gradual and stays flat during the death hold', () => {
  assert.equal(flatlineEnvelope(40), 1);
  assert.ok(flatlineEnvelope(42) > 0 && flatlineEnvelope(42) < .5);
  assert.equal(flatlineEnvelope(44), 0);
  assert.equal(flatlineEnvelope(46.9), 0);
});

test('respiration pauses between breaths and noise is reproducible', () => {
  assert.equal(respirationSample, respirationCycle);
  assert.ok(respirationSample(1.5) > .9);
  assert.equal(respirationSample(3.5), 0);
  assert.equal(seededNoise(200), seededNoise(200));
  assert.notEqual(seededNoise(200), seededNoise(201));
});

test('transmission triples each generation and remains within the screen', () => {
  const levels = transmissionGeometry();
  assert.deepEqual(levels.map(level => level.length), [1, 3, 9, 27, 81]);
  for (const node of levels.flat()) {
    assert.ok(node.x > 0 && node.x < 440 && node.y > 0 && node.y < 190);
    if (node.parent) assert.ok(node.parent.x < node.x);
  }
});

test('seeking backward hides cracks; climax reveals them deterministically', () => {
  assert.equal(crackProgress(60.4), 0);
  assert.ok(crackProgress(60.6) > 0 && crackProgress(60.6) < 1);
  assert.equal(crackProgress(61), 1);
  assert.equal(crackProgress(12), 0);
});

test('every signal renders finite coordinates; the death hold draws only a level trace', () => {
  const originalPath = globalThis.Path2D;
  const originalCanvas = globalThis.OffscreenCanvas;
  const paths = [];
  globalThis.Path2D = class {
    points = [];
    moveTo(x, y) { this.points.push([x, y]); }
    lineTo(x, y) { this.points.push([x, y]); }
  };
  globalThis.OffscreenCanvas = class {
    getContext() {
      return { createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }), putImageData() {} };
    }
  };
  const gradient = () => ({ addColorStop() {} });
  const ctx = {
    save() {}, restore() {}, clearRect() {}, scale() {}, beginPath() {}, rect() {}, clip() {},
    fillRect() {}, moveTo() {}, lineTo() {}, fillText() {}, setLineDash() {}, drawImage() {},
    arc() {}, fill() {}, createLinearGradient: gradient, createRadialGradient: gradient,
    stroke(path) { if (path) paths.push(path.points); },
  };
  try {
    for (const time of [0, 6, 12, 21, 27, 36, 42, 45, 48, 54, 57, 60, 67]) {
      paths.length = 0;
      renderMonitor(ctx, 440, 190, deriveState(time));
      assert.ok(paths.length > 0, `No signal at ${time}s`);
      assert.ok(paths.flat(2).every(Number.isFinite), `Invalid geometry at ${time}s`);
      if (time === 45) assert.ok(paths.flat().every(([, y]) => y === 112));
    }
  } finally {
    globalThis.Path2D = originalPath;
    globalThis.OffscreenCanvas = originalCanvas;
  }
});
