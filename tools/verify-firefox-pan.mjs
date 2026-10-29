/** Exercise tool-mode panning in official Firefox through a local geckodriver. */
const base=process.env.WATERFIGHTER_GECKODRIVER??'http://127.0.0.1:4447';
async function command(path,body,method='POST'){
 const response=await fetch(base+path,{method,headers:{'content-type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
 const result=await response.json();if(!response.ok)throw Error(JSON.stringify(result));return result.value;
}
if(!process.env.WATERFIGHTER_FIREFOX)throw Error('WATERFIGHTER_FIREFOX fehlt');
const session=await command('/session',{capabilities:{alwaysMatch:{browserName:'firefox','moz:firefoxOptions':{binary:process.env.WATERFIGHTER_FIREFOX,args:[],prefs:{'webgl.force-enabled':true,'webgl.disabled':false,'gfx.webrender.software':true}}}}});
const prefix='/session/'+session.sessionId;
const script=code=>command(prefix+'/execute/sync',{script:code,args:[]});
const pointer=(type,id,points)=>command(prefix+'/actions',{actions:[{type:'pointer',id,parameters:{pointerType:type},actions:[{type:'pointerMove',duration:0,...points[0],origin:'viewport'},{type:'pointerDown',button:0},...points.slice(1).map(p=>({type:'pointerMove',duration:100,...p,origin:'viewport'})),{type:'pointerUp',button:0}]}]});
try {
 await command(prefix+'/window/rect',{x:0,y:0,width:1200,height:900});
 const size=await script('return {w:innerWidth,h:innerHeight,outerH:outerHeight}');
 await command(prefix+'/window/rect',{width:1200+(1200-size.w),height:size.outerH+(800-size.h)});
 await command(prefix+'/url',{url:process.env.WATERFIGHTER_URL??'http://127.0.0.1:4201/'});
 let setup;
 for(let i=0;i<150;i++){setup=await script('const run=document.querySelector("#run");return {state:document.querySelector("#state")?.textContent,enabled:!!run&&!run.disabled,w:innerWidth,h:innerHeight}');if(setup.enabled||setup.state==='Fehler')break;await new Promise(r=>setTimeout(r,200));}
 if(!setup?.enabled||setup.w!==1200||setup.h!==800)throw Error(`Spiel oder Ansicht nicht bereit: ${JSON.stringify(setup)}`);
 const canvas=await command(prefix+'/element',{using:'css selector',value:'canvas'}),element=canvas['element-6066-11e4-a52e-4f735466cecf'];
 await script('document.querySelector("[data-mode=trench]").click()');
 await pointer('mouse','mouse',[{x:800,y:360}]);
 const first=await script('return document.querySelector("#message").textContent');
 if(first!=='Endpunkt auf der Karte antippen.')throw Error(`Startpunkt fehlt: ${first}`);
 const before=await command(prefix+`/element/${element}/screenshot`,undefined,'GET');
 await pointer('mouse','mouse',[{x:700,y:450},{x:760,y:470}]);
 const after=await command(prefix+`/element/${element}/screenshot`,undefined,'GET');
 const message=await script('return document.querySelector("#message").textContent');
 if(before===after||message!=='Karte verschoben. Endpunkt antippen.')throw Error(`Verschiebung fehlgeschlagen: ${message}`);
 await pointer('mouse','mouse',[{x:910,y:405}]);
 let preview;
 for(let i=0;i<100;i++){preview=await script('return {hidden:document.querySelector("#preview").hidden,enabled:!document.querySelector("#confirm").disabled,text:document.querySelector("#preview-text").textContent,budget:document.querySelector("#budget").textContent}');if(!preview.hidden&&preview.enabled)break;await new Promise(r=>setTimeout(r,100));}
 if(preview.hidden||!preview.enabled||preview.budget.replace(/\s/g,'')!=='10000')throw Error(`Endpunkt oder Vorschau fehlt: ${JSON.stringify(preview)}`);
 await script('document.querySelector("#reset").click()');
 for(let i=0;i<100;i++){if(await script('return document.querySelector("#preview").hidden'))break;await new Promise(r=>setTimeout(r,100));}
 await script('document.querySelector("[data-mode=trench]").click()');
 await pointer('touch','touch-a',[{x:800,y:360}]);
 const touchFirst=await script('return document.querySelector("#message").textContent');
 if(touchFirst!=='Endpunkt auf der Karte antippen.')throw Error(`Touch-Startpunkt fehlt: ${touchFirst}`);
 const touchBefore=await command(prefix+`/element/${element}/screenshot`,undefined,'GET');
 await pointer('touch','touch-b',[{x:700,y:450},{x:760,y:470}]);
 const touchAfter=await command(prefix+`/element/${element}/screenshot`,undefined,'GET');
 const touchMessage=await script('return document.querySelector("#message").textContent');
 if(touchBefore===touchAfter||touchMessage!=='Karte verschoben. Endpunkt antippen.')throw Error(`Touch-Verschiebung fehlgeschlagen: ${touchMessage}`);
 await pointer('touch','touch-c',[{x:910,y:405}]);
 let touchPreview;
 for(let i=0;i<100;i++){touchPreview=await script('return {hidden:document.querySelector("#preview").hidden,enabled:!document.querySelector("#confirm").disabled,text:document.querySelector("#preview-text").textContent,budget:document.querySelector("#budget").textContent}');if(!touchPreview.hidden&&touchPreview.enabled)break;await new Promise(r=>setTimeout(r,100));}
 if(touchPreview.hidden||!touchPreview.enabled||touchPreview.budget.replace(/\s/g,'')!=='10000')throw Error(`Touch-Endpunkt oder Vorschau fehlt: ${JSON.stringify(touchPreview)}`);
 console.log(JSON.stringify({browser:session.capabilities.browserVersion,setup,first,message,canvasChanged:before!==after,preview,touchFirst,touchMessage,touchCanvasChanged:touchBefore!==touchAfter,touchPreview},null,2));
} finally {await command(prefix,undefined,'DELETE');}
