import {expect,test} from '@playwright/test';

test('breite Dämme und Gräben lassen sich grob zeichnen und überlappend fortsetzen',async({page})=>{
  await page.setViewportSize({width:1200,height:800});await page.goto('/');await expect(page.locator('#run')).toBeEnabled();
  const draw=async(mode:string,start:[number,number],end:[number,number],cost:number,overlap?:string)=>{
    await page.locator(`[data-mode="${mode}"]`).click();
    await page.mouse.click(...start);await page.mouse.click(...end);
    await expect(page.locator('#confirm')).toBeEnabled();
    await expect(page.locator('#preview-text')).toContainText(`Kosten: ${cost}`);
    if(overlap)await expect(page.locator('#preview-text')).toContainText(overlap);
    await page.locator('#confirm').click();await expect(page.locator('#preview')).toBeHidden();
  };
  await draw('dam',[800,360],[850,385],1000);
  await draw('dam',[820,370],[870,395],640,'bestehen bereits');
  await draw('trench',[800,360],[850,385],650);
  await draw('trench',[820,370],[870,395],309,'bereits ausgehoben');
  await expect(page.locator('#budget')).toHaveText('7 401');
  await page.locator('#reset').click();await expect(page.locator('#budget')).toHaveText('10 000');
});

test('kleine Mausabweichungen erhalten eine überlappende breite Fläche',async({page})=>{
  await page.addInitScript(()=>{const Original=window.Worker;window.Worker=class extends Original {
    override set onmessage(handler:((this:Worker,ev:MessageEvent)=>any)|null){super.onmessage=handler?function(ev:MessageEvent){if(ev.data?.type==='action-result'&&ev.data.preview)(window as any).arcadeResult=ev.data.result;handler.call(this,ev);}:null;}
  };});
  await page.setViewportSize({width:1200,height:800});await page.goto('/');await expect(page.locator('#run')).toBeEnabled();
  for(const mode of ['dam','trench']){
    await page.locator(`[data-mode="${mode}"]`).click();const shapes:string[][]=[];
    for(const [a,b] of [[[800,360],[850,385]],[[803,361],[853,387]]] as [[number,number],[number,number]][]){
      await page.mouse.click(...a);await page.mouse.click(...b);await expect(page.locator('#confirm')).toBeEnabled();
      const result=await page.evaluate(()=>(window as any).arcadeResult);
      shapes.push(mode==='dam'?result.resolvedFaces.map((f:{axis:string,index:number})=>`${f.axis}:${f.index}`):result.resolvedCells.map(String));
      await page.locator('#cancel').click();
    }
    const a=new Set(shapes[0]),b=new Set(shapes[1]),intersection=[...a].filter(x=>b.has(x)).length;
    expect(intersection/Math.min(a.size,b.size)).toBeGreaterThan(0.5);
  }
});
