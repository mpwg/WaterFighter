/** Capture a short Chrome main-thread CPU profile, not a device benchmark. */
import {chromium} from 'playwright';
import {writeFileSync} from 'node:fs';
const browser=await chromium.launch({executablePath:process.env.WATERFIGHTER_CHROME||undefined});
const page=await browser.newPage({viewport:{width:1200,height:800}});
const cdp=await page.context().newCDPSession(page);
try {
 await page.goto(process.env.WATERFIGHTER_URL??'http://127.0.0.1:4173/');
 await page.waitForFunction(()=>!document.querySelector('#run').disabled);
 await page.locator('#run').click();await page.waitForFunction(()=>document.querySelector('#state').textContent==='Läuft');
 await cdp.send('Profiler.enable');await cdp.send('Profiler.start');
 await page.waitForTimeout(15000);
 const {profile}=await cdp.send('Profiler.stop');
 writeFileSync('/tmp/waterfighter-render.cpuprofile',JSON.stringify(profile));
 const nodes=new Map(profile.nodes.map(n=>[n.id,n])),counts=new Map();
 for(const [i,id] of profile.samples.entries()){
  const n=nodes.get(id),key=`${n.callFrame.functionName||'(anonymous)'} ${n.callFrame.url}:${n.callFrame.lineNumber+1}`;
  counts.set(key,(counts.get(key)||0)+(profile.timeDeltas?.[i]||0));
 }
 console.log(JSON.stringify({browser:browser.version(),durationSeconds:15,topSelfMs:[...counts].sort((a,b)=>b[1]-a[1]).slice(0,15).map(([name,us])=>({name,ms:us/1000}))},null,2));
} finally {await browser.close();}
