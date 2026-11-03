import { clamp } from './physiologyEngine.js';

export function getLighting(time, reduced = false) {
  const death = clamp((time - 40) / 4) * (1 - clamp((time - 47) / 0.7));
  const red = clamp((time - 47.25) / 1.2);
  const outbreak = clamp((time - 59.5) / 1.5);
  const beacon = red * (reduced ? 0.7 : 0.55 + Math.sin(time * 3.4) * 0.25);
  return {
    ambient: 1 - death * 0.64 - red * 0.2,
    red: red * (0.58 + outbreak * 0.32),
    amber: clamp((time - 20) / 6) * (1 - clamp((time - 32.5) / 2)) * 0.25,
    beacon,
    fluorescent: (1 - death * 0.8) * (1 - red * 0.64),
  };
}
