import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('soundtrack is 67-second stereo PCM with headroom, a near-silent collapse, and a decaying ending', () => {
  const wav = readFileSync(new URL('../public/audio/patient-zero.wav', import.meta.url));
  assert.equal(wav.toString('ascii', 0, 4), 'RIFF');
  assert.equal(wav.toString('ascii', 8, 16), 'WAVEfmt ');
  assert.equal(wav.readUInt16LE(20), 1);
  assert.equal(wav.readUInt16LE(22), 2);
  assert.equal(wav.readUInt32LE(24), 44100);
  assert.equal(wav.readUInt16LE(34), 16);
  assert.equal(wav.length, 44 + 67 * 44100 * 4);
  const rms = (start, end) => {
    let sum = 0;
    for (let i = start * 44100; i < end * 44100; i++) {
      sum += (wav.readInt16LE(44 + i * 4) / 32768) ** 2 + (wav.readInt16LE(46 + i * 4) / 32768) ** 2;
    }
    return Math.sqrt(sum / ((end - start) * 44100 * 2));
  };
  let peak = 0, width = 0;
  for (let i = 44; i < wav.length; i += 4) {
    const l = wav.readInt16LE(i), r = wav.readInt16LE(i + 2);
    peak = Math.max(peak, Math.abs(l), Math.abs(r));
    width += Math.abs(l - r);
  }
  assert.ok(peak / 32768 > 0.75 && peak / 32768 < 0.8, 'controlled peak below full scale');
  assert.ok(width / (67 * 44100) > 10, 'stereo atmosphere differs between channels');
  assert.ok(rms(41, 47) < rms(60, 65) * 0.12, 'collapse is dramatically quieter');
  assert.ok(rms(60, 65) > rms(0, 12) * 1.6, 'climax has greater energy than the opening');
  assert.ok(rms(47, 48) > rms(44, 46) * 10, 'reanimation has an explosive entrance');
  assert.ok(rms(66, 67) < rms(65, 66) * 0.3, 'last impact decays');
  assert.equal(wav.readInt16LE(wav.length - 4), 0);
  assert.equal(wav.readInt16LE(wav.length - 2), 0);
});
