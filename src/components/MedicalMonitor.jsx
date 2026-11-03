import { memo } from 'react';
import { PHASES } from '../engine/storyTimeline.js';
import { fracturePaths } from '../renderers/CrackRenderer.js';
import MathExplanation from './MathExplanation.jsx';

export function getAlert(state) {
  const { time, phase } = state;
  if (time >= 59.5) return 'CONTAINMENT FAILED';
  if (time >= 53.5) return 'R₀ = 3 · TRANSMISSION ACTIVE';
  if (time >= 47) return 'RHYTHM UNKNOWN';
  if (time >= 44) return 'ASYSTOLE';
  if (time >= 40) return 'CRITICAL · SIGNAL LOSS';
  if (time >= 35.5 && time < 36.25) return 'LEADS OFF';
  if (phase.signal === 'dna') return 'GENETIC INSTABILITY';
  if (time >= 20 && time < 26.5) return 'TEMP HIGH';
  if (time >= 16.5 && time < 20) return 'SpO₂ LOW';
  return '';
}



export default memo(function MedicalMonitor({ state, canvasRef, reduced }) {
  const { vitals, phaseIndex, phase, time, glitch } = state;
  const alert = getAlert(state);
  const critical = time >= 47;
  return <section className={`medical-monitor ${critical ? 'critical' : ''}`} aria-label="Patient medical monitor" style={{ '--trace': phase.color }}>
    <div className="monitor-brand"><span className="brand-cross">✚</span> VITALIS <span className="model">VM–67 / MULTIPARAMETER</span><span className="power-led"/></div>
    <i className="screw screw-tl"/><i className="screw screw-tr"/><i className="screw screw-bl"/><i className="screw screw-br"/>
    <div className="monitor-glass" style={{ filter: `brightness(${glitch.blackout ? .12 : glitch.brightness})` }}>
      <div className="monitor-header"><span className="channel-label">{phase.channel}</span><span>BED 07</span><span className="patient-label">PATIENT ZERO</span></div>
      <div className="signal-area"><div className="signal-scale">{phase.signal === 'fever' ? '42°C' : phase.signal === 'resp' ? '30 mmHg' : '1 mV'}</div><canvas ref={canvasRef} width="880" height="380" aria-label={`${phase.name} medical signal`} role="img"/><div className="signal-baseline">{phase.signal === 'fever' ? '37°C' : '25 mm/s'}</div><span className="signal-status">{time < 40 ? '● LIVE' : time < 47 ? '● NO RESPONSE' : '● UNCLASSIFIED'}</span></div>
      <div className={`medical-alert ${alert ? 'visible' : ''}`} role="status">{alert || 'SIGNAL ACQUIRED'}{time >= 44 && time < 47 && <span>TIME OF DEATH: 0:43</span>}</div>
      <div className="vital-signs">
        <div className="vital hr"><label>HR <small>bpm</small></label><strong data-testid="hr">{String(vitals.hr).padStart(3,'0')}</strong><span>♥</span></div>
        <div className="vital oxygen"><label>SpO₂ <small>%</small></label><strong data-testid="spo2">{vitals.spo2 === null ? '––' : vitals.spo2}</strong><span>⌁</span></div>
        <div className="vital temperature"><label>TEMP <small>°C</small></label><strong data-testid="temp">{vitals.temp.toFixed(1)}</strong></div>
        <div className="vital infected"><label>INFECTED</label><strong data-testid="infected">{String(vitals.infected).padStart(4,'0')}</strong><span className="infected-caption">CONFIRMED</span></div>
      </div>
      <div className="glass-reflection"/><div className="scanlines"/>
      {time >= 60.4 && <svg className="glass-cracks" viewBox="0 0 440 300" preserveAspectRatio="none" aria-hidden="true"><g fill="none" stroke="#d9e6df" strokeLinecap="round">{fracturePaths.map(({d,width,delay},i) => <path key={d} d={d} pathLength="1" strokeWidth={width} opacity={i<7 ? .85 : .55} strokeDasharray="1" strokeDashoffset={1 - Math.min(1, Math.max(0,(glitch.crackProgress-delay) * 1.5))} />)}</g><circle cx="326" cy="122" r="2" fill="#edf4ec"/></svg>}
    </div>
    <div className="phase-indicators" aria-label="Story phases">{PHASES.map((p,i) => <div key={p.id} aria-current={i===phaseIndex ? 'step' : undefined} className={`${i===phaseIndex?'active':''} ${i<phaseIndex?'complete':''} ${time>=59.5?'failed':''}`}><span className="phase-light"/>{p.name}</div>)}</div>
    <MathExplanation phase={{...phase,index:phaseIndex}} reduced={reduced}/>
    <div className="monitor-bottom"><span>ISOLATION UNIT · CONTINUOUS OBSERVATION</span><div className="speaker-grille"/><span className="monitor-knob"/></div>
  </section>;
});
