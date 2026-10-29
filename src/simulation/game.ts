import type { Building, Scenario } from '../scenario';
import { ShallowWaterSolver } from './solver';
import { damCrest } from './dam-height';

export type Face = { axis: 'x' | 'y'; index: number };
export type Action = { kind: 'dam'; faces: Face[] } | { kind: 'trench'; cells: number[] } | { kind: 'demolish'; buildingId: string };
export type ActionResult = { ok: true; cost: number; budget: number } | { ok: false; reason: string; budget: number };
export interface BuildingStatus { id: string; value: number; damage: number; demolished: boolean }
interface BuildingState extends BuildingStatus { cells: number[]; neighbours: number[] }
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
  status():BuildingStatus[] { return this.buildings.map(({id,value,damage,demolished})=>({id,value,damage,demolished})); }
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
    let cost=0;
    if(!action || typeof action!=='object') return {ok:false,reason:'Ungültige Aktion.',budget:this.budget};
    if(action.kind==='dam') {
      if(!Array.isArray(action.faces)||!action.faces.length||action.faces.length>500) return {ok:false,reason:'Ungültiger Dammverlauf.',budget:this.budget};
      const seen=new Set<string>(); let previous: number[][] | undefined;
      for(const face of action.faces) {
        if(!face || (face.axis!=='x'&&face.axis!=='y') || !Number.isInteger(face.index)) return {ok:false,reason:'Ungültige Dammkante.',budget:this.budget};
        const x=face.axis==='x'?face.index%(s.width+1):face.index%s.width;
        const y=face.axis==='x'?Math.floor(face.index/(s.width+1)):Math.floor(face.index/s.width);
        const valid=face.axis==='x'?x>0&&x<s.width&&y>=0&&y<s.height:x>=0&&x<s.width&&y>0&&y<s.height;
        if(!valid||seen.has(key(face))||this.damFaces.has(key(face))) return {ok:false,reason:'Dammkante ungültig oder bereits bebaut.',budget:this.budget};
        const ends=face.axis==='x'?[[x,y],[x,y+1]]:[[x,y],[x+1,y]];
        if(previous && !ends.some(a=>previous!.some(b=>a[0]===b[0]&&a[1]===b[1]))) return {ok:false,reason:'Dammverlauf ist nicht zusammenhängend.',budget:this.budget};
        previous=ends; seen.add(key(face));
      }
      cost=action.faces.length*p.damCostPerCell;
    } else if(action.kind==='trench') {
      if(!Array.isArray(action.cells)||!action.cells.length||action.cells.length>500) return {ok:false,reason:'Ungültiger Grabenverlauf.',budget:this.budget};
      const seen=new Set<number>(); let previous: number | undefined;
      for(const i of action.cells) {
        if(!Number.isInteger(i)||i<0||i>=s.h.length||seen.has(i)||this.trenchCells.has(i)||this.occupied[i]) return {ok:false,reason:'Grabenzelle ungültig, bebaut oder bereits ausgehoben.',budget:this.budget};
        if(previous!==undefined && Math.abs(i%s.width-previous%s.width)+Math.abs(Math.floor(i/s.width)-Math.floor(previous/s.width))!==1) return {ok:false,reason:'Grabenverlauf ist nicht zusammenhängend.',budget:this.budget};
        previous=i; seen.add(i);
      }
      cost=action.cells.length*p.trenchCostPerCell;
    } else if(action.kind==='demolish') {
      const b=this.byId.get(action.buildingId);
      if(!b||b.demolished) return {ok:false,reason:'Gebäude nicht vorhanden oder bereits abgerissen.',budget:this.budget};
      cost=Math.ceil(b.value*p.demolitionCostFraction);
    } else return {ok:false,reason:'Unbekanntes Werkzeug.',budget:this.budget};
    if(cost>this.budget) return {ok:false,reason:'Budget reicht nicht aus.',budget:this.budget};
    return {ok:true,cost,budget:this.budget-cost};
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
    else if(action.kind==='trench') for(const i of action.cells) {s.bed[i]-=p.trenchDepth;this.trenchCells.add(i);}
    else {const b=this.byId.get(action.buildingId)!;b.demolished=true;for(const i of b.cells)this.occupied[i]--;}
    this.budget=result.budget; this.rebuildCrests();
    return result;
  }
}
