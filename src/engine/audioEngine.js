import { EVENTS } from '../data/glitchEvents.js';
import { cardiacCycles, clamp, respirationCycle } from './physiologyEngine.js';
import { seededNoise } from './glitchEngine.js';

export function createAudioEngine() {
  let context;
  let master;
  let gate;
  let flatline;
  let rumble;
  let respiration;
  let siren;
  let sirenPitch;
  let alarm;
  let soundtrackBuffer;
  let soundtrackLoad;
  let soundtrack;
  let soundtrackEnvelope;
  let soundtrackGain;
  let soundtrackStart = 0;
  let soundtrackOffset = 0;
  let soundtrackRate = 1;
  let volume = 0.5;
  let muted = false;
  let previous = null;
  let wasPlaying = false;
  let disposed = false;
  let unavailable = false;
  const continuous = [];
  const transient = new Set();
  const soundtrackVoices = new Set();

  function stopSoundtrack() {
    if (!soundtrack) return;
    const now = context.currentTime;
    soundtrackEnvelope.gain.cancelScheduledValues(now);
    soundtrackEnvelope.gain.setTargetAtTime(0, now, 0.003);
    soundtrack.stop(now + 0.015);
    soundtrack = null;
  }

  function clearSounds() {
    stopSoundtrack();
    for (const source of transient) {
      try { source.stop(); } catch { /* A source may already have ended. */ }
      source.disconnect();
    }
    transient.clear();
  }

  function tone(frequency, duration = 0.09, gain = 0.12, type = 'sine', endFrequency) {
    if (!context || muted || disposed || context.state !== 'running') return;
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    const now = context.currentTime;
    // Briefly make space for the foreground monitor and warning tones.
    soundtrackGain.gain.cancelScheduledValues(now);
    soundtrackGain.gain.setTargetAtTime(0.35, now, 0.008);
    soundtrackGain.gain.setTargetAtTime(0.65, now + duration, 0.08);
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    if (endFrequency) oscillator.frequency.exponentialRampToValueAtTime(endFrequency, now + duration);
    envelope.gain.setValueAtTime(0.0001, now);
    envelope.gain.exponentialRampToValueAtTime(gain, now + Math.min(0.008, duration / 4));
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(envelope).connect(gate);
    transient.add(oscillator);
    oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect(); transient.delete(oscillator); };
    oscillator.start(now);
    oscillator.stop(now + duration + 0.01);
  }

  function noise(duration, gain, frequency = 1400) {
    if (!context || muted || context.state !== 'running') return;
    const source = context.createBufferSource();
    source.buffer = continuous[0].buffer;
    const filter = context.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = frequency;
    const envelope = context.createGain();
    envelope.gain.setValueAtTime(gain, context.currentTime);
    envelope.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
    source.connect(filter).connect(envelope).connect(gate);
    transient.add(source);
    source.onended = () => { source.disconnect(); filter.disconnect(); envelope.disconnect(); transient.delete(source); };
    source.start();
    source.stop(context.currentTime + duration);
  }

  function eventSound(event) {
    switch (event.audio) {
      case 'warning': tone(540, 0.18, 0.12, 'triangle'); break;
      case 'fever': tone(880, 0.2, 0.11, 'triangle', 660); noise(0.14, 0.035); break;
      case 'mutation': tone(1300, 0.12, 0.055, 'square', 420); noise(0.13, 0.06); break;
      case 'impact': tone(85, 0.45, 0.35, 'sine', 30); noise(0.16, 0.2, 750); break;
      case 'lastBeat': tone(620, 0.12, 0.09); break;
      case 'reanimation': tone(75, 1.2, 0.4, 'sine', 27); noise(0.25, 0.22); break;
      case 'generation': tone(380 + (event.time - 54) * 75, 0.15, 0.16, 'triangle'); break;
      case 'outbreak': tone(96, 0.65, 0.3, 'sawtooth', 30); noise(0.3, 0.18); break;
      case 'fracture': noise(0.8, 0.4, 2400); tone(54, 0.9, 0.38, 'sine', 24); break;
      default: break;
    }
  }

  async function init() {
    if (disposed) return false;
    if (!context) {
      const AudioContext = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!AudioContext) { unavailable = true; return false; }
      try {
        context = new AudioContext();
        master = context.createGain();
        master.gain.value = muted ? 0 : volume;
        master.connect(context.destination);
        gate = context.createGain();
        gate.gain.value = 0;
        gate.connect(master);
        const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
        const samples = buffer.getChannelData(0);
        for (let i = 0; i < samples.length; i++) samples[i] = seededNoise(i + 67) * 2 - 1;
        const air = context.createBufferSource();
        air.buffer = buffer;
        air.loop = true;
        const filter = context.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 320;
        const airGain = context.createGain();
        airGain.gain.value = 0.085;
        air.connect(filter).connect(airGain).connect(gate);
        air.start();
        continuous.push(air);
        respiration = context.createGain();
        respiration.gain.value = 0;
        filter.connect(respiration).connect(gate);
        const oscillator = (frequency, gain) => {
          const source = context.createOscillator();
          const envelope = context.createGain();
          source.frequency.value = frequency;
          envelope.gain.value = gain;
          source.connect(envelope).connect(gate);
          source.start();
          continuous.push(source);
          return envelope;
        };
        oscillator(60, 0.012);
        flatline = oscillator(820, 0);
        rumble = oscillator(32, 0);
        siren = oscillator(460, 0);
        sirenPitch = continuous.at(-1).frequency;
        alarm = oscillator(920, 0);
        soundtrackGain = context.createGain();
        soundtrackGain.gain.value = 0.65;
        soundtrackGain.connect(gate);
      } catch {
        unavailable = true;
        for (const source of continuous) { try { source.stop(); } catch { /* Initialization may be incomplete. */ } source.disconnect(); }
        continuous.length = 0;
        if (context && context.state !== 'closed') context.close().catch(() => {});
        context = null;
        return false;
      }
    }
    try {
      // Resume during the gesture; loading may finish after the simulation starts.
      const resumed = context.resume();
      if (!soundtrackBuffer && !soundtrackLoad) {
        const activeContext = context;
        soundtrackLoad = (async () => {
          // WAV also supports browsers without an Ogg Vorbis decoder.
          for (const extension of ['ogg', 'wav']) {
            try {
              const response = await fetch(`${import.meta.env?.BASE_URL ?? '/'}audio/patient-zero.${extension}`, { signal: AbortSignal.timeout(10000) });
              if (!response.ok) throw new Error(`Soundtrack HTTP ${response.status}`);
              const buffer = await activeContext.decodeAudioData(await response.arrayBuffer());
              if (!disposed && context === activeContext) soundtrackBuffer = buffer;
              return;
            } catch (error) {
              if (disposed || extension === 'wav') throw error;
            }
          }
        })().finally(() => { soundtrackLoad = null; });
      }
      await Promise.all([resumed, soundtrackLoad]);
      if (disposed) return false;
      unavailable = false;
      return true;
    } catch { unavailable = true; return false; }
  }

  return {
    init,
    get status() { return unavailable ? 'unavailable' : !context ? 'awaiting gesture' : muted ? 'muted' : context.state !== 'running' ? context.state : wasPlaying ? 'playing' : 'paused'; },
    setVolume(value) {
      volume = clamp(Number.isFinite(value) ? value : 0.5);
      if (master) master.gain.setTargetAtTime(muted ? 0 : volume, context.currentTime, 0.02);
    },
    setMuted(value) {
      muted = Boolean(value);
      if (master) master.gain.setTargetAtTime(muted ? 0 : volume, context.currentTime, 0.015);
    },
    seek(time = 0) {
      previous = time;
      clearSounds();
      for (const layer of [flatline, rumble, respiration, siren, alarm]) {
        if (layer) layer.gain.setTargetAtTime(0, context.currentTime, 0.01);
      }
    },
    reset() { this.seek(0); },
    update(time, playing, vitals, phase, rate = 1) {
      if (!context || disposed) { previous = time; return; }
      const now = context.currentTime;
      gate.gain.setTargetAtTime(playing ? 1 : 0, now, 0.02);
      if (!playing) {
        if (wasPlaying) clearSounds();
        wasPlaying = false;
        previous = time;
        return;
      }
      if (soundtrackBuffer && context.state === 'running' && time < soundtrackBuffer.duration) {
        const position = soundtrackOffset + (now - soundtrackStart) * soundtrackRate;
        if (soundtrack && (Math.abs(position - time) > 0.12 || rate !== soundtrackRate)) stopSoundtrack();
        if (!soundtrack) {
          soundtrack = context.createBufferSource();
          soundtrackEnvelope = context.createGain();
          soundtrackEnvelope.gain.value = 0;
          soundtrackEnvelope.gain.setTargetAtTime(1, now, 0.003);
          soundtrack.buffer = soundtrackBuffer;
          soundtrack.playbackRate.value = rate;
          soundtrack.connect(soundtrackEnvelope).connect(soundtrackGain);
          const source = soundtrack, envelope = soundtrackEnvelope;
          soundtrackVoices.add(source);
          source.onended = () => { source.disconnect(); envelope.disconnect(); soundtrackVoices.delete(source); };
          soundtrack.start(now, Math.max(0, time));
          soundtrackStart = now;
          soundtrackOffset = time;
          soundtrackRate = rate;
        }
      }
      flatline.gain.setTargetAtTime(vitals.hr === 0 && phase.id === 'flatline' ? 0.085 : 0, now, 0.06);
      rumble.gain.setTargetAtTime(time >= 47.5 ? 0.04 + clamp((time - 59.5) / 5) * 0.045 : 0, now, 0.1);
      respiration.gain.setTargetAtTime(phase.id === 'breathing' ? 0.07 * respirationCycle(time) : 0, now, 0.07);
      siren.gain.setTargetAtTime(time >= 47.5 ? clamp((time - 47.5) / 0.6) * 0.028 * (1 - clamp((time - 64) / 2)) : 0, now, 0.08);
      sirenPitch.setTargetAtTime(460 + Math.sin((time - 47.5) * Math.PI / 0.9) * 120, now, 0.04);
      const alarmPulse = time >= 59.5 && Math.floor((time - 59.5) / 0.18) % 4 < 2;
      alarm.gain.setTargetAtTime(alarmPulse ? 0.045 * (1 - clamp((time - 64) / 2)) : 0, now, 0.012);
      const gap = previous === null ? 0 : time - previous;
      if (previous !== null && gap >= 0 && gap < 0.4 && wasPlaying) {
        const peak = time >= 47 ? 0.29 : 0.325;
        if (vitals.hr > 0 && Math.floor(cardiacCycles(time) - peak) > Math.floor(cardiacCycles(previous) - peak)) {
          const pitch = time >= 47 ? 490 : 740 - (98 - (vitals.spo2 ?? 58)) * 4;
          tone(pitch, time >= 47 ? 0.055 : 0.09, time >= 47 ? 0.09 : 0.12, 'sine');
        }
        for (const event of EVENTS) if (event.time > previous && event.time <= time) eventSound(event);
      }
      wasPlaying = true;
      previous = time;
    },
    dispose() {
      disposed = true;
      clearSounds();
      for (const source of soundtrackVoices) { source.stop(); source.disconnect(); }
      soundtrackVoices.clear();
      for (const source of continuous) { try { source.stop(); } catch { /* Already stopped. */ } source.disconnect(); }
      continuous.length = 0;
      if (context && context.state !== 'closed') context.close().catch(() => {});
      context = null;
    },
  };
}
