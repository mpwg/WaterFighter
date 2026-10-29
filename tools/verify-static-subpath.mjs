/** Verify a built site and its worker when served beneath a path prefix. */
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve, sep} from 'node:path';
import {chromium} from '@playwright/test';

const root=resolve('dist'),prefix='/waterfighter/';
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.md':'text/markdown; charset=utf-8'};
const requests=[];
const server=createServer(async(req,res)=>{
  const path=new URL(req.url,'http://localhost').pathname;
  if(!path.startsWith(prefix)){res.writeHead(404).end();return;}
  const name=path.slice(prefix.length)||'index.html',file=resolve(root,name);
  if(!file.startsWith(root+sep)){res.writeHead(403).end();return;}
  try {
    const body=await readFile(file),ext=file.slice(file.lastIndexOf('.'));
    requests.push({path,status:200});res.writeHead(200,{'Content-Type':types[ext]??'application/octet-stream'}).end(body);
  } catch {requests.push({path,status:404});res.writeHead(404).end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
let browser;
try {
  browser=await chromium.launch({executablePath:process.env.WATERFIGHTER_CHROME||undefined});
  const page=await browser.newPage({viewport:{width:1200,height:800}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}${prefix}`);
  await page.waitForFunction(()=>!document.querySelector('#run').disabled,null,{timeout:30000});
  await page.locator('[data-mode="dam"]').click();
  await page.mouse.click(800,360);await page.mouse.click(850,385);
  await page.waitForFunction(()=>!document.querySelector('#confirm').disabled);
  await page.locator('#confirm').click();
  await page.waitForFunction(()=>document.querySelector('#message').textContent.includes('Maßnahme bestätigt'));
  await page.locator('#run').click();
  await page.waitForFunction(()=>document.querySelector('#time').textContent!=='00:00',null,{timeout:30000});
  const time=await page.locator('#time').textContent();
  await page.getByRole('button',{name:'Pause'}).click();
  await page.waitForFunction(()=>document.querySelector('#state').textContent==='Pausiert');
  await page.getByRole('button',{name:'Neustart'}).click();
  await page.waitForFunction(()=>document.querySelector('#state').textContent==='Vorbereitung' && document.querySelector('#time').textContent==='00:00');
  const source=await page.locator('a[href$="scenarios/DATENQUELLEN.md"]').getAttribute('href');
  const sourceResponse=await page.request.get(new URL(source,page.url()).href);
  if(!sourceResponse.ok())throw Error(`Quellenhinweis: HTTP ${sourceResponse.status()}`);
  if(!requests.some(r=>r.path.endsWith('/scenarios/brigittenau-v1.json.bin')&&r.status===200))throw Error('Szenario nicht geladen');
  if(!requests.some(r=>/worker.*\.js$/.test(r.path)&&r.status===200))throw Error('Worker nicht geladen');
  if(errors.length||requests.some(r=>r.status!==200))throw Error(JSON.stringify({errors,requests}));
  console.log(JSON.stringify({browser:browser.version(),prefix,time,sourceStatus:sourceResponse.status(),requests},null,2));
} finally {await browser?.close();await new Promise(r=>server.close(r));}
