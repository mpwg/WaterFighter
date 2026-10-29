/* Optional browser-console diagnostic, no network or backend. */
(() => {
  if (window.waterfighterMeasurement) window.waterfighterMeasurement.stop();
  const frames = [], actions = [], samples = [], visibility = [];
  let current = null, lastFrame = null, lastFrameEligible = false, raf = 0, stopped = false;
  let previousSample = null, observedWallMs = 0, observedSimSeconds = 0;
  const start = performance.now();
  const eligible = () => document.visibilityState === 'visible' && current?.running && current?.speed === 1;
  const diagnostic = event => {
    const d = event.detail, now = performance.now(), active = document.visibilityState === 'visible' && d.running && d.speed === 1;
    if (previousSample && previousSample.active && active && previousSample.round === d.round) {
      observedWallMs += now - previousSample.wall;
      observedSimSeconds += Math.max(0,d.time-previousSample.sim);
    }
    previousSample = {wall:now,sim:d.time,active,round:d.round};
    current = d;
    if (!samples.length || now-samples[samples.length-1].wall>=1000 || samples[samples.length-1].round!==d.round)
      samples.push({wall:now,round:d.round,sim:d.time,backlog:d.backlog,running:d.running,speed:d.speed,visible:document.visibilityState==='visible'});
  };
  const action = event => actions.push({...event.detail,visible:document.visibilityState==='visible',running:!!current?.running,speed:current?.speed??null});
  const visibilityChange = () => {visibility.push({wall:performance.now(),state:document.visibilityState});lastFrameEligible=false;previousSample=null;};
  const frame = now => {
    if(stopped)return;
    const active=eligible();
    if(active && lastFrameEligible && lastFrame!==null) frames.push(now-lastFrame);
    lastFrame=now;lastFrameEligible=active;raf=requestAnimationFrame(frame);
  };
  const percentile = (values,p) => {if(!values.length)return null;const a=[...values].sort((x,y)=>x-y);return a[Math.min(a.length-1,Math.ceil(a.length*p)-1)];};
  window.addEventListener('waterfighter:diagnostics',diagnostic);
  window.addEventListener('waterfighter:action-displayed',action);
  document.addEventListener('visibilitychange',visibilityChange);
  visibility.push({wall:start,state:document.visibilityState});raf=requestAnimationFrame(frame);
  window.waterfighterMeasurement={stop() {
    if(stopped)return null;stopped=true;cancelAnimationFrame(raf);
    window.removeEventListener('waterfighter:diagnostics',diagnostic);
    window.removeEventListener('waterfighter:action-displayed',action);
    document.removeEventListener('visibilitychange',visibilityChange);
    const activeActions=actions.filter(a=>a.confirmedVisible&&a.confirmedRunning&&a.confirmedSpeed===1&&a.visible);
    const report={method:'requestAnimationFrame intervals during visible 1× simulation; first Babylon after-render following confirmed revision',userAgent:navigator.userAgent,startedAtMonotonicMs:start,endedAtMonotonicMs:performance.now(),frameCount:frames.length,frameTimeP95Ms:percentile(frames,.95),frameTimeMaxMs:frames.length?frames.reduce((max,value)=>Math.max(max,value),0):null,observedWallMs,observedSimSeconds,simSecondsPerWallSecond:observedWallMs>0?observedSimSeconds/(observedWallMs/1000):null,actions,active1xActionP95Ms:percentile(activeActions.map(a=>a.latencyMs),.95),active1xActionsOver200ms:activeActions.filter(a=>a.latencyMs>200).length,visibility,samples};
    delete window.waterfighterMeasurement;return report;
  }};
  console.info('WaterFighter-Messung läuft. Abschluss: waterfighterMeasurement.stop()');
})();
