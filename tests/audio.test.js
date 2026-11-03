import test from 'node:test';
import assert from 'node:assert/strict';
import { createAudioEngine } from '../src/engine/audioEngine.js';
import { deriveState } from '../src/engine/storyTimeline.js';

test('audio waits for gesture, clears transients on seek and pause, disposes all sources', async () => {
  const original = globalThis.AudioContext;
  let context;
  const parameter = () => ({ value: 0, setValueAtTime(value) { this.value = value; }, exponentialRampToValueAtTime(value) { this.value = value; }, setTargetAtTime(value) { this.value = value; } });
  class MockAudioContext {
    constructor() { context = this; this.currentTime = 0; this.state = 'suspended'; this.sampleRate = 100; this.sources = new Set(); this.gains = []; }
    createGain() { const node = { gain: parameter(), connect(node) { return node; }, disconnect() {} }; this.gains.push(node); return node; }
    createBiquadFilter() { return { frequency: parameter(), connect(node) { return node; }, disconnect() {} }; }
    createBuffer(channels, samples) { return { getChannelData: () => new Float32Array(samples) }; }
    createOscillator() { return this.createBufferSource(); }
    createBufferSource() {
      const source = {
        frequency: parameter(), connect(node) { return node; }, disconnect() {},
        start: () => this.sources.add(source),
        stop: time => {
          if (time === undefined || time <= this.currentTime) {
            this.sources.delete(source);
            source.onended?.();
          } else source.stopTime = time;
        },
      };
      return source;
    }
    async resume() { this.state = 'running'; }
    async close() { this.state = 'closed'; }
  }
  globalThis.AudioContext = MockAudioContext;
  const audio = createAudioEngine();
  const update = (time, playing = true) => {
    const state = deriveState(time);
    audio.update(time, playing, state.vitals, state.phase);
  };
  try {
    update(0, false);
    assert.equal(context, undefined);
    assert.equal(audio.status, 'awaiting gesture');
    await audio.init();
    const baseline = context.sources.size;
    assert.equal(baseline, 6);
    assert.equal(context.gains[0].gain.value, 0.5);
    update(0);
    assert.equal(context.sources.size, baseline, 'no beep at baseline before the R spike');
    update(0.26);
    assert.equal(context.sources.size, baseline, 'beep waits for the R spike');
    update(0.28);
    assert.ok(context.sources.size > baseline);
    audio.seek(35.4);
    assert.equal(context.sources.size, baseline);
    update(35.4);
    update(35.55);
    assert.ok(context.sources.size > baseline);
    update(35.55, false);
    assert.equal(context.sources.size, baseline);
    for (let i = 0; i < 30; i++) {
      audio.seek(60.5);
      update(60.5);
      assert.equal(context.sources.size, baseline, 'seeking does not replay fracture or prior events');
      audio.reset();
      update(0, false);
    }
    audio.seek(60);
    update(60);
    assert.ok(context.gains[7].gain.value > 0, 'quarantine siren active during outbreak');
    audio.seek(59.6);
    update(59.6);
    assert.ok(context.gains[8].gain.value > 0, 'outbreak alarm pulses');
    update(59.6, false);
    assert.equal(context.gains[1].gain.value, 0, 'pause silences the master playback gate');
    audio.seek(45);
    update(45);
    assert.equal(context.gains[7].gain.value, 0, 'seeking to death removes the siren');
    assert.equal(context.gains[8].gain.value, 0, 'seeking to death removes outbreak alarms');
    assert.ok(context.gains[5].gain.value > 0, 'flatline tone remains');
    audio.setMuted(true);
    assert.equal(audio.status, 'muted');
    audio.setVolume(0.2);
    audio.dispose();
    assert.equal(context.sources.size, 0);
    assert.equal(context.state, 'closed');
  } finally {
    audio.dispose();
    globalThis.AudioContext = original;
  }
});
