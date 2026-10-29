/** Compare the existing inlet to a wider hypothetical inlet, without changing the scenario. */
import {readFileSync} from 'node:fs';
import {Game} from '../src/simulation/game';
import {validateScenario} from '../src/scenario';
const scenario=validateScenario(JSON.parse(readFileSync('public/scenarios/brigittenau-v1.json','utf8')));
if(process.argv.includes('--wide'))scenario.parameters.inflowCells=Array.from({length:scenario.grid.width},(_,x)=>x).filter(x=>x<150&&scenario.waterMask[x]===1);
const game=new Game(scenario),s=game.solver,initial=s.volume();let peak={depth:0,cell:-1,time:0},innerPeak={depth:0,cell:-1,time:0};
while(s.time<scenario.parameters.duration-1e-9){const t=s.time,dt=s.step(Math.min(1,scenario.parameters.duration-t));game.addInflow(t,dt);game.updateDamage(dt);for(let i=0;i<s.h.length;i++){if(s.h[i]>peak.depth)peak={depth:s.h[i],cell:i,time:s.time};const x=i%s.width,y=Math.floor(i/s.width);if(x>=5&&x<s.width-5&&y>=5&&y<s.height-5&&s.h[i]>innerPeak.depth)innerPeak={depth:s.h[i],cell:i,time:s.time};}}
console.log(JSON.stringify({scenario:scenario.version,experimental:process.argv.includes('--wide'),inflowCells:scenario.parameters.inflowCells.length,peak:{...peak,x:peak.cell%s.width,y:Math.floor(peak.cell/s.width),isInlet:scenario.parameters.inflowCells.includes(peak.cell)},innerPeak:{...innerPeak,x:innerPeak.cell%s.width,y:Math.floor(innerPeak.cell/s.width)},damage:game.totals().totalDamage,relativeBalanceError:Math.abs(s.volume()-initial-s.inflow+s.outflow-s.roundoffVolume)/(initial+s.inflow)},null,2));
