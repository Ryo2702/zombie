import { PHASES } from '../data/phases.js';
import { EVENTS } from '../data/glitchEvents.js';
import { clamp, getVitals } from './physiologyEngine.js';
import { getGlitch } from './glitchEngine.js';
import { getLighting } from './lightingEngine.js';
import { getPatient } from './patientAnimationEngine.js';

export { PHASES, EVENTS };
export const DURATION = 67;

export function deriveState(time, reduced = false) {
  const t = clamp(Number.isFinite(time) ? time : 0, 0, DURATION);
  const phaseIndex = PHASES.findLastIndex(phase => t >= phase.start);
  const phase = PHASES[phaseIndex];
  return {
    time: t, phase, phaseIndex, vitals: getVitals(t),
    glitch: getGlitch(t, phase, reduced), lighting: getLighting(t, reduced), patient: getPatient(t, reduced),
    events: EVENTS.filter(event => t >= event.time && t < event.time + event.duration),
    headline: t >= 59.5 ? 'OUTBREAK' : t >= 53.5 ? "IT’S SPREADING" : t >= 47 ? 'THE HEART STARTED AGAIN' : 'HOW A ZOMBIE OUTBREAK STARTS',
  };
}
