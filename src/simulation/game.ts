import type { Building, Scenario } from '../scenario';
import { ShallowWaterSolver } from './solver';
import { damCrest } from './dam-height';

export type Face = { axis: 'x' | 'y'; index: number };
export type Action = { kind: 'dam'; faces: Face[] } | { kind: 'trench'; cells: number[] } | { kind: 'demolish'; buildingId: string };
export type ActionResult = { ok: true; cost: number; budget: number; loweredCrests?: number; buildingBlockedFaces?: number; reusedCells?: number; nearBoundaryGap?: boolean; nearDamGap?: boolean; nearOutletGap?: boolean } | { ok: false; reason: string; budget: number };
export interface BuildingStatus { id: string; value: number; damage: number; demolished: boolean; exposure: number }
interface BuildingState extends Omit<BuildingStatus,'exposure'> { cells: number[]; neighbours: number[] }
const key = (face: Face) => `${face.axis}:${face.index}`;
function insideRing(x: number, y: number, ring: number[][]): boolean {
  let inside=false;
  for(let i=0,j=ring.length-1;i<ring.length;j=i++) {
    const [xi,yi]=ring[i],[xj,yj]=ring[j];
    if ((yi>y)!==(yj>y) && x<(xj-xi)*(y-yi)/(yj-yi)+xi) inside=!inside;
  }
  return inside;
}
function insideBuilding(x:number,y:number,b:Building):boolean {
  return insideRing(x,y,b.polygon.outer) && !b.polygon.holes.some(r=>insideRing(x,y,r));
}

/** Worker-owned state. All validation happens before any modification. */
export class Game {
  readonly solver: ShallowWaterSolver;
  readonly buildings: BuildingState[];
  readonly damFaces = new Map<string, number>();
  readonly trenchCells = new Set<number>();
  budget: number;
  private readonly occupied: Uint16Array;
  private readonly byId = new Map<string, BuildingState>();
  private readonly actionResults = new Map<string,ActionResult>();
  constructor(readonly scenario:Scenario) {
    const g=scenario.grid;
    this.solver=new ShallowWaterSolver(g.width,g.height,g.cellSize,scenario.bed,scenario.initialDepth);
    this.solver.manning=scenario.parameters.manning;
    for (const edge of scenario.parameters.outflowEdges) this.solver.openBoundary[edge]=true;
    this.budget=scenario.parameters.budget;
    this.occupied=new Uint16Array(g.width*g.height);
    this.buildings=scenario.buildings.map(b=> {
      const xs=b.polygon.outer.map(p=>p[0]),ys=b.polygon.outer.map(p=>p[1]);
      const x0=Math.max(0,Math.floor(Math.min(...xs)/g.cellSize)), x1=Math.min(g.width-1,Math.floor(Math.max(...xs)/g.cellSize));
      const y0=Math.max(0,Math.floor(Math.min(...ys)/g.cellSize)), y1=Math.min(g.height-1,Math.floor(Math.max(...ys)/g.cellSize));
      const cells:number[]=[];
      for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++) if(insideBuilding((x+0.5)*g.cellSize,(y+0.5)*g.cellSize,b)) {const i=y*g.width+x;cells.push(i);this.occupied[i]++;}
      // Preserve buildings smaller than a cell: assign the cell containing an
      // actual footprint point instead of silently omitting their obstruction and damage.
      if(cells.length===0 && x0<=x1 && y0<=y1) {
        const [px,py]=b.polygon.outer[0];
        const x=Math.max(0,Math.min(g.width-1,Math.floor(px/g.cellSize))),y=Math.max(0,Math.min(g.height-1,Math.floor(py/g.cellSize)));
        const i=y*g.width+x;cells.push(i);this.occupied[i]++;
      }
      const own=new Set(cells), neighbours=new Set<number>();
      for(const i of cells) { const x=i%g.width,y=Math.floor(i/g.width); for(const [nx,ny] of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]) if(nx>=0&&nx<g.width&&ny>=0&&ny<g.height&&!own.has(ny*g.width+nx)) neighbours.add(ny*g.width+nx); }
      const state:BuildingState={id:b.id,value:Math.round(b.area*scenario.parameters.buildingValuePerSquareMetre),damage:0,demolished:false,cells,neighbours:[...neighbours]};
      this.byId.set(b.id,state); return state;
    });
    this.rebuildCrests();
  }
  /** Elevated boundaries close buildings while retaining all water already present in cells. */
  private rebuildCrests():void {
    const s=this.solver,w=s.width,h=s.height;
    s.crestX.fill(-Infinity);s.crestY.fill(-Infinity);
    for(const face of this.scenario.surveyCrests) {
      const field=face.axis==='x'?s.crestX:s.crestY;
      const x=face.axis==='x'?face.index%(w+1):face.index%w;
      const y=face.axis==='x'?Math.floor(face.index/(w+1)):Math.floor(face.index/w);
      const a=face.axis==='x'?y*w+x-1:(y-1)*w+x, b=face.axis==='x'?a+1:y*w+x;
      // A trench crossing the face cuts the surveyed crest as well as both cells.
      const cut=this.trenchCells.has(a)&&this.trenchCells.has(b)?this.scenario.parameters.trenchDepth:0;
      field[face.index]=Math.max(field[face.index],face.crest-cut);
    }
    for(let y=0;y<h;y++) for(let x=1;x<w;x++) {
      const l=y*w+x-1,r=l+1;
      if(this.occupied[l] || this.occupied[r]) s.crestX[y*(w+1)+x]=Math.max(s.bed[l],s.bed[r])+1000;
    }
    for(let y=1;y<h;y++) for(let x=0;x<w;x++) {
      const a=(y-1)*w+x,b=y*w+x;
      if(this.occupied[a] || this.occupied[b]) s.crestY[y*w+x]=Math.max(s.bed[a],s.bed[b])+1000;
    }
    for(const [k,crest] of this.damFaces) {const [axis,raw]=k.split(':'),i=Number(raw),field=axis==='x'?s.crestX:s.crestY; field[i]=Math.max(field[i],crest);}
  }
  status():BuildingStatus[] { return this.buildings.map(({id,value,damage,demolished,neighbours})=>({id,value,damage,demolished,exposure:demolished?0:neighbours.reduce((depth,i)=>Math.max(depth,this.solver.h[i]),0)})); }
  totals():{floodDamage:number;demolitionLoss:number;totalDamage:number} {
    let floodDamage=0,demolitionLoss=0;
    for(const b of this.buildings) if(b.demolished) demolitionLoss+=b.value; else floodDamage+=b.damage;
    return {floodDamage,demolitionLoss,totalDamage:floodDamage+demolitionLoss};
  }
  /** Piecewise-linear scenario inflow, integrated by the trapezoidal rule. */
  addInflow(t0:number,dt:number):void {
    const curve=this.scenario.parameters.inflowCurve;
    const rate=(time:number):number=> {
      if(time<=curve[0][0]) return curve[0][1];
      for(let i=1;i<curve.length;i++) if(time<=curve[i][0]) {const [a,qa]=curve[i-1],[b,qb]=curve[i]; return qa+(qb-qa)*(time-a)/(b-a);}
      return curve[curve.length-1][1];
    };
    const t1=t0+dt; let volume=0, a=t0;
    for(const [boundary] of curve) if(boundary>a&&boundary<t1) {volume+=(rate(a)+rate(boundary))*(boundary-a)/2;a=boundary;}
    volume+=(rate(a)+rate(t1))*(t1-a)/2;
    const cells=this.scenario.parameters.inflowCells;
    for(const cell of cells)this.solver.addInflow(cell,volume/cells.length);
  }
  /** Boundary depth and exposure duration accumulate monotonically, up to the building value. */
  updateDamage(dt:number):void {
    if(!Number.isFinite(dt)||dt<0) throw new Error('Ungültige Schadenszeit');
    for(const b of this.buildings) {
      if(b.demolished) continue;
      let depth=0; for(const i of b.neighbours) depth=Math.max(depth,this.solver.h[i]);
      b.damage=Math.min(b.value,b.damage+b.value*Math.min(1,depth/this.scenario.parameters.damageDepth)*dt/this.scenario.parameters.damageDuration);
    }
  }
  preview(action:Action):ActionResult {
    const p=this.scenario.parameters,s=this.solver;
    let cost=0,loweredCrests=0,buildingBlockedFaces=0,reusedCells=0,nearBoundaryGap=false,nearDamGap=false,nearOutletGap=false;
    if(!action || typeof action!=='object') return {ok:false,reason:'Ungültige Aktion.',budget:this.budget};
    if(action.kind==='dam') {
      if(!Array.isArray(action.faces)||!action.faces.length||action.faces.length>500) return {ok:false,reason:'Ungültiger Dammverlauf.',budget:this.budget};
      const seen=new Set<string>(); let previous: number[][] | undefined;
      for(const face of action.faces) {
        if(!face || (face.axis!=='x'&&face.axis!=='y') || !Number.isInteger(face.index)) return {ok:false,reason:'Ungültige Dammkante.',budget:this.budget};
        const x=face.axis==='x'?face.index%(s.width+1):face.index%s.width;
        const y=face.axis==='x'?Math.floor(face.index/(s.width+1)):Math.floor(face.index/s.width);
        const valid=face.axis==='x'?x>0&&x<s.width&&y>=0&&y<s.height:x>=0&&x<s.width&&y>0&&y<s.height;
        if(!valid) return {ok:false,reason:'Der Damm darf nicht auf dem Kartenrand verlaufen. Endpunkte weiter innen wählen.',budget:this.budget};
        if(seen.has(key(face))) return {ok:false,reason:'Der Dammverlauf kreuzt sich selbst.',budget:this.budget};
        if(this.damFaces.has(key(face))) return {ok:false,reason:'Hier steht bereits ein Damm. Endpunkte anders wählen.',budget:this.budget};
        const b=y*s.width+x,a=face.axis==='x'?b-1:b-s.width;
        if((this.occupied[a]||this.occupied[b]) && p.damHeight<=1000) buildingBlockedFaces++;
        const ends=face.axis==='x'?[[x,y],[x,y+1]]:[[x,y],[x+1,y]];
        if(previous && !ends.some(a=>previous!.some(b=>a[0]===b[0]&&a[1]===b[1]))) return {ok:false,reason:'Dammverlauf ist nicht zusammenhängend.',budget:this.budget};
        previous=ends; seen.add(key(face));
      }
      const vertices=new Map<string,number>();
      for(const face of action.faces){
        const x=face.axis==='x'?face.index%(s.width+1):face.index%s.width;
        const y=face.axis==='x'?Math.floor(face.index/(s.width+1)):Math.floor(face.index/s.width);
        for(const [vx,vy] of face.axis==='x'?[[x,y],[x,y+1]]:[[x,y],[x+1,y]]){
          const vertex=`${vx},${vy}`;vertices.set(vertex,(vertices.get(vertex)??0)+1);
        }
      }
      const existingVertices=new Set<string>();
      for(const key of this.damFaces.keys()){
        const [axis,raw]=key.split(':'),index=Number(raw),x=axis==='x'?index%(s.width+1):index%s.width,y=axis==='x'?Math.floor(index/(s.width+1)):Math.floor(index/s.width);
        for(const [vx,vy] of axis==='x'?[[x,y],[x,y+1]]:[[x,y],[x+1,y]])existingVertices.add(`${vx},${vy}`);
      }
      nearBoundaryGap=[...vertices].some(([vertex,count])=>{
        const [x,y]=vertex.split(',').map(Number);
        return count===1&&!existingVertices.has(vertex)&&((x===1||x===s.width-1)&&y>0&&y<s.height||(y===1||y===s.height-1)&&x>0&&x<s.width);
      });
      nearDamGap=[...vertices].some(([vertex,count])=>{
        if(count!==1||existingVertices.has(vertex))return false;
        const [x,y]=vertex.split(',').map(Number);
        return [[x-1,y],[x+1,y],[x,y-1],[x,y+1]].some(([vx,vy])=>{
          const neighbour=`${vx},${vy}`;
          return existingVertices.has(neighbour)&&!vertices.has(neighbour);
        });
      });
      cost=action.faces.length*p.damCostPerCell;
    } else if(action.kind==='trench') {
      if(!Array.isArray(action.cells)||!action.cells.length||action.cells.length>500) return {ok:false,reason:'Ungültiger Grabenverlauf.',budget:this.budget};
      const seen=new Set<number>(); let previous: number | undefined;
      for(const i of action.cells) {
        if(!Number.isInteger(i)||i<0||i>=s.h.length) return {ok:false,reason:'Der Graben muss innerhalb der Karte liegen.',budget:this.budget};
        if(seen.has(i)) return {ok:false,reason:'Der Grabenverlauf kreuzt sich selbst.',budget:this.budget};
        if(this.trenchCells.has(i)) reusedCells++;
        if(this.occupied[i]) return {ok:false,reason:'Ein Gebäude versperrt den Graben. Verlauf ändern oder Gebäude abreißen.',budget:this.budget};
        if(previous!==undefined && Math.abs(i%s.width-previous%s.width)+Math.abs(Math.floor(i/s.width)-Math.floor(previous/s.width))!==1) return {ok:false,reason:'Grabenverlauf ist nicht zusammenhängend.',budget:this.budget};
        previous=i; seen.add(i);
      }
      if(reusedCells===action.cells.length) return {ok:false,reason:'Hier wurde bereits gegraben. Endpunkte anders wählen.',budget:this.budget};
      nearOutletGap=[action.cells[0],action.cells[action.cells.length-1]].some(i=>{
        const x=i%s.width,y=Math.floor(i/s.width);
        return (s.openBoundary.left&&x===1)||(s.openBoundary.right&&x===s.width-2)||(s.openBoundary.top&&y===1)||(s.openBoundary.bottom&&y===s.height-2);
      });
      cost=(action.cells.length-reusedCells)*p.trenchCostPerCell;
      for(const face of this.scenario.surveyCrests) {
        const x=face.axis==='x'?face.index%(s.width+1):face.index%s.width;
        const y=face.axis==='x'?Math.floor(face.index/(s.width+1)):Math.floor(face.index/s.width);
        const b=y*s.width+x,a=face.axis==='x'?b-1:b-s.width;
        if((seen.has(a)||this.trenchCells.has(a)) && (seen.has(b)||this.trenchCells.has(b)) && !(this.trenchCells.has(a)&&this.trenchCells.has(b))) loweredCrests++;
      }
    } else if(action.kind==='demolish') {
      const b=this.byId.get(action.buildingId);
      if(!b||b.demolished) return {ok:false,reason:'Gebäude nicht vorhanden oder bereits abgerissen.',budget:this.budget};
      cost=Math.ceil(b.value*p.demolitionCostFraction);
    } else return {ok:false,reason:'Unbekanntes Werkzeug.',budget:this.budget};
    if(cost>this.budget) return {ok:false,reason:'Budget reicht nicht aus.',budget:this.budget};
    return {ok:true,cost,budget:this.budget-cost,...(loweredCrests?{loweredCrests}:{}),...(buildingBlockedFaces?{buildingBlockedFaces}:{}),...(reusedCells?{reusedCells}:{}),...(nearBoundaryGap?{nearBoundaryGap:true}:{}),...(nearDamGap?{nearDamGap:true}:{}),...(nearOutletGap?{nearOutletGap:true}:{})};
  }
  hasProcessedAction(id:string):boolean { return this.actionResults.has(id); }
  apply(id:string,action:Action):ActionResult {
    if(typeof id!=='string'||id.length<1||id.length>100) return {ok:false,reason:'Ungültige Aktionskennung.',budget:this.budget};
    const prior=this.actionResults.get(id); if(prior) return prior;
    const result=this.preview(action); this.actionResults.set(id,result);
    if(!result.ok) return result;
    const s=this.solver,p=this.scenario.parameters;
    if(action.kind==='dam') for(const face of action.faces) {
      this.damFaces.set(key(face),damCrest(face,s.width,s.height,s.bed,p.damHeight));
    }
    else if(action.kind==='trench') {for(const i of action.cells) if(!this.trenchCells.has(i)) {s.bed[i]-=p.trenchDepth;this.trenchCells.add(i);}}
    else {const b=this.byId.get(action.buildingId)!;b.demolished=true;for(const i of b.cells)this.occupied[i]--;}
    this.budget=result.budget; this.rebuildCrests();
    return result;
  }
}
