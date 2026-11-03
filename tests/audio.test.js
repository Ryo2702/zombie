import test from 'node:test';
import assert from 'node:assert/strict';
import { createAudioEngine } from '../src/engine/audioEngine.js';
import { deriveState } from '../src/engine/storyTimeline.js';

async function withAudio(run, fetchTrack) {
  const original = { AudioContext: globalThis.AudioContext, fetch: globalThis.fetch };
  let context;
  const requests = [];
  const parameter = () => ({ value: 0, cancelScheduledValues() {}, setValueAtTime(value) { this.value = value; }, exponentialRampToValueAtTime(value) { this.value = value; }, setTargetAtTime(value) { this.value = value; } });
  class MockAudioContext {
    constructor() { context = this; this.currentTime = 0; this.state = 'suspended'; this.sampleRate = 100; this.sources = new Set(); this.gains = []; }
    createGain() { const node = { gain: parameter(), connect(node) { return node; }, disconnect() {} }; this.gains.push(node); return node; }
    createBiquadFilter() { return { frequency: parameter(), connect(node) { return node; }, disconnect() {} }; }
    createBuffer(channels, samples) { return { getChannelData: () => new Float32Array(samples) }; }
    createOscillator() { return this.createBufferSource(); }
    createBufferSource() {
      const source = {
        frequency: parameter(), playbackRate: parameter(), connect(node) { return node; }, disconnect() {},
        start: (time, offset) => { source.startTime = time; source.offset = offset; this.sources.add(source); },
        stop: time => {
          if (time === undefined || time <= this.currentTime) {
            this.sources.delete(source);
            source.onended?.();
          } else source.stopTime = time;
        },
      };
      return source;
    }
    async decodeAudioData() { return { duration: 67 }; }
    async resume() { this.state = 'running'; }
    async close() { this.state = 'closed'; }
    advance(seconds) {
      this.currentTime += seconds;
      for (const source of this.sources) if (source.stopTime <= this.currentTime) source.stop();
    }
  }
  globalThis.AudioContext = MockAudioContext;
  globalThis.fetch = async url => {
    requests.push(url);
    return fetchTrack ? fetchTrack(url) : { ok: true, arrayBuffer: async () => new ArrayBuffer(0) };
  };
  const audio = createAudioEngine();
  const update = (time, playing = true, rate = 1) => {
    const state = deriveState(time);
    audio.update(time, playing, state.vitals, state.phase, rate);
  };
  const music = () => [...context.sources].filter(source => source.buffer?.duration === 67 && source.stopTime === undefined);
  try { await run({ audio, update, music, requests, context: () => context }); }
  finally { audio.dispose(); Object.assign(globalThis, original); }
}

test('audio waits for gesture, clears transients on seek and pause, disposes all sources', () => withAudio(async ({ audio, update, music, context: getContext }) => {
  update(0, false);
  assert.equal(getContext(), undefined);
  assert.equal(audio.status, 'awaiting gesture');
  assert.equal(await audio.init(), true);
  const context = getContext();
  const baseline = context.sources.size;
  assert.equal(baseline, 6);
  assert.equal(context.gains[0].gain.value, 0.5);
  update(0);
  assert.equal(context.sources.size, baseline + 1, 'only the soundtrack starts before the R spike');
  context.advance(0.26);
  update(0.26);
  assert.equal(context.sources.size, baseline + 1, 'beep waits for the R spike');
  context.advance(0.02);
  update(0.28);
  assert.ok(context.sources.size > baseline + 1);
  audio.seek(35.4);
  context.advance(0.02);
  assert.equal(context.sources.size, baseline);
  update(35.4);
  context.advance(0.15);
  update(35.55);
  assert.ok(context.sources.size > baseline + 1);
  update(35.55, false);
  context.advance(0.02);
  assert.equal(context.sources.size, baseline);
  for (let i = 0; i < 30; i++) {
    audio.seek(60.5);
    context.advance(0.02);
    update(60.5);
    assert.equal(context.sources.size, baseline + 1, 'seeking does not replay fracture or prior events');
    assert.equal(music().length, 1, 'exactly one soundtrack after each seek');
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
  assert.equal(context.gains[0].gain.value, 0, 'volume changes cannot override mute');
  audio.setMuted(false);
  assert.equal(context.gains[0].gain.value, 0.2);
  audio.dispose();
  assert.equal(context.sources.size, 0);
  assert.equal(context.state, 'closed');
}));

test('soundtrack follows play, pause, scrub, speed, drift correction, completion and replay', () => withAudio(async ({ audio, update, music, requests, context }) => {
  await Promise.all([audio.init(), audio.init()]);
  assert.deepEqual(requests, ['/audio/patient-zero.ogg'], 'concurrent gestures share one asset request');
  update(12);
  const first = music()[0];
  assert.equal(first.offset, 12);
  context().advance(0.1);
  update(12.1);
  assert.equal(music()[0], first, 'normal playback keeps the sample clock running');
  update(12.1, false);
  assert.equal(music().length, 0);
  update(12.1);
  assert.equal(music()[0].offset, 12.1, 'resume starts at paused position');
  audio.seek(47);
  update(47);
  assert.equal(music()[0].offset, 47);
  update(47, true, 2);
  const fast = music()[0];
  assert.equal(fast.playbackRate.value, 2);
  context().advance(0.1);
  update(47.2, true, 2);
  assert.equal(music()[0], fast);
  context().advance(1);
  update(47.3, true, 2);
  assert.equal(music()[0].offset, 47.3, 'resyncs when the simulation and audio clocks diverge');
  update(67, false);
  assert.equal(music().length, 0);
  audio.reset();
  update(0);
  assert.equal(music()[0].offset, 0);
}));

test('late loading joins the current timeline and never starts while paused', () => {
  let complete;
  return withAudio(async ({ audio, update, music }) => {
    const ready = audio.init();
    update(20);
    update(21, false);
    complete({ ok: true, arrayBuffer: async () => new ArrayBuffer(0) });
    assert.equal(await ready, true);
    assert.equal(music().length, 0);
    update(21);
    assert.equal(music()[0].offset, 21);
  }, () => new Promise(resolve => { complete = resolve; }));
});

test('a failed soundtrack request reports failure and can retry on the next gesture', () => {
  let fail = true;
  return withAudio(async ({ audio, requests }) => {
    assert.equal(await audio.init(), false);
    assert.equal(audio.status, 'unavailable');
    assert.deepEqual(requests, ['/audio/patient-zero.ogg', '/audio/patient-zero.wav']);
    fail = false;
    assert.equal(await audio.init(), true);
    assert.equal(audio.status, 'paused');
  }, async () => ({ ok: !fail, status: 503, arrayBuffer: async () => new ArrayBuffer(0) }));
});

test('unsupported Ogg decoding falls back to WAV', () => withAudio(async ({ audio, requests, context }) => {
  const ready = audio.init();
  let decodes = 0;
  context().decodeAudioData = async () => {
    if (++decodes === 1) throw new Error('Unsupported codec');
    return { duration: 67 };
  };
  assert.equal(await ready, true);
  assert.equal(decodes, 2);
  assert.deepEqual(requests, ['/audio/patient-zero.ogg', '/audio/patient-zero.wav']);
}));

test('disposing during loading does not start music or reopen the audio context', () => {
  let complete;
  return withAudio(async ({ audio, music, context }) => {
    const ready = audio.init();
    audio.dispose();
    complete({ ok: true, arrayBuffer: async () => new ArrayBuffer(0) });
    assert.equal(await ready, false);
    assert.equal(context().state, 'closed');
    assert.equal(music().length, 0);
  }, () => new Promise(resolve => { complete = resolve; }));
});
