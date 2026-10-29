/** Test-only coordinate projection; every intervention still uses the normal UI. */
import {readFileSync,writeFileSync} from 'node:fs';
import {chromium} from '@playwright/test';
const scenario=JSON.parse(readFileSync('public/scenarios/brigittenau-v1.json','utf8'));
if(scenario.version!=='1.4-draft')throw Error('Szenarioversion stimmt nicht');
const segments=JSON.parse(readFileSync('tests/fixtures/strategy.json','utf8')).segments.slice(0,2);
const browser=await chromium.launch({executablePath:process.env.WATERFIGHTER_CHROME||undefined});
const page=await browser.newPage({viewport:{width:1600,height:1000}}),errors=[];
const points={scenario:scenario.version,viewport:{width:1600,height:1000},dams:[],building:null,trench:[]};
page.on('pageerror',e=>errors.push(e.message));page.on('crash',()=>errors.push('Seite abgestürzt'));
try {
 await page.route('**/src/main.ts*',async route=>{const response=await route.fetch();const body=await response.text();await route.fulfill({response,body:body+'\nexport { world };\n'});});
 await page.goto(process.env.WATERFIGHTER_URL??'http://127.0.0.1:5173/');await page.waitForFunction(()=>!document.querySelector('#run').disabled);
 async function landPoint(x,y,cell=false){return page.evaluate(async ({x,y,cell})=>{
  const {world}=await import(document.querySelector('script[src*="/src/main.ts"]').src),{Vector3,Matrix}=await import('/node_modules/@babylonjs/core/Maths/math.vector.js');
  const g=world.scenario.grid,c=g.cellSize,px=cell?(x+.5)*c:x*c,py=cell?(y+.5)*c:Math.max(.05,y*c);
  const ix=Math.min(g.width-1,Math.floor(px/c)),iy=Math.min(g.height-1,Math.floor(py/c));
  const p=Vector3.Project(new Vector3(px-g.width*c/2,world.scenario.bed[iy*g.width+ix],py-g.height*c/2),Matrix.Identity(),world.scene.getTransformMatrix(),world.camera.viewport.toGlobal(world.engine.getRenderWidth(),world.engine.getRenderHeight()));
  const rect=world.canvas.getBoundingClientRect();return {x:rect.left+p.x*rect.width/world.engine.getRenderWidth(),y:rect.top+p.y*rect.height/world.engine.getRenderHeight()};
 },{x,y,cell});}
 async function confirm(label){await page.locator('#confirm').waitFor({state:'visible',timeout:15000});await page.waitForFunction(()=>!document.querySelector('#confirm').disabled,null,{timeout:15000});const text=await page.locator('#preview-text').textContent();await page.locator('#confirm').click();await page.waitForFunction(()=>document.querySelector('#preview').hidden,null,{timeout:15000});console.log(label,text);}
 await page.locator('[data-mode=dam]').click();
 for(const [i,[start,end]] of segments.entries()){const segment=[];for(const [x,y] of [start,end]){const p=await landPoint(x,y);segment.push(p);await page.mouse.click(p.x,p.y);}points.dams.push(segment);await confirm(`Damm ${i+1}`);}
 await page.locator('[data-mode=demolish]').click();
 const building=await page.evaluate(async ()=>{
  const {world}=await import(document.querySelector('script[src*="/src/main.ts"]').src),{Vector3,Matrix}=await import('/node_modules/@babylonjs/core/Maths/math.vector.js');
  const mesh=world.scene.getMeshByName('building-w33581744-0');if(!mesh)throw Error('Gebäudemesh fehlt');
  const verts=mesh.getVerticesData('position'),indices=mesh.getIndices(),rect=world.canvas.getBoundingClientRect();
  for(let i=0;i<indices.length;i+=3){const a=indices[i]*3,b=indices[i+1]*3,c=indices[i+2]*3;
   const p=Vector3.Project(new Vector3((verts[a]+verts[b]+verts[c])/3,(verts[a+1]+verts[b+1]+verts[c+1])/3,(verts[a+2]+verts[b+2]+verts[c+2])/3),Matrix.Identity(),world.scene.getTransformMatrix(),world.camera.viewport.toGlobal(world.engine.getRenderWidth(),world.engine.getRenderHeight()));
   const x=rect.left+p.x*rect.width/world.engine.getRenderWidth(),y=rect.top+p.y*rect.height/world.engine.getRenderHeight();if(world.pick(x,y,true)?.buildingId==='w33581744-0')return {x,y};
  }throw Error('Kein sichtbarer Treffpunkt für Gebäude');
 });
 points.building=building;
 await page.locator('#panel-toggle').click();
 await page.mouse.click(building.x,building.y);await confirm('Abriss');
 await page.locator('#panel-toggle').click();await page.locator('[data-mode=trench]').click();await page.locator('#panel-toggle').click();
 for(const [x,y] of [[0,10],[23,10]]){const p=await landPoint(x,y,true);points.trench.push(p);await page.mouse.click(p.x,p.y);}await confirm('Graben');
 if(process.argv.includes('--prepare-only'))await page.screenshot({path:'/tmp/waterfighter-review-trench-visible.png'});
 await page.locator('#panel-toggle').click();
 await page.waitForFunction(()=>document.querySelector('#budget').textContent.replace(/\s/g,'')==='6598',null,{timeout:15000});
 writeFileSync('/tmp/waterfighter-review-points.json',JSON.stringify(points,null,2));
 await page.screenshot({path:'/tmp/waterfighter-review-preparation.png'});
 if(process.argv.includes('--prepare-only')){console.log('Vorbereitung abgeschlossen');process.exitCode=0;}
 else {
 await page.locator('#speed').click();const start=Date.now();await page.locator('#run').click();
 for(const t of [60,120,180,240]){await page.waitForFunction(t=>{const [m,s]=document.querySelector('#time').textContent.split(':').map(Number);return m*60+s>=t;},t,{timeout:240000});await page.screenshot({path:`/tmp/waterfighter-review-${t}.png`});}
 await page.waitForFunction(()=>!document.querySelector('#result').hidden,null,{timeout:240000});
 const report={browser:browser.version(),scenario:scenario.version,budget:await page.locator('#budget').textContent(),title:await page.locator('#result-title').textContent(),details:await page.locator('#result-details').textContent(),wallSeconds:(Date.now()-start)/1000,errors};
 await page.screenshot({path:'/tmp/waterfighter-review-result.png'});writeFileSync('/tmp/waterfighter-review-browser.json',JSON.stringify(report,null,2));
 if(report.title!=='Schadensziel erreicht'||errors.length)throw Error(`Runde fehlgeschlagen: ${JSON.stringify(report)}`);console.log(JSON.stringify(report,null,2));
 }
} finally {await browser.close();}
