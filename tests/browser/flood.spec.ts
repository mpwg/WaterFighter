import {
  test, expect, type Page
} from '@playwright/test';
import {
  writeFileSync
} from 'node:fs';
import type {
  Snapshot, Command, Point
} from '../../src/flood/types';
const state = (p: Page): Promise<Snapshot> => p.evaluate(() => (window as any).__waterfighter.state());
const command = (p: Page,c:Command) => p.evaluate(c => (window as any).__waterfighter.command(c), c);
const advance = (p:Page,s:number) => p.evaluate(s => (window as any).__waterfighter.advance(s),s);
async function ready(p:Page,url='/?test=1') {
  await p.goto(url);
  await p.evaluate(() => (window as any).__waterfighter.ready);
  if(await p.locator('#dismiss').isVisible()) await p.locator('#dismiss').click();
}
async function project(p:Page,point:Point) {
  return p.evaluate(point => (window as any).__waterfighter.project(point),point);
}
async function drag(p:Page,points:Point[]) {
  const screen = await Promise.all(points.map(x=>project(p,x)));
  await p.mouse.move(screen[0].x,screen[0].y);
  await p.mouse.down();
  for(const q of screen.slice(1)) await p.mouse.move(q.x,q.y, {
    steps:12
  });
  await p.mouse.up();
  await p.waitForTimeout(250);
}
let errors:string[]=[];
let external:string[]=[];
test.beforeEach(async( {
  page
})=> {
  await page.addInitScript(()=>localStorage.setItem('waterfighter-quality','low'));
  errors=[];
  external=[];
  page.on('request',r=> {
    if(!r.url().startsWith('http://127.0.0.1:4187/')&&!r.url().startsWith('blob:')&&!r.url().startsWith('data:')) external.push(r.url());
  });
  page.on('pageerror',e=>errors.push(e.message));
});
test.afterEach(()=> {
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
});
test('normal startup has no test API',async( {
  page
})=> {
  await page.goto('/');
  await expect(page.locator('#quality')).toBeEnabled( {
    timeout:60000
  });
  expect(await page.evaluate(()=> '__waterfighter' in window)).toBe(false);
});
test('canvas curves, cancellation, pause queue, overlap, refund and transformed picking',async( {
  page
})=> {
  await ready(page);
  await page.locator('#pause').click();
  const points=[ {
    x:20,y:130
  }, {
    x:25,y:130
  }, {
    x:25,y:134
  }];
  await drag(page,points);
  let s=await state(page);
  expect(s.barriers.length).toBeGreaterThanOrEqual(8);
  expect(s.barriers.every(b=>b.status==='queued')).toBe(true);
  const resources=s.resources;
  await drag(page,[...points].reverse());
  expect((await state(page)).resources).toBe(resources);
  const p=await project(page, {
    x:35,y:130
  });
  await page.mouse.move(p.x,p.y);
  await page.mouse.down();
  await page.mouse.move(p.x+40,p.y);
  await page.keyboard.press('Escape');
  await page.mouse.up();
  expect((await state(page)).resources).toBe(resources);
  await page.mouse.move(p.x,p.y);
  await page.mouse.down();
  await page.mouse.move(p.x+30,p.y);
  await page.locator('canvas').dispatchEvent('pointercancel', {
    pointerId:1,pointerType:'mouse'
  });
  await page.mouse.up();
  expect((await state(page)).resources).toBe(resources);
  await page.mouse.move(p.x,p.y);
  await page.mouse.down();
  await page.mouse.move(5,100);
  await page.mouse.up();
  await page.waitForTimeout(200);
  expect((await state(page)).resources).toBe(resources);
  expect((await command(page, {
    type:'barrier',points:[ {
      x:-5,y:-5
    }, {
      x:4,y:4
    }]
  })).ok).toBe(false);
  await advance(page,10);
  expect((await state(page)).time).toBe(0);
  await page.evaluate(()=> (window as any).__waterfighter.select('remove'));
  await drag(page,points);
  expect((await state(page)).resources).toBe(900);
  expect((await state(page)).barriers).toHaveLength(0);
  await page.evaluate(()=> {
    const api=(window as any).__waterfighter;
    api.camera.pan(15,5);
    api.camera.zoom(.8);
    api.select('barrier');
  });
  await page.waitForTimeout(200);
  await drag(page,[ {
    x:40,y:130
  }, {
    x:45,y:130
  }]);
  expect((await state(page)).barriers.length).toBeGreaterThan(0);
  await page.locator('#pause').click();
  await advance(page,6);
  expect((await state(page)).barriers.every(b=>b.status==='ready')).toBe(true);
  const spent=900-(await state(page)).resources;
  for(const edge of (await state(page)).barriers) {
    const horizontal = edge.b-edge.a === (await state(page)).width;
    await command(page,{type:'remove',points:[{x:edge.x,y:edge.y},{x:edge.x+(horizontal?1:0),y:edge.y+(horizontal?0:1)}]});
  }
  expect((await state(page)).resources).toBe(900-spent/2);
  await page.locator('#restart').click();
  await expect.poll(async()=> (await state(page)).time).toBe(0);
  expect((await state(page)).resources).toBe(900);
});
test('actual house and gate clicks, parallel six-second idempotent rescue, full round',async( {
  page
})=> {
  await ready(page);
  const buildings=await page.evaluate(()=> (window as any).__waterfighter.buildings);
  await page.evaluate(()=> (window as any).__waterfighter.select('rescue'));
  for(const b of buildings.slice(0,2)) {
    const q=await project(page, {
      x:b.x+b.width/2,y:b.y+b.height/2
    });
    await page.mouse.click(q.x,q.y);
    await page.waitForTimeout(150);
  }
  expect((await state(page)).rescues).toHaveLength(2);
  await advance(page,5.9);
  expect((await state(page)).results.rescued).toBe(0);
  await advance(page,.2);
  const rescued=(await state(page)).results.rescued;
  expect(rescued).toBeGreaterThan(0);
  await command(page, {
    type:'rescue',buildingId:buildings[0].id
  });
  await advance(page,7);
  expect((await state(page)).results.rescued).toBe(rescued);
  await page.evaluate(()=> (window as any).__waterfighter.select('gate'));
  const gate=await page.evaluate(()=> (window as any).__waterfighter.terrain.gates[0]);
  const q=await project(page,{x:gate.x+.5,y:gate.y+1});
  // The open gate is raised above the ground plane returned by project().
  for(const dy of [-12,-9,-6,-3,0,3]) {
    await page.mouse.click(q.x,q.y+dy);
    await page.waitForTimeout(150);
    if(!(await state(page)).gates[0].open) break;
  }
  expect((await state(page)).gates[0].open).toBe(false);
  await advance(page,360);
  expect((await state(page)).phase).toBe('finished');
  expect((await state(page)).time).toBe(360);
  await expect(page.locator('#result')).toBeVisible();
  await page.locator('#again').click();
  await expect.poll(async()=> (await state(page)).time).toBe(0);
});
test('house markers track actual clicks, progress, completion, repeat and pause',async({page})=> {
  await ready(page);
  const buildings=await page.evaluate(()=> (window as any).__waterfighter.buildings);
  await page.locator('[data-tool="rescue"]').click();
  const clickHouse=async(i:number)=> {
    const b=buildings[i], q=await project(page,{x:b.x+b.width/2,y:b.y+b.height/2});
    await page.mouse.click(q.x,q.y);
  };
  const marker=(i:number)=>page.locator(`.rescue-marker[data-building-id="${buildings[i].id}"]`);
  await expect(marker(0)).toBeHidden();
  await clickHouse(0);
  await expect(marker(0)).toBeVisible();
  await expect(marker(0)).toHaveAttribute('data-state','active');
  await expect(page.locator('#feedback')).toHaveText('Rettung läuft · noch 6s');
  await advance(page,3);
  await expect(marker(0)).toHaveAttribute('data-progress',/0\.49|0\.50|0\.5/);
  await expect(marker(0)).toHaveText(/3s|4s/);
  await page.locator('#pause').click();
  await expect.poll(async()=> (await state(page)).phase).toBe('paused');
  const frozen=await state(page);
  await clickHouse(0);
  await expect(page.locator('#feedback')).toHaveText(/Rettung pausiert/);
  await clickHouse(1);
  await expect(page.locator('#feedback')).toHaveText('Pause · Rettung nach dem Fortsetzen starten.');
  await advance(page,8);
  expect((await state(page)).rescues).toEqual(frozen.rescues);
  await expect(marker(1)).toBeHidden();
  await page.locator('#pause').click();
  await expect.poll(async()=> (await state(page)).phase).toBe('running');
  await clickHouse(1);
  await expect(marker(1)).toHaveAttribute('data-state','active');
  await advance(page,6.1);
  for(const i of [0,1]) {
    await expect(marker(i)).toHaveAttribute('data-state','complete');
    await expect(marker(i)).toHaveText('✓ Gerettet');
  }
  const rescued=(await state(page)).results.rescued;
  await clickHouse(2);
  await expect(marker(2)).toHaveAttribute('data-state','active');
  await advance(page,2);
  await clickHouse(0);
  await expect(page.locator('#feedback')).toHaveText('Bewohner dieses Hauses sind bereits gerettet.');
  expect((await state(page)).results.rescued).toBe(rescued);
  expect((await state(page)).rescues).toHaveLength(3);
  await page.screenshot({path:'docs/tulln-rescue-markers.png'});
});
test('complete 360-second wall-clock round with visible flood evidence',async( {
  page,browser
})=> {
  test.setTimeout(520000);
  await page.addInitScript(()=>localStorage.setItem('waterfighter-quality','low'));
  await ready(page,'/?test=1&realtime=1');
  const start=Date.now();
  const samples:any[]=[];
  await page.screenshot( {
    path:'docs/tulln-start.png'
  });
  while((await state(page)).phase!=='finished') {
    await page.waitForTimeout(10000);
    const s=await state(page);
    samples.push( {
      wallSeconds:(Date.now()-start)/1000,time:s.time,wetCells:Array.from(s.depths).filter(d=>d>.02).length,damage:s.results.meanDamage
    });
    console.log('realtime',JSON.stringify(samples.at(-1)));
    if(s.time>=180&&!samples.some(x=>x.crest)) {
      samples.at(-1).crest=true;
      await page.screenshot( {
        path:'docs/tulln-crest.png'
      });
    }
  }
  await page.screenshot( {
    path:'docs/tulln-end.png'
  });
  const final=await state(page);
  expect(final.time).toBe(360);
  expect((Date.now()-start)/1000).toBeGreaterThanOrEqual(359);
  writeFileSync('docs/browser-evidence.json',JSON.stringify( {
    date:new Date().toISOString(),browser:browser.version(),platform:process.platform,viewport:'1440x960',quality:'low',wallSeconds:(Date.now()-start)/1000,simulationSeconds:final.time,diagnostics:await page.evaluate(()=> (window as any).__waterfighter.diagnostics()),samples,pageErrors:errors,externalRequests:external
  },null,2)+'\n');
});
test('high-quality frozen-round visual evidence',async( {
  page
})=> {
  await ready(page);
  await page.locator('#quality').click();
  await expect(page.locator('#quality')).toHaveText('◐ Hoch');
  await expect(page.locator('#loading')).toBeHidden();
  await expect(page.locator('#quality')).toBeEnabled();
  await page.waitForTimeout(200);
  await page.screenshot( {
    path:'docs/tulln-high-start.png'
  });
  await advance(page,180);
  await page.screenshot( {
    path:'docs/tulln-high-crest.png'
  });
  await advance(page,180);
  await page.screenshot( {
    path:'docs/tulln-high-end.png'
  });
  await expect(page.locator('#result h2')).toHaveText('Die Hochwasserrunde ist beendet.');
  const final=await state(page);
  expect(final.results.rescued).toBe(0);
  await expect(page.locator('#result-text')).toHaveText(`${final.results.rescued} Menschen gerettet, ${final.results.safePeople} zu Hause sicher. ${final.results.damagedBuildings} Häuser beschädigt.`);
  writeFileSync('docs/high-quality-evidence.json' ,JSON.stringify( {
    diagnostics:await page.evaluate(()=> (window as any).__waterfighter.diagnostics()),state:((s:Snapshot)=>( {
      time:s.time,results:s.results,accounting:s.accounting
    }))(await state(page)),pageErrors:errors,externalRequests:external
  },null,2)+'\n');
});
