/** Verify two dam-gap previews using Safari's desktop WebDriver. */
const base=process.env.WATERFIGHTER_SAFARIDRIVER??'http://127.0.0.1:4445';
async function cmd(path,body,method='POST'){const r=await fetch(base+path,{method,headers:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)}),d=await r.json();if(!r.ok)throw Error(JSON.stringify(d));return d.value;}
const session=await cmd('/session',{capabilities:{alwaysMatch:{browserName:'safari',platformName:'macOS'}}}),prefix=`/session/${session.sessionId}`;
try {
 await cmd(prefix+'/window/rect',{x:0,y:0,width:1600,height:1075});await cmd(prefix+'/url',{url:process.env.WATERFIGHTER_URL??'http://127.0.0.1:4173/'});
 const js=async script=>cmd(prefix+'/execute/sync',{script,args:[]});
 async function wait(script){for(let i=0;i<150;i++){const v=await js(script);if(v)return v;await new Promise(r=>setTimeout(r,100));}throw Error(`Zeitüberschreitung: ${script}`);}
 const viewport=await wait('return !document.querySelector("#run").disabled && [innerWidth,innerHeight]');if(viewport[0]!==1600||viewport[1]!==1000)throw Error(`Unerwarteter Ansichtsbereich: ${viewport}`);
 async function click(selector){const e=await cmd(prefix+'/element',{using:'css selector',value:selector});await cmd(prefix+`/element/${e['element-6066-11e4-a52e-4f735466cecf']}/click`,{});}
 async function point(x,y){await cmd(prefix+'/actions',{actions:[{type:'pointer',id:'mouse',parameters:{pointerType:'mouse'},actions:[{type:'pointerMove',duration:0,x:Math.round(x),y:Math.round(y),origin:'viewport'},{type:'pointerDown',button:0},{type:'pointerUp',button:0}]}]});}
 async function preview(){return wait('return !document.querySelector("#preview").hidden && !document.querySelector("#confirm").disabled && document.querySelector("#preview-text").textContent');}
 await click('[data-mode="dam"]');await click('#panel-toggle');
 await point(363.14,526.56);await point(385.84,513.48);const boundary=await preview();
 if(!boundary.includes('eine Rasterkante vor dem Kartenrand'))throw Error(`Randhinweis fehlt: ${boundary}`);await click('#cancel');
 await point(360.62,528.01);await point(385.84,513.48);const first=await preview();if(!first.includes('Kosten: 400'))throw Error(`Damm abweichend: ${first}`);await click('#confirm');
 await wait('return document.querySelector("#preview").hidden && document.querySelector("#budget").textContent.replace(/\\s/g,"")==="9600"');
 await point(388.36,514.60);await point(431.29,510.80);const between=await preview();
 if(!between.includes('eine Rasterkante von einem bestehenden Damm entfernt'))throw Error(`Dammhinweis fehlt: ${between}`);
 await click('#cancel');const budget=await js('return document.querySelector("#budget").textContent');if(budget.replace(/\s/g,'')!=='9600')throw Error('Budget verändert');
 console.log(JSON.stringify({version:session.capabilities.browserVersion,viewport,boundary,first,between,budget},null,2));
} finally {await cmd(prefix,undefined,'DELETE');}
