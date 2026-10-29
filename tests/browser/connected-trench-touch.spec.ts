import { expect, test } from '@playwright/test';

for(const config of [
  {name:'Hochformat',viewport:{width:390,height:844},pans:2,start:[40.85,417.79],end:[170.86,444.62],extended:[162.86,444.62]},
  {name:'Querformat',viewport:{width:844,height:390},pans:0,start:[226.01,193.06],end:[286.08,205.45],extended:[278.08,205.45]},
]) test(`Grabenanschluss ist per Touch im ${config.name} ohne doppelte Kosten möglich`,async({browser})=>{
  const context=await browser.newContext({viewport:config.viewport,isMobile:true,hasTouch:true});
  try {
    const page=await context.newPage();
    await page.addInitScript(()=>{
      const Original=window.Worker;
      window.Worker=class extends Original {
        override postMessage(message:any,options?:any){
          if(message?.type==='preview'&&message.action?.kind==='trench')(window as any).lastTrench=message.action.cells;
          return super.postMessage(message,options);
        }
      };
    });
    await page.goto('/');await expect(page.locator('#run')).toBeEnabled();
    await page.locator('[data-mode="trench"]').tap();await page.locator('#panel-toggle').tap();
    const cdp=await context.newCDPSession(page);
    for(let i=0;i<config.pans;i++){
      await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:80,y:500}]});
      await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:350,y:500}]});
      await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    }
    await page.touchscreen.tap(config.start[0],config.start[1]);await page.touchscreen.tap(config.end[0],config.end[1]);
    await expect(page.locator('#confirm')).toBeEnabled();
    const first:number[]=await page.evaluate(()=>(window as any).lastTrench);
    await page.locator('#confirm').tap();await expect(page.locator('#preview')).toBeHidden();
    const before=Number((await page.locator('#budget').textContent())!.replace(/\s/g,''));
    await page.touchscreen.tap(config.start[0],config.start[1]);await page.touchscreen.tap(config.extended[0],config.extended[1]);
    await expect(page.locator('#confirm')).toBeEnabled();
    const second:number[]=await page.evaluate(()=>(window as any).lastTrench),reused=second.filter(i=>first.includes(i)).length;
    expect(reused).toBeGreaterThan(0);expect(reused).toBeLessThan(second.length);
    await expect(page.locator('#preview-text')).toContainText(`${reused} ${reused===1?'Zelle ist':'Zellen sind'} bereits ausgehoben`);
    await expect(page.locator('#preview-text')).toContainText(`Kosten: ${(second.length-reused)*25}`);
    await page.locator('#confirm').tap();await expect(page.locator('#preview')).toBeHidden();
    await expect.poll(async()=>Number((await page.locator('#budget').textContent())!.replace(/\s/g,''))).toBe(before-(second.length-reused)*25);
  } finally {await context.close();}
});
