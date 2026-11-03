// Render the original score: node scripts/render-soundtrack.mjs (OGG encoding needs ffmpeg).
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const RATE = 44100;
const DURATION = 67;
const TAU = Math.PI * 2;
const clamp = value => Math.max(0, Math.min(1, value));
const smooth = value => { const x = clamp(value); return x * x * (3 - 2 * x); };
const sine = phase => Math.sin(TAU * phase);

export function renderSoundtrack() {
  const left = new Float32Array(RATE * DURATION);
  const right = new Float32Array(left.length);
  let seed = 67047;
  const random = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return (seed >>> 0) / 4294967296; };
  const noise = () => random() * 2 - 1;
  let airL = 0, airR = 0, breath = 0, dronePhase = 0, pressurePhase = 0;

  // The room is wide; the pressure under the bed stays centered.
  for (let i = 0; i < left.length; i++) {
    const t = i / RATE;
    const firstRise = smooth((t - 12) / 28);
    const reanimated = t >= 47;
    const outbreak = smooth((t - 47) / 18);
    const collapsed = t >= 40 && t < 47;
    airL += (noise() - airL) * 0.035;
    airR += (noise() - airR) * 0.039;
    breath += (noise() - breath) * 0.003;
    const inhale = Math.pow(Math.max(0, sine(t / 5.3)), 2);
    const room = collapsed ? 0.008 : 0.027 + outbreak * 0.016;
    const lowTone = 0.009 * sine(39.2 * t) + 0.004 * sine(50 * t);
    dronePhase += (43.65 + 0.09 * sine(t * 0.17)) / RATE;
    pressurePhase += (61.73 + firstRise * 0.7 + 0.2 * sine(t * 0.31)) / RATE;
    const level = collapsed ? 0 : 0.012 + firstRise * 0.019 + outbreak * 0.02;
    const drone = level * (sine(dronePhase) + 0.3 * sine(dronePhase * 2 + 0.09 * sine(t * 0.11)));
    const pressure = level * (0.48 * sine(pressurePhase) + 0.21 * sine(pressurePhase * 3.014));
    const destabilizing = !collapsed && t >= 20 ? smooth((t - 20) / 15) * 0.011 : 0;
    const tensionPhase = 113 * t + 0.65 * Math.max(0, t - 20) ** 2;
    const tremor = 0.6 + 0.4 * sine(t * (reanimated ? 7.2 : 1.7));
    const alarmLevel = reanimated ? 0.009 * smooth((t - 47) / 9) * (0.65 + 0.35 * sine(t * 1.6)) : 0;
    const alarmPhase = 386 * t + 34 * sine(t * 0.56);
    const mechanical = collapsed ? 0 : inhale * breath * 0.055;
    left[i] = lowTone + room * airL + mechanical + drone + pressure
      + destabilizing * tremor * sine(tensionPhase + 0.8 * sine(t * 6.2))
      + alarmLevel * sine(alarmPhase);
    right[i] = lowTone + room * airR + mechanical + drone
      + level * (0.48 * sine(pressurePhase + 0.17) + 0.21 * sine(pressurePhase * 3.014 + 0.31))
      + destabilizing * tremor * sine(tensionPhase + 0.9 * sine(t * 6.17) + 0.21)
      + alarmLevel * sine(alarmPhase + 0.18);
  }

  function sound(start, length, amplitude, pan, sample) {
    const offset = Math.round(start * RATE);
    const count = Math.round(length * RATE);
    const l = Math.sqrt((1 - pan) / 2);
    const r = Math.sqrt((1 + pan) / 2);
    for (let j = 0; j < count && offset + j < left.length; j++) {
      if (offset + j < 0) continue;
      const t = j / RATE;
      const edge = smooth(t / 0.002) * smooth((length - t) / 0.018);
      const value = sample(t, j) * amplitude * edge;
      left[offset + j] += value * l;
      right[offset + j] += value * r;
    }
  }

  function heartbeat(start, strength, infected, second = false) {
    const length = second ? 0.22 : infected ? 0.31 : 0.4;
    const fundamental = second ? 57 : infected ? 43.65 : 48;
    sound(start, length, strength, 0, t => {
      const phase = fundamental * t + (second ? 1.1 : 2.6) * (1 - Math.exp(-t * 32));
      const body = sine(phase) * Math.exp(-t * (second ? 20 : 12));
      const distorted = infected ? 0.26 * Math.tanh(3.5 * body) * Math.exp(-t * 7) : 0;
      return body + distorted + 0.09 * sine(phase * 2.01) * Math.exp(-t * 42);
    });
  }

  function metal(start, strength, pan, duration = 0.18) {
    let low = 0;
    sound(start, duration, strength, pan, t => {
      const n = noise();
      low += (n - low) * 0.2;
      const clang = sine(277 * t + 1.6 * sine(419 * t)) + 0.42 * sine(1031 * t) + 0.18 * sine(2317 * t);
      return (0.55 * clang + 0.3 * (n - low)) * Math.exp(-t * 31);
    });
  }

  function impact(start, strength, duration) {
    sound(start, duration, strength, 0, t => {
      const phase = 32.7 * t + 7.8 * (1 - Math.exp(-t * 13));
      return (0.75 * sine(phase) + 0.22 * Math.tanh(4 * sine(phase * 1.002))) * Math.exp(-t * 3.3);
    });
    for (const [delay, pan] of [[0, -0.5], [0.013, 0.55]]) {
      let low = 0;
      sound(start + delay, duration, strength * 0.4, pan, t => {
        low += (noise() - low) * 0.24;
        return (low + 0.25 * sine(183 * t + 2 * sine(247 * t))) * Math.exp(-t * 5);
      });
    }
    metal(start, strength * 0.44, 0.15, 0.45);
  }

  for (let t = 0.48; t < 40;) {
    const bpm = t < 12 ? 70 + t / 6 : t < 20 ? 72 + (t - 12) * 2 : t < 27 ? 88 + (t - 20) * 3.4 : t < 35 ? 112 + (t - 27) * 3.5 : 140 + (t - 35) * 5;
    const strength = 0.15 + 0.13 * smooth((t - 12) / 28);
    heartbeat(t, strength, t >= 27);
    heartbeat(t + (t >= 27 ? 0.12 : 0.18), strength * 0.47, t >= 27, true);
    const instability = t >= 27 ? (random() - 0.5) * (t >= 35 ? 0.15 : 0.065) : 0;
    t += 60 / bpm + instability;
  }
  for (let t = 12.15; t < 40; t += t < 20 ? 0.75 : t < 27 ? 0.5 : 0.31) {
    const pan = (random() - 0.5) * 1.6;
    sound(t, 0.038, t < 20 ? 0.017 : 0.022, pan, s => (sine(2640 * s) + 0.35 * noise()) * Math.exp(-s * 150));
  }
  for (let t = 27.1; t < 39.8; t += 0.14 + random() * 0.43) {
    const frequency = 1100 + random() * 2600;
    const pan = (random() - 0.5) * 1.7;
    sound(t, 0.025 + random() * 0.045, 0.018 + random() * 0.022, pan, s => {
      const stutter = Math.floor(s * 480) % 3 === 0 ? 0.1 : 1;
      return stutter * (sine(frequency * s + sine(170 * s)) + 0.25 * noise()) * Math.exp(-s * 60);
    });
  }
  impact(35, 0.49, 1.25);

  // Reversed metal breaths announce attacks, without filling the seven-second collapse.
  for (const end of [27, 35, 49.7, 53.95, 57.4, 59.95, 62.8, 64.95]) {
    let low = 0;
    sound(end - 0.65, 0.65, end < 40 ? 0.045 : 0.09, end % 2 > 1 ? -0.6 : 0.6, t => {
      low += (noise() - low) * 0.11;
      return (low + 0.18 * sine(311 * t + 1.5 * sine(149 * t))) * Math.pow(t / 0.65, 3);
    });
  }

  impact(47, 0.76, 1.8);
  let beat = 0;
  for (let t = 47.18; t < 64.9;) {
    const bpm = t < 54 ? 166 + (t - 47) * 2.8 : t < 60 ? 186 + (t - 54) * 4 : 210 + (t - 60) * 5;
    const intensity = smooth((t - 47) / 18);
    heartbeat(t, 0.31 + intensity * 0.08, true);
    heartbeat(t + 0.095, 0.13 + intensity * 0.04, true, true);
    if (beat % 2) metal(t + 0.055, 0.065 + intensity * 0.055, beat % 4 === 1 ? -0.45 : 0.5);
    const gap = 60 / bpm;
    const bassPhase = beat % 4 === 3 ? 41.2 : 43.65;
    sound(t + gap * 0.46, gap * 0.46, 0.065 + intensity * 0.045, 0, s => {
      const phase = bassPhase * s;
      return (sine(phase) + 0.2 * sine(phase * 3) + 0.08 * sine(phase * 5)) * Math.exp(-s * 13);
    });
    t += gap * (beat % 11 === 8 ? 0.72 : beat % 11 === 9 ? 1.22 : 1);
    beat++;
  }
  for (let t = 48; t < 64.9; t += t < 54 ? 0.57 : t < 60 ? 0.28 : 0.14) {
    const pan = (random() - 0.5) * 1.7;
    metal(t, 0.027 + smooth((t - 54) / 11) * 0.03, pan, 0.11);
    if (t >= 54 && random() > 0.55) {
      sound(t + 0.047, 0.027, 0.025, -pan, s => noise() * Math.exp(-s * 90));
    }
  }
  impact(65, 0.92, 2);

  // High-passed room reflections give width without spreading the sub bass.
  const sendL = new Float32Array(left.length), sendR = new Float32Array(left.length);
  let lowL = 0, lowR = 0;
  const cutoff = 1 - Math.exp(-TAU * 230 / RATE);
  for (let i = 0; i < left.length; i++) {
    lowL += (left[i] - lowL) * cutoff;
    lowR += (right[i] - lowR) * cutoff;
    sendL[i] = left[i] - lowL;
    sendR[i] = right[i] - lowR;
  }
  for (const [seconds, level] of [[0.113, 0.17], [0.227, 0.13], [0.431, 0.11], [0.673, 0.08], [1.127, 0.045]]) {
    const delay = Math.round(seconds * RATE);
    for (let i = delay; i < left.length; i++) {
      left[i] += sendR[i - delay] * level;
      right[i] += sendL[i - delay] * level;
    }
  }

  let peak = 0, previousL = 0, previousR = 0, dcL = 0, dcR = 0;
  const highpass = Math.exp(-TAU * 24 / RATE);
  for (let i = 0; i < left.length; i++) {
    const t = i / RATE;
    // The rhythm dies abruptly at 40; only the low room tone survives.
    const collapse = t >= 40 && t < 47 ? 1 - 0.9 * smooth((t - 40) / 0.045) : 1;
    const ending = t >= 65 ? Math.exp(-(t - 65) * 1.8) * smooth((67 - t) / 0.35) : 1;
    const envelope = smooth(t / 0.08) * collapse * ending;
    dcL = left[i] - previousL + highpass * dcL;
    dcR = right[i] - previousR + highpass * dcR;
    previousL = left[i]; previousR = right[i];
    left[i] = Math.tanh(dcL * 1.5) * envelope;
    right[i] = Math.tanh(dcR * 1.5) * envelope;
    peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]));
  }
  for (let i = 0; i < left.length; i++) { left[i] *= 0.78 / peak; right[i] *= 0.78 / peak; }
  return { left, right, sampleRate: RATE };
}

export function encodeWav({ left, right, sampleRate }) {
  const wav = Buffer.alloc(44 + left.length * 4);
  wav.write('RIFF', 0); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVEfmt ', 8);
  wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(2, 22);
  wav.writeUInt32LE(sampleRate, 24); wav.writeUInt32LE(sampleRate * 4, 28);
  wav.writeUInt16LE(4, 32); wav.writeUInt16LE(16, 34); wav.write('data', 36);
  wav.writeUInt32LE(left.length * 4, 40);
  for (let i = 0; i < left.length; i++) {
    wav.writeInt16LE(Math.round(left[i] * 32767), 44 + i * 4);
    wav.writeInt16LE(Math.round(right[i] * 32767), 46 + i * 4);
  }
  return wav;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const directory = resolve(dirname(fileURLToPath(import.meta.url)), '../public/audio');
  mkdirSync(directory, { recursive: true });
  const wavPath = resolve(directory, 'patient-zero.wav');
  writeFileSync(wavPath, encodeWav(renderSoundtrack()));
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', wavPath, '-c:a', 'libvorbis', '-q:a', '6', '-metadata', 'title=PATIENT ZERO — 67 Seconds Until Outbreak', resolve(directory, 'patient-zero.ogg')]);
  console.log(`Rendered 67-second original stereo score to ${directory}`);
}
