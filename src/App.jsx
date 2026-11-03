import { useEffect, useRef, useState } from 'react';
import HospitalScene from './components/HospitalScene.jsx';
import MedicalMonitor from './components/MedicalMonitor.jsx';
import PlaybackControls from './components/PlaybackControls.jsx';
import { createSimulationClock } from './engine/simulationClock.js';
import { createAudioEngine } from './engine/audioEngine.js';
import { deriveState } from './engine/storyTimeline.js';
import { renderMonitor } from './renderers/MonitorRenderer.js';

export default function App() {
  const [view, setView] = useState(() => ({...deriveState(0), playing:false}));
  const [scale, setScale] = useState(1);
  const [started,setStarted] = useState(false);
  const [muted,setMuted] = useState(false);
  const [volume,setVolume] = useState(.5);
  const [reduced,setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [rate,setRate] = useState(1);
  const [audioStatus,setAudioStatus] = useState('awaiting gesture');
  const canvasRef = useRef(null), stageRef = useRef(null), clockRef = useRef(null), audioRef = useRef(null);
  const reducedRef = useRef(reduced), frameRate = useRef(60), lastFrame = useRef(0);
  const debug = import.meta.env.DEV && new URLSearchParams(location.search).has('debug');

  useEffect(() => {
    const resize = () => setScale(Math.min((innerWidth < 640 ? innerWidth : innerWidth - 64)/576, (innerHeight < 600 ? innerHeight : innerHeight - (innerWidth < 640 ? 0 : 48))/1024));
    resize(); addEventListener('resize', resize);
    return () => removeEventListener('resize', resize);
  }, []);
  useEffect(() => {
    let lastUI = -1, lastPlaying = false, lastPhase = -1;
    const audio = createAudioEngine();
    audioRef.current = audio;
    const clock = createSimulationClock(({time,playing,rate}) => {
      const state = deriveState(time,reducedRef.current);
      const canvas = canvasRef.current;
      if (canvas) {
        const dpr = Math.min(devicePixelRatio || 1,2);
        if (canvas.width !== Math.round(440*dpr)) { canvas.width = Math.round(440*dpr); canvas.height = Math.round(190*dpr); }
        const ctx = canvas.getContext('2d');
        ctx.setTransform(dpr,0,0,dpr,0,0);
        renderMonitor(ctx,440,190,state,reducedRef.current);
      }
      if (stageRef.current) stageRef.current.style.transform = `translate(${state.glitch.shakeX}px,${state.glitch.shakeY}px) rotate(${state.glitch.rotation}deg)`;
      audio.update(time,playing,state.vitals,state.phase,rate);
      const now = performance.now();
      if (lastFrame.current) frameRate.current = frameRate.current*.9 + Math.min(120,1000/(now-lastFrame.current))*.1;
      lastFrame.current = now;
      if (!playing || playing !== lastPlaying || state.phaseIndex !== lastPhase || Math.abs(time-lastUI) >= 1/15) {
        setView({...state,playing}); lastUI=time; lastPlaying=playing; lastPhase=state.phaseIndex;
      }
    });
    clockRef.current = clock;
    clock.seek(debug ? Number(new URLSearchParams(location.search).get('time')) || 0 : 0);
    const visibility = () => { if (document.hidden) clock.pause(); };
    document.addEventListener('visibilitychange',visibility);
    if (debug) {
      window.__patientZero = {clock, audio, state: () => deriveState(clock.state.time,reducedRef.current)};
      if (new URLSearchParams(location.search).has('qa')) import('./browserCheck.js').then(({runBrowserCheck})=>runBrowserCheck());
    }
    return () => {clock.dispose();audio.dispose();document.removeEventListener('visibilitychange',visibility);delete window.__patientZero;};
  },[debug]);
  useEffect(() => { reducedRef.current = reduced; if(clockRef.current) clockRef.current.seek(clockRef.current.state.time); },[reduced]);
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = e => setReduced(e.matches);
    media.addEventListener('change',onChange);return()=>media.removeEventListener('change',onChange);
  },[]);

  const enableAudio = () => audioRef.current.init().then(()=>setAudioStatus(audioRef.current.status)).catch(()=>setAudioStatus('unavailable'));
  const play = async () => {
    const c = clockRef.current;
    if (c.state.playing) { c.pause(); return; }
    await enableAudio();
    if (document.hidden) return;
    setStarted(true);
    if (c.state.time >= 67) audioRef.current.reset();
    c.play();
  };
  const seek = time => { audioRef.current.seek(time); clockRef.current.seek(time); };
  const replay = async () => {await enableAudio();if(document.hidden)return;setStarted(true);audioRef.current.reset();clockRef.current.restart();};
  const mute = () => {enableAudio();setMuted(value=>{audioRef.current.setMuted(!value);return !value;});};
  const changeVolume = value => {enableAudio();setVolume(value);setMuted(false);audioRef.current.setMuted(false);audioRef.current.setVolume(value);};
  useEffect(() => {
    const key = e => {
      if (/INPUT|BUTTON|SELECT/.test(e.target.tagName)) return;
      if(e.code==='Space') {e.preventDefault();play();}
      if(e.code==='ArrowRight') {e.preventDefault();seek(Math.min(67,clockRef.current.state.time+5));}
      if(e.code==='ArrowLeft') {e.preventDefault();seek(Math.max(0,clockRef.current.state.time-5));}
      if(e.code==='KeyM') mute();
    };addEventListener('keydown',key);return()=>removeEventListener('keydown',key);
  });

  return <main className={`experience ${view.time>=47?'emergency':''}`}>
    <div className="desktop-identity" aria-hidden="true"><span className="identity-mark">✚</span><div>PATIENT ZERO<small>AN OUTBREAK IN 67 SECONDS</small></div></div>
    <div className="desktop-record" aria-hidden="true"><span className="record-dot"/> RECONSTRUCTION 001<small>WARD 67 / ISOLATION PROTOCOL</small></div>
    <div className="ambient-room" aria-hidden="true"/>
    <div className="scene-frame" style={{width:576*scale,height:1024*scale}}>
      <div className="scene-scaler" style={{transform:`scale(${scale})`}}>
        <div className="scene" ref={stageRef}>
          <HospitalScene state={view}/>
          <div className="recording-meta"><span>REC <i/> {`00:${String(Math.floor(view.time)).padStart(2,'0')}:${String(Math.floor(view.time%1*30)).padStart(2,'0')}`}</span><span>CAM 07 · ISOLATION</span></div>
          <header className={`narrative-banner ${view.time>=47?'later':''}`}><div className="banner-eyebrow">A CLINICAL OBSERVATION</div><h1>{view.headline}</h1><p>{view.time>=59.5?'Containment is no longer possible.':view.time>=53.5?'One becomes three. Three becomes everyone.':view.time>=47?'But it isn’t a heartbeat anymore.':'Its first 67 seconds, as math.'}</p></header>
          <MedicalMonitor state={view} canvasRef={canvasRef} reduced={reduced}/>
          <div className="case-label"><span>SUBJECT 001</span><span>DO NOT REMOVE RESTRAINTS</span></div>
          <div className="scene-vignette"/><div className="scene-grain"/>
        </div>
        <PlaybackControls time={view.time} playing={view.playing} started={started} muted={muted} volume={volume} reduced={reduced} onPlay={play} onSeek={seek} onMute={mute} onVolume={changeVolume} onReduced={()=>setReduced(v=>!v)} onReplay={replay}/>
      </div>
    </div>
    <div className="desktop-side-label left-label" aria-hidden="true">DEPARTMENT OF BIOLOGICAL CONTAINMENT</div><div className="desktop-side-label right-label" aria-hidden="true">OBSERVATION IN PROGRESS · DO NOT INTERVENE</div>
    <footer className="desktop-footer"><span>EXPERIMENT PZ—001</span><span>FICTIONAL MEDICAL HORROR · INTERACTIVE STUDY</span><span>SPACE TO {view.playing?'PAUSE':'PLAY'}</span></footer>
    {debug && !new URLSearchParams(location.search).has('clean') && <aside className="debug-panel"><b>DEVELOPMENT / LIVE STATE</b><pre>{JSON.stringify({time:+view.time.toFixed(2),phase:view.phase.id,...view.vitals,glitch:view.glitch.severity,event:view.glitch.activeEvent,fps:Math.round(frameRate.current),resolution:`${canvasRef.current?.width}×${canvasRef.current?.height}`,reduced,audio:audioRef.current?.status || audioStatus},null,2)}</pre><div>{[0,12,21,27,36,45,48,54,60,67].map(t=><button key={t} onClick={()=>seek(t)}>{t}s</button>)}</div><label>Rate <select value={rate} onChange={e=>{setRate(+e.target.value);clockRef.current.setRate(+e.target.value);}}>{[.25,.5,1,2,4].map(r=><option key={r}>{r}</option>)}</select></label><button onClick={()=>{const a=document.createElement('a');a.download=`patient-zero-signal-${view.time.toFixed(2)}.png`;a.href=canvasRef.current.toDataURL();a.click();}}>Export signal PNG</button></aside>}
  </main>;
}
