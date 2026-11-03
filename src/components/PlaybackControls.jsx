const clockText = t => `${String(Math.floor(t/60)).padStart(2,'0')}:${String(Math.floor(t%60)).padStart(2,'0')}`;
export default function PlaybackControls({ time, playing, started, muted, volume, reduced, onPlay, onSeek, onMute, onVolume, onReduced, onReplay }) {
  const ended = time >= 67;
  return <div className={`playback-controls ${playing?'is-playing':''}`}>
    {(!playing || !started) && <button className="start-button" onClick={ended?onReplay:onPlay}><span>{ended?'↻':'▶'}</span>{ended ? 'REPLAY SIMULATION' : !started ? 'START SIMULATION' : 'RESUME SIMULATION'}<span className="button-code">{ended?'RESET':'67 SEC'}</span></button>}
    <div className="control-console">
      <div className="transport-row"><button className="icon-button" onClick={ended?onReplay:onPlay} aria-label={ended?'Replay':playing?'Pause':'Play'}>{ended?'↻':playing?<span className="pause-icon"/>:'▶'}</button><span className="playback-time">{clockText(time)} <span>/ 01:07</span></span><span className="transport-spacer"/><button className="icon-button volume-button" onClick={onMute} aria-label={muted?'Unmute':'Mute'}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M4 9h4l5-4v14l-5-4H4z"/>{muted?<path d="m17 9 5 6m0-6-5 6"/>:<><path d="M16 8q5 4 0 8M19 5q8 7 0 14"/></>}</svg></button><input className="volume-slider" type="range" min="0" max="1" step=".05" value={muted?0:volume} onChange={e=>onVolume(+e.target.value)} aria-label="Volume"/><button className={`effects-button ${reduced?'enabled':''}`} onClick={onReduced} aria-pressed={reduced} title="Reduce shake, flicker, and distortion"><span className="effects-dot"/>REDUCED FX</button></div>
      <div className="timeline-track"><div className="timeline-marks">{[0,5.5,11.5,20,26.5,32.5,40,47,53.5,59.5].map(t=><i key={t} style={{left:`${t/67*100}%`}}/>)}</div><input type="range" className="timeline" min="0" max="67" step=".01" value={time} onChange={e=>onSeek(+e.target.value)} aria-label="Simulation timeline" aria-valuetext={`${time.toFixed(1)} seconds of 67 seconds`} style={{'--progress':`${time/67*100}%`}}/></div>
    </div>
    <div className="control-footnote"><span>FICTIONAL SCENARIO · MATHEMATICAL STUDY</span><span>HEADPHONES RECOMMENDED</span></div>
  </div>;
}
