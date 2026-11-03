import { vitalKeyframes } from '../data/vitalKeyframes.js';

export const clamp = (value, low = 0, high = 1) => Math.min(high, Math.max(low, value));
export const lerp = (a, b, progress) => a + (b - a) * progress;

export function respirationCycle(time) {
  const cycle = time / 3.75 - Math.floor(time / 3.75);
  return cycle > 0.86 ? 0 : Math.sin(Math.PI * (cycle / 0.86) ** 0.82) ** 2;
}

// Explicit death/reanimation holds prevent interpolation from reviving the patient early.
const readings = [...vitalKeyframes,
  { time: 44, hr: 0, spo2: null, temp: 41.6, infected: 2 },
  { time: 47, hr: 0, spo2: null, temp: 41.6, infected: 2 },
].sort((a, b) => a.time - b.time);

export function cardiacCycles(time) {
  const t = clamp(Number.isFinite(time) ? time : 0, 0, 67);
  let cycles = 0;
  for (let i = 1; i < readings.length; i++) {
    const a = readings[i - 1];
    const b = readings[i];
    const elapsed = Math.min(t, b.time) - a.time;
    if (elapsed <= 0) break;
    const finalRate = lerp(a.hr, b.hr, elapsed / (b.time - a.time));
    cycles += elapsed * (a.hr + finalRate) / 120;
    if (t <= b.time) break;
  }
  return cycles;
}

export function getVitals(time) {
  const t = clamp(Number.isFinite(time) ? time : 0, 0, 67);
  const right = readings.findIndex(frame => frame.time > t);
  const a = readings[right === -1 ? readings.length - 1 : Math.max(0, right - 1)];
  const b = readings[right === -1 ? readings.length - 1 : right];
  const progress = a === b ? 0 : (t - a.time) / (b.time - a.time);
  let infected = t < 35.5 ? 1 : 2;
  if (t >= 53.5) {
    const countFrames = [[53.5, 2], [54, 8], [57, 80], [60, 308], [67, 308]];
    const next = countFrames.findIndex(([at]) => at > t);
    const [start, first] = countFrames[next === -1 ? 4 : next - 1];
    const [end, last] = countFrames[next === -1 ? 4 : next];
    infected = Math.round(start === end ? last : lerp(first, last, (t - start) / (end - start)));
  }
  return {
    hr: Math.round(lerp(a.hr, b.hr, progress)),
    spo2: a.spo2 === null ? null : Math.round(lerp(a.spo2, b.spo2 ?? a.spo2, progress)),
    temp: Math.round(lerp(a.temp, b.temp, progress) * 10) / 10,
    infected,
  };
}
