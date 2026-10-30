/** Check compact help with emulated touch in a locally running Firefox/geckodriver. */
const base=process.env.WATERFIGHTER_GECKODRIVER??'http://127.0.0.1:4446';
async function command(path,body,method='POST') {
  const response=await fetch(base+path,{method,headers:{'content-type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
  const result=await response.json();if(!response.ok)throw Error(JSON.stringify(result));return result.value;
}
if(!process.env.WATERFIGHTER_FIREFOX)throw Error('WATERFIGHTER_FIREFOX muss auf den Firefox-Browser zeigen.');
const session=await command('/session',{capabilities:{alwaysMatch:{browserName:'firefox','moz:firefoxOptions':{binary:process.env.WATERFIGHTER_FIREFOX,args:[],prefs:{'webgl.force-enabled':true,'webgl.disabled':false,'gfx.webrender.software':true}}}}});
const prefix='/session/'+session.sessionId,script=code=>command(prefix+'/execute/sync',{script:code,args:[]});
const tap=(x,y,id)=>command(prefix+'/actions',{actions:[{type:'pointer',id,parameters:{pointerType:'touch'},actions:[{type:'pointerMove',duration:0,x,y,origin:'viewport'},{type:'pointerDown',button:0},{type:'pointerUp',button:0}]}]});
try {
  await command(prefix+'/window/rect',{x:0,y:0,width:500,height:480});
  const size=await script('return {w:innerWidth,h:innerHeight,outerW:outerWidth,outerH:outerHeight}');
  await command(prefix+'/window/rect',{width:size.outerW+(500-size.w),height:size.outerH+(320-size.h)});
  await command(prefix+'/url',{url:process.env.WATERFIGHTER_URL??'http://127.0.0.1:4173/'});
  let setup;
  for(let i=0;i<100;i++) {
    setup=await script('const run=document.querySelector("#run");return {state:document.querySelector("#state")?.textContent,enabled:!!run&&!run.disabled,w:innerWidth,h:innerHeight}');
    if(setup.enabled||setup.state==='Fehler')break;
    await new Promise(r=>setTimeout(r,200));
  }
  if(!setup?.enabled||setup.w!==500||setup.h!==320)throw Error(`Spiel oder Ansicht nicht bereit: ${JSON.stringify(setup)}`);
  const button=await script('const e=document.querySelector("#compact-help"),r=e.getBoundingClientRect();return {visible:getComputedStyle(e).display!=="none",x:r.x+r.width/2,y:r.y+r.height/2,width:r.width,height:r.height}');
  if(!button.visible||button.width<44||button.height<44)throw Error(`Hilfeknopf nicht erreichbar: ${JSON.stringify(button)}`);
  await tap(button.x,button.y,'open-help');
  const opened=await script('const d=document.querySelector(".help"),f=document.querySelector("footer"),s=d.querySelector("summary"),r=s.getBoundingClientRect(),b=f.getBoundingClientRect();return {open:d.open,width:b.width,summaryVisible:r.top>=b.top&&r.bottom<=b.bottom,text:d.querySelector("p").textContent}');
  if(!opened.open||opened.width<240||!opened.summaryVisible||!opened.text.includes('Karte durch Ziehen verschieben'))throw Error(`Hilfe nicht geöffnet: ${JSON.stringify(opened)}`);
  await tap(button.x,button.y,'close-help');
  const closed=await script('return {open:document.querySelector(".help").open,scrollTop:document.querySelector("footer").scrollTop}');
  if(closed.open||closed.scrollTop!==0)throw Error(`Hilfe nicht geschlossen: ${JSON.stringify(closed)}`);
  console.log(JSON.stringify({browser:session.capabilities.browserVersion,setup,button,opened,closed},null,2));
} finally {await command(prefix,undefined,'DELETE');}
