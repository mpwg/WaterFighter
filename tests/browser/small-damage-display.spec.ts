import {expect,test} from '@playwright/test';

test('kleine positive Schäden bleiben in Gesamtanzeige und Gebäudeabfrage erkennbar',async({page})=>{
  await page.addInitScript(()=>{
    const Original=window.Worker;
    window.Worker=class extends Original {
      constructor(...args:ConstructorParameters<typeof Worker>){
        super(...args);
        this.addEventListener('message',event=>{
          if(event.data?.type!=='snapshot')return;
          event.data.floodDamage=0.25;event.data.totalDamage=0.25;
          const building=event.data.buildings.find((b:{id:string})=>b.id==='w316294475-0');
          if(building){building.damage=0.25;building.exposure=0;}
        });
      }
    };
  });
  await page.setViewportSize({width:1600,height:1000});await page.goto('/');
  await expect(page.locator('#run')).toBeEnabled();
  await expect(page.locator('#damage-total')).toContainText('Schaden < 1 /');
  await expect(page.locator('#damage-breakdown')).toHaveText('Flut < 1 · Abriss 0');
  await page.locator('#panel-toggle').click();
  await page.mouse.click(439.81117482960224,488.34501120457134);
  await expect(page.locator('#inspection')).toContainText('Gebäude beschädigt: Flutschaden < 1 von');
});
