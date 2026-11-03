import { gsap } from 'gsap';
import { DURATION } from './storyTimeline.js';
import { clamp } from './physiologyEngine.js';

export function createSimulationClock(onFrame) {
  const cursor = { time: 0 };
  const timeline = gsap.timeline({ paused: true }).to(cursor, { time: DURATION, duration: DURATION, ease: 'none' });
  let playing = false;
  let rate = 1;
  let frame = null;
  let previous = 0;
  let disposed = false;
  const report = () => onFrame({ time: cursor.time, playing, rate });
  const tick = now => {
    if (!playing || disposed) return;
    const target = Math.min(DURATION, cursor.time + (now - previous) / 1000 * rate);
    previous = now;
    timeline.time(target, true);
    if (target >= DURATION) playing = false;
    report();
    frame = playing ? requestAnimationFrame(tick) : null;
  };
  return {
    get state() { return { time: cursor.time, playing, rate }; },
    play() {
      if (playing || disposed) return;
      if (cursor.time >= DURATION) timeline.time(0, true);
      playing = true;
      previous = performance.now();
      report();
      frame = requestAnimationFrame(tick);
    },
    pause() {
      playing = false;
      cancelAnimationFrame(frame);
      frame = null;
      report();
    },
    seek(time) {
      timeline.time(clamp(Number.isFinite(time) ? time : 0, 0, DURATION), true);
      previous = performance.now();
      if (cursor.time >= DURATION) {
        playing = false;
        cancelAnimationFrame(frame);
        frame = null;
      }
      report();
    },
    restart() { this.pause(); this.seek(0); this.play(); },
    setRate(value) { rate = clamp(Number.isFinite(value) ? value : 1, 0.1, 4); },
    dispose() { disposed = true; playing = false; cancelAnimationFrame(frame); timeline.kill(); },
  };
}
