// Development-only browser smoke test, usable where WebDriver is unavailable.
let running = false;
export async function runBrowserCheck() {
  if (running) return;
  running = true;
  const output = document.createElement('pre');
  output.id = 'browser-check';
  output.style.cssText='position:fixed;left:5px;bottom:5px;z-index:100;color:white;background:#123;padding:10px;font-size:12px;max-width:400px;white-space:pre-wrap';
  document.body.append(output);
  const wait = ms => new Promise(resolve=>setTimeout(resolve,ms));
  const failures=[], passes=[];
  const check=(ok,label)=>{(ok?passes:failures).push(label);};
  const text = selector => document.querySelector(selector)?.textContent;
  try {
    await wait(300);
    const {clock,audio,state}=window.__patientZero;
    check(!clock.state.playing && clock.state.time===0,'initial paused');
    check(audio.status==='awaiting gesture','audio gesture gating');
    const phases=new Set();
    for(const t of [0,3,6,9,12,15,18,21,24,27,30,33,36,39,42,45,48,51,54,57,60,63,67]){
      audio.seek(t);clock.seek(t);await wait(40);
      const s=state();phases.add(s.phase.id);
      check(text('[data-testid=hr]')===String(s.vitals.hr).padStart(3,'0'),`HR at ${t}`);
      check(text('[data-testid=infected]')===String(s.vitals.infected).padStart(4,'0'),`infected at ${t}`);
      check(document.querySelectorAll('.phase-indicators [aria-current=step]').length===1,`phase at ${t}`);
    }
    check(phases.size===10,'all ten phases');
    check(!!document.querySelector('.glass-cracks'),'final fracture');
    document.querySelector('.start-button').click();await wait(100);
    check(clock.state.playing&&clock.state.time<1,'replay starts');
    check(!document.querySelector('.glass-cracks'),'replay clears fracture');
    document.querySelector('[aria-label=Pause]').click();const paused=clock.state.time;await wait(100);
    check(clock.state.time===paused,'pause freezes time');
    const slider=document.querySelector('[aria-label="Simulation timeline"]');
    const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;
    setter.call(slider,'48');slider.dispatchEvent(new Event('input',{bubbles:true}));slider.dispatchEvent(new Event('change',{bubbles:true}));await wait(80);
    check(text('h1')==='THE HEART STARTED AGAIN','scrub reanimation');
    setter.call(slider,'20');slider.dispatchEvent(new Event('input',{bubbles:true}));slider.dispatchEvent(new Event('change',{bubbles:true}));await wait(80);
    check(text('h1')==='HOW A ZOMBIE OUTBREAK STARTS','scrub backward restores title');
    document.querySelector('[aria-label=Mute]').click();await wait(40);check(!!document.querySelector('[aria-label=Unmute]'),'mute toggles');
    const fx=document.querySelector('.effects-button');fx.click();await wait(40);check(fx.getAttribute('aria-pressed')==='true','reduced effects');
    audio.reset();clock.pause();clock.seek(0);clock.play();
    output.textContent=`RUNNING FULL 67-SECOND PLAYBACK…\n${passes.length} checks passed.\n${failures.join('\n')}`;
    await wait(67500);
    check(!clock.state.playing&&clock.state.time===67,'full67-second completion');
    check(text('[data-testid=hr]')==='240'&&text('[data-testid=infected]')==='0308','final telemetry');
  } catch(error) {failures.push(error.stack);}
  output.dataset.result=failures.length?'FAIL':'PASS';
  output.textContent=`${output.dataset.result}: ${passes.length} browser assertions\n${failures.join('\n')}`;
}
