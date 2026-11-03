import { EVENTS } from '../data/glitchEvents.js';
import { clamp } from './physiologyEngine.js';

export function seededNoise(seed) {
  let n = seed | 0;
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}

export function getGlitch(time, phase, reduced = false) {
  const active = EVENTS.filter(event => time >= event.time && time < event.time + event.duration);
  const event = active.reduce((best, current) => !best || current.impact > best.impact ? current : best, null);
  const envelope = event ? event.impact * (1 - (time - event.time) / event.duration) : 0;
  const profile = phase.profile;
  const severity = ({ STABLE: 0.03, WARNING: 0.15, CRITICAL: 0.4, OUTBREAK: 0.65 })[profile];
  const frame = Math.floor(time * 18);
  const occasional = seededNoise(frame + 203) > 0.97 && profile !== 'STABLE' ? severity * 0.35 : 0;
  const burst = reduced ? 0 : Math.max(envelope, occasional);
  const shake = event && ['BITE_IMPACT', 'REANIMATION', 'GLASS_FRACTURE'].includes(event.id) ? burst : 0;
  return {
    profile, severity, noise: reduced ? 0.018 : 0.025 + severity * 0.11,
    rgb: burst * (profile === 'OUTBREAK' ? 4 : 3),
    tear: burst * (profile === 'OUTBREAK' ? 18 : 9),
    shakeX: shake ? (seededNoise(frame + 3) - 0.5) * shake * 9 : 0,
    shakeY: shake ? (seededNoise(frame + 9) - 0.5) * shake * 6 : 0,
    rotation: shake ? (seededNoise(frame + 11) - 0.5) * shake * 0.45 : 0,
    brightness: 1 - burst * 0.14,
    blackout: !reduced && event?.id === 'REANIMATION' && time - event.time < 0.075,
    crackProgress: clamp((time - 60.4) / 0.55),
    activeEvent: event?.id ?? null,
  };
}
