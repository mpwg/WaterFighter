import {expect,test} from '@playwright/test';

test('Diagonaler Damm verläuft direkt und bleibt bei vertauschten Punkten gleich',async({page})=>{
 await page.setViewportSize({width:1200,height:800});
 await page.addInitScript(()=>{const Original=window.Worker;window.Worker=class extends Original{override postMessage(message:any,options?:any){if(message?.type==='preview'&&message.action?.kind==='dam')(window as any).damFaces=message.action.faces;return super.postMessage(message,options);}};});
 await page.goto('/');await expect(page.locator('#run')).toBeEnabled();await page.locator('[data-mode="dam"]').click();
 const select=async(reverse:boolean)=>{for(const [x,y] of reverse?[[850,385],[800,360]]:[[800,360],[850,385]])await page.mouse.click(x,y);await expect(page.locator('#confirm')).toBeEnabled();return await page.evaluate(()=>(window as any).damFaces as {axis:string;index:number}[]);};
 const forward=await select(false);expect(forward.length).toBeGreaterThan(3);
 expect(forward.filter((f,i)=>i>0&&f.axis!==forward[i-1].axis).length).toBeGreaterThan(1);
 await page.locator('#cancel').click();const backward=await select(true);
 expect(backward).toEqual([...forward].reverse());await expect(page.locator('#budget')).toHaveText('10 000');
});
