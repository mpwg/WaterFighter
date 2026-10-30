/** Requires an isolated Vite copy with the test-only __wfPickTest hook; see browser-pruefung.md. */
import {readFileSync,writeFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
const base=process.env.WATERFIGHTER_SAFARIDRIVER??'http://127.0.0.1:4445';
const url=process.env.WATERFIGHTER_PICK_URL??'http://127.0.0.1:5174/';
async function cmd(path,body,method='POST'){const r=await fetch(base+path,{method,headers:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)}),v=await r.json();if(!r.ok)throw Error(JSON.stringify(v));return v.value;}
const s=await cmd('/session',{capabilities:{alwaysMatch:{browserName:'safari',platformName:'macOS'}}}),prefix='/session/'+s.sessionId;
try {
 await cmd(prefix+'/window/rect',{x:0,y:0,width:1600,height:1000});
 await cmd(prefix+'/url',{url});
 const response=await fetch(new URL('scenarios/brigittenau-v1.json.bin',url));
 if(!response.ok || !gunzipSync(Buffer.from(await response.arrayBuffer())).equals(readFileSync('public/scenarios/brigittenau-v1.json')))throw Error('Szenariodaten abweichend');
 const js=async script=>cmd(prefix+'/execute/sync',{script,args:[]});
 let ready=false;for(let i=0;i<100;i++){ready=await js('return !!window.__wfPickTest?.world && !document.querySelector("#run").disabled');if(ready)break;await new Promise(r=>setTimeout(r,100));}if(!ready)throw Error('Spiel nicht bereit');
 await js('document.querySelector("[data-mode=demolish]").click();document.querySelector("#panel-toggle").click();return null;');
 const point=await js(`const {world,Vector3,Matrix}=window.__wfPickTest;const m=world.scene.getMeshByName('building-w1207502028-0');const b=m.getBoundingInfo().boundingBox,c=b.centerWorld.clone();c.y=b.maximumWorld.y;const p=Vector3.Project(c,Matrix.Identity(),world.scene.getTransformMatrix(),world.camera.viewport.toGlobal(world.engine.getRenderWidth(),world.engine.getRenderHeight()));const r=world.canvas.getBoundingClientRect(),x=r.left+p.x*r.width/world.engine.getRenderWidth(),y=r.top+p.y*r.height/world.engine.getRenderHeight();for(const [dx,dy] of [[8,0],[-8,0],[0,8],[0,-8],[6,6],[-6,6],[6,-6],[-6,-6]]){const px=Math.round(x+dx),py=Math.round(y+dy);if(!world.pick(px,py,true)&&world.pickDemolition(px,py)?.buildingId==='w1207502028-0')return {x:px,y:py,dx,dy,viewport:[innerWidth,innerHeight]};}return null;`);
 if(!point)throw Error('Kein eindeutiger Beinahetreffer gefunden');
 await cmd(prefix+'/actions',{actions:[{type:'pointer',id:'mouse',parameters:{pointerType:'mouse'},actions:[{type:'pointerMove',duration:0,x:Math.round(point.x),y:Math.round(point.y),origin:'viewport'},{type:'pointerDown',button:0},{type:'pointerUp',button:0}]}]});
 let state;for(let i=0;i<100;i++){state=await js('return {visible:!document.querySelector("#preview").hidden,text:document.querySelector("#preview-text").textContent,budget:document.querySelector("#budget").textContent,marker:!!window.__wfPickTest.world.scene.getMeshByName("preview-building-marker")}');if(state.visible&&state.text.includes('Kosten: 7'))break;await new Promise(r=>setTimeout(r,100));}
 if(!state?.visible||!state.text.includes('Gebäudeverlust insgesamt: 66')||!state.text.includes('Kosten: 7')||state.budget.replace(/\s/g,'')!=='10000'||!state.marker)throw Error('Vorschau fehlerhaft: '+JSON.stringify(state));
 const screenshot=await cmd(prefix+'/screenshot',undefined,'GET');writeFileSync('/tmp/wf-safari-pick.png',Buffer.from(screenshot,'base64'));
 await js('document.querySelector("#cancel").click();return null;');const after=await js('return {hidden:document.querySelector("#preview").hidden,budget:document.querySelector("#budget").textContent,marker:!!window.__wfPickTest.world.scene.getMeshByName("preview-building-marker")}');
 if(!after.hidden||after.marker||after.budget.replace(/\s/g,'')!=='10000')throw Error('Verwerfen fehlerhaft: '+JSON.stringify(after));
 console.log(JSON.stringify({browser:s.capabilities.browserVersion,point,state,after},null,2));
} finally {await cmd(prefix,undefined,'DELETE');}
