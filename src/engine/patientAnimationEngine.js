import { clamp, respirationCycle } from './physiologyEngine.js';

export function getPatient(time, reduced = false) {
  let state = 'STABLE';
  if (time >= 5.5) state = 'BREATHING';
  if (time >= 20) state = 'FEVER';
  if (time >= 40) state = 'DECLINE';
  if (time >= 44) state = 'DEAD';
  if (time >= 47.5) state = 'REANIMATED';
  if (time >= 59.5) state = 'OUTBREAK';
  const dead = time >= 44 && time < 47.5;
  const decline = 1 - clamp((time - 40) / 4);
  const twitchAt = [35.5, 47.5, 50.4, 60.4, 63.7].find(at => time >= at && time < at + 0.65);
  const twitch = twitchAt === undefined || reduced ? 0 : Math.sin((time - twitchAt) * 31) * Math.exp(-(time - twitchAt) * 6);
  return {
    state,
    breath: dead || time >= 47.5 ? 0 : respirationCycle(time) * decline * (state === 'BREATHING' ? 2 : 0.85),
    twitch: twitch * (state === 'OUTBREAK' ? 3.5 : 2),
    head: twitch * 1.5,
    eyes: clamp((time - 47.5) / 0.8),
  };
}
