import {expect,test} from '@playwright/test';
import {damPath,trenchPath} from '../../src/simulation/path';

for(const variant of [
  {name:'4-m-Schutzdamm',points:[[474.226,512.402],[476.751,515.146]],start:[43,28],end:[44,28],cost:40,damBudget:'9 000',finalBudget:'7 300'},
  {name:'20-m-Schutzdamm',points:[[469.175,509.714],[481.802,517.904]],start:[41,28],end:[46,28],cost:200,damBudget:'8 840',finalBudget:'7 140'},
]) test(`verkürzte Dammkombination mit ${variant.name} und Westgraben ist auswählbar`,async({page})=>{
  test.setTimeout(90000);
  await page.addInitScript(()=>{
    const Original=window.Worker;
    window.Worker=class extends Original {
      override postMessage(message:any,options?:any){
        if(message?.type==='preview')(window as any).partialAction=message.action;
        return super.postMessage(message,options);
      }
    };
  });
  await page.setViewportSize({width:1600,height:1000});await page.goto('/');
  await expect(page.locator('#run')).toBeEnabled();
  await page.locator('[data-mode="dam"]').click();await page.locator('#panel-toggle').click();
  const dams=[
    {points:[[360.615,528.011],[385.837,513.479]],start:[26,0],end:[26,10],cost:400},
    {points:[[385.837,513.479],[421.193,513.315]],start:[26,10],end:[33,17],cost:560},
    variant,
  ];
  for(const d of dams){
    for(const [x,y] of d.points)await page.mouse.click(x,y);
    await expect(page.locator('#confirm')).toBeEnabled();
    const actual=await page.evaluate(()=>(window as any).partialAction);
    expect(actual).toEqual({kind:'dam',faces:damPath(d.start as [number,number],d.end as [number,number],200)});
    await expect(page.locator('#preview-text')).toContainText(`Kosten: ${d.cost}`);
    await page.locator('#confirm').click();await expect(page.locator('#preview')).toBeHidden();
  }
  await page.locator('#panel-toggle').click();await expect(page.locator('#budget')).toHaveText(variant.damBudget);
  await page.locator('[data-mode="trench"]').click();await page.locator('#panel-toggle').click();
  await page.mouse.click(413.617,436.340);await page.mouse.click(481.802,522.332);
  await expect(page.locator('#confirm')).toBeEnabled();
  expect(await page.evaluate(()=>(window as any).partialAction)).toEqual({kind:'trench',cells:trenchPath([0,46],[47,26],200)});
  await expect(page.locator('#preview-text')).toContainText('Kosten: 1700');
  await page.locator('#confirm').click();await expect(page.locator('#preview')).toBeHidden();
  await page.locator('#panel-toggle').click();await expect(page.locator('#budget')).toHaveText(variant.finalBudget);
});
