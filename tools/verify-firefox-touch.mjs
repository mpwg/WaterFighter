/** Test a touch-retargeting regression in an official Firefox via a running geckodriver. */
const base=process.env.WATERFIGHTER_GECKODRIVER??'http://127.0.0.1:4446';
async function command(path,body,method='POST') {
  const response=await fetch(base+path,{method,headers:{'content-type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
  const result=await response.json();if(!response.ok)throw Error(JSON.stringify(result));return result.value;
}
if(!process.env.WATERFIGHTER_FIREFOX)throw Error('WATERFIGHTER_FIREFOX muss auf den Firefox-Browser zeigen.');
const session=await command('/session',{capabilities:{alwaysMatch:{browserName:'firefox','moz:firefoxOptions':{binary:process.env.WATERFIGHTER_FIREFOX,args:[],prefs:{'webgl.force-enabled':true,'webgl.disabled':false,'gfx.webrender.software':true}}}}});
const prefix='/session/'+session.sessionId;
const script=code=>command(prefix+'/execute/sync',{script:code,args:[]});
const tap=(x,y,id)=>command(prefix+'/actions',{actions:[{type:'pointer',id,parameters:{pointerType:'touch'},actions:[{type:'pointerMove',duration:0,x,y,origin:'viewport'},{type:'pointerDown',button:0},{type:'pointerUp',button:0}]}]});
try {
  await command(prefix+'/window/rect',{x:0,y:0,width:844,height:480});
  const size=await script('return {w:innerWidth,h:innerHeight,outerH:outerHeight}');
  await command(prefix+'/window/rect',{width:844+(844-size.w),height:size.outerH+(390-size.h)});
  await command(prefix+'/url',{url:process.env.WATERFIGHTER_URL??'http://127.0.0.1:4198/'});
  let setup;
  for(let i=0;i<100;i++){
    setup=await script('const run=document.querySelector("#run");return {state:document.querySelector("#state")?.textContent,enabled:!!run&&!run.disabled,w:innerWidth,h:innerHeight}');
    if(setup.enabled||setup.state==='Fehler')break;
    await new Promise(r=>setTimeout(r,200));
  }
  if(!setup?.enabled||setup.w!==844||setup.h!==390)throw Error(`Spiel oder Ansicht nicht bereit: ${JSON.stringify(setup)}`);
  await script('document.querySelector("[data-mode=demolish]").click()');
  await tap(480,140,'selection');
  let preview;
  for(let i=0;i<50;i++){
    preview=await script('const e=document.querySelector("#preview"),c=document.querySelector("#cancel"),r=c.getBoundingClientRect();return {hidden:e.hidden,text:document.querySelector("#preview-text").textContent,enabled:!document.querySelector("#confirm").disabled,budget:document.querySelector("#budget").textContent,cancel:{x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}}');
    if(!preview.hidden&&preview.enabled)break;
    await new Promise(r=>setTimeout(r,100));
  }
  if(preview.hidden||!preview.enabled||!preview.text.includes('Gebäudeverlust'))throw Error(`Vorschau fehlt: ${JSON.stringify(preview)}`);
  await tap(preview.cancel.x,preview.cancel.y,'cancel');
  const after=await script('return {hidden:document.querySelector("#preview").hidden,budget:document.querySelector("#budget").textContent}');
  if(!after.hidden||after.budget!==preview.budget)throw Error(`Verwerfen fehlgeschlagen: ${JSON.stringify(after)}`);
  console.log(JSON.stringify({browser:session.capabilities.browserVersion,setup,preview,after},null,2));
} finally {await command(prefix,undefined,'DELETE');}
