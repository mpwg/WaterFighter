import {expect,test} from '@playwright/test';

for(const paused of [false,true])test(`ein Graben kann ${paused?'in der Pause':'bei laufender Flut'} ohne doppelte Kosten verlängert werden`,async({page})=>{
  test.setTimeout(90000);
  await page.addInitScript(()=>{
    const Original=window.Worker;
    window.Worker=class extends Original {
      override postMessage(message:any,options?:any){
        if(message?.type==='preview'&&message.action?.kind==='trench')(window as any).lastTrench=message.action.cells;
        return super.postMessage(message,options);
      }
    };
  });
  await page.setViewportSize({width:1200,height:800});await page.goto('/');
  await expect(page.locator('#run')).toBeEnabled();await page.locator('[data-mode="trench"]').click();
  await page.mouse.click(800,360);await page.mouse.click(850,385);
  await expect(page.locator('#confirm')).toBeEnabled();
  const first:number[]=await page.evaluate(()=>(window as any).lastTrench);
  await page.locator('#confirm').click();await expect(page.locator('#preview')).toBeHidden();
  const before=Number((await page.locator('#budget').textContent())!.replace(/\s/g,''));
  await page.locator('#speed').click();await page.locator('#run').click();
  await expect(page.locator('#state')).toHaveText('Läuft');
  await page.waitForFunction(()=>{const [m,s]=document.querySelector('#time')!.textContent!.split(':').map(Number);return m*60+s>=4;});
  if(paused){await page.getByRole('button',{name:'Pause'}).click();await expect(page.locator('#state')).toHaveText('Pausiert');}
  const beforeTime=await page.locator('#time').textContent();
  await page.mouse.click(800,360);await page.mouse.click(875,395);
  await expect(page.locator('#confirm')).toBeEnabled();
  const second:number[]=await page.evaluate(()=>(window as any).lastTrench);
  const reused=second.filter(i=>first.includes(i)).length;
  expect(reused).toBeGreaterThan(0);expect(reused).toBeLessThan(second.length);
  await expect(page.locator('#preview-text')).toContainText(`${reused} ${reused===1?'Zelle ist':'Zellen sind'} bereits ausgehoben`);
  await expect(page.locator('#preview-text')).toContainText(`Kosten: ${(second.length-reused)*25}`);
  await expect(page.locator('#state')).toHaveText(paused?'Pausiert':'Läuft');
  expect(Number((await page.locator('#budget').textContent())!.replace(/\s/g,''))).toBe(before);
  await page.locator('#confirm').click();await expect(page.locator('#preview')).toBeHidden();
  await expect.poll(async()=>Number((await page.locator('#budget').textContent())!.replace(/\s/g,''))).toBe(before-(second.length-reused)*25);
  await expect(page.locator('#state')).toHaveText(paused?'Pausiert':'Läuft');
  if(paused)await expect(page.locator('#time')).toHaveText(beforeTime!);
});
