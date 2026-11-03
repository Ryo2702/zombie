export { respirationCycle as respirationSample } from '../engine/physiologyEngine.js';
export const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
export const fract = (value) => value - Math.floor(value);
const gaussian = (x, center, width) => Math.exp(-((x - center) ** 2) / (2 * width ** 2));

// Distinct P, Q, R, S and T lobes leave a quiet interval between contractions.
export function ecgSample(cycle) {
  const p = fract(cycle);
  return .12 * gaussian(p, .16, .035) - .18 * gaussian(p, .295, .012)
    + 1.08 * gaussian(p, .325, .012) - .34 * gaussian(p, .357, .016)
    + .26 * gaussian(p, .57, .07);
}

export function plethSample(cycle, instability = 0) {
  const p = fract(cycle);
  const steps = p < .12 ? .12 : p < .19 ? .36 : p < .25 ? .69 : p < .33 ? .94
    : p < .42 ? .83 : p < .49 ? .48 : p < .56 ? .62 : p < .68 ? .32 : .09;
  return steps * (1 - instability * .14 * (1 + Math.sin(Math.floor(cycle) * 2.1)))
    + instability * .025 * Math.sin(cycle * 87);
}

export function abnormalSample(cycle, time = 0) {
  const p = fract(cycle);
  return (.29 * gaussian(p, .23, .014) - 1.05 * gaussian(p, .29, .018)
    + .61 * gaussian(p, .345, .018) - .19 * gaussian(p, .5, .03))
    * (.84 + .16 * Math.sin(Math.floor(cycle) * 2.31 + time * .07));
}

export function flatlineEnvelope(time) {
  return clamp((43.7 - time) / 3.7) ** 1.5;
}

export function feverLevel(seconds) {
  const rise = 1 - Math.exp(-Math.max(0, seconds) / 1.25);
  const steps = Math.floor(rise * 10) / 10;
  return steps + (seconds > 4 ? Math.sin(seconds * 16) * .014 : 0);
}

export function seededNoise(index, seed = 67) {
  let x = (index + seed * 374761393) | 0;
  x = Math.imul(x ^ (x >>> 13), 1274126177);
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
}

export function transmissionGeometry() {
  const levels = [[{ x: 23, y: 94, generation: 0, index: 0 }]];
  for (let generation = 1; generation <= 4; generation++) {
    const count = 3 ** generation;
    const spread = 69 + generation * 3;
    const nodes = Array.from({ length: count }, (_, index) => ({
      x: [23, 115, 214, 313, 416][generation],
      y: 94 - spread + (2 * spread * (index + .5)) / count,
      generation, index,
      parent: levels[generation - 1][Math.floor(index / 3)],
    }));
    levels.push(nodes);
  }
  return levels;
}

