/** Capture Chrome timeline events for diagnosis, not a device benchmark. */
import {chromium} from 'playwright';
import {writeFileSync} from 'node:fs';
const browser=await chromium.launch({executablePath:process.env.WATERFIGHTER_CHROME||undefined});
const page=await browser.newPage({viewport:{width:1200,height:800}});
const cdp=await browser.newBrowserCDPSession();
try {
 await page.goto(process.env.WATERFIGHTER_URL??'http://127.0.0.1:4173/');
 await page.waitForFunction(()=>!document.querySelector('#run').disabled);
 await page.locator('#run').click();await page.waitForFunction(()=>document.querySelector('#state').textContent==='Läuft');
 const done=new Promise(resolve=>cdp.once('Tracing.tracingComplete',resolve));
 await cdp.send('Tracing.start',{categories:'devtools.timeline,disabled-by-default-devtools.timeline,blink,cc,gpu',transferMode:'ReturnAsStream'});
 await page.waitForTimeout(10000);await cdp.send('Tracing.end');
 const {stream}=await done;let content='';
 for(;;){const chunk=await cdp.send('IO.read',{handle:stream});content+=chunk.data;if(chunk.eof)break;}
 await cdp.send('IO.close',{handle:stream});
 writeFileSync('/tmp/waterfighter-render-trace.json',content);
 const trace=JSON.parse(content),totals=new Map();
 for(const e of trace.traceEvents)if(e.ph==='X' && typeof e.dur==='number'){
  const key=`${e.pid}/${e.tid} ${e.name}`,t=totals.get(key)||{name:e.name,pid:e.pid,tid:e.tid,count:0,totalMs:0,maxMs:0};
  t.count++;t.totalMs+=e.dur/1000;t.maxMs=Math.max(t.maxMs,e.dur/1000);totals.set(key,t);
 }
 console.log(JSON.stringify({browser:browser.version(),captureSeconds:10,events:trace.traceEvents.length,top:[...totals.values()].sort((a,b)=>b.totalMs-a.totalMs).slice(0,25)},null,2));
} finally {await browser.close();}
