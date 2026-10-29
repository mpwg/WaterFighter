import type {Scenario} from '../scenario';

type Edge='top'|'bottom'|'left'|'right';
export interface BoundaryArrow { edge:Edge; position:number; kind:'inflow'|'outflow' }

/** Arrow coordinates in scenario metres; each pair is a line segment. */
export function boundaryArrowLines(arrow:BoundaryArrow,width:number,height:number,cell:number):[[number,number],[number,number]][] {
 const along=arrow.position*cell;
 const [x,y,ix,iy]=arrow.edge==='top'?[along,0,0,1]:arrow.edge==='bottom'?[along,height*cell,0,-1]:arrow.edge==='left'?[0,along,1,0]:[width*cell,along,-1,0];
 const direction=arrow.kind==='inflow'?1:-1,dx=ix*direction,dy=iy*direction;
 const start:[number,number]=[x-dx*28,y-dy*28],end:[number,number]=[x+dx*28,y+dy*28];
 const left:[number,number]=[end[0]-dx*16-dy*10,end[1]-dy*16+dx*10];
 const right:[number,number]=[end[0]-dx*16+dy*10,end[1]-dy*16-dx*10];
 return [[start,end],[end,left],[end,right]];
}

/** Schematic arrows: inflow spans and open edges, not measured flow paths. */
export function boundaryArrows(scenario:Scenario):BoundaryArrow[] {
 const {width,height}=scenario.grid;
 const groups:Record<Edge,number[]>={top:[],bottom:[],left:[],right:[]};
 for(const i of scenario.parameters.inflowCells){
  const x=i%width,y=Math.floor(i/width);
  if(y===0)groups.top.push(x);else if(y===height-1)groups.bottom.push(x);else if(x===0)groups.left.push(y);else if(x===width-1)groups.right.push(y);
 }
 const arrows:BoundaryArrow[]=[];
 for(const edge of ['top','bottom','left','right'] as const){
  const values=groups[edge].sort((a,b)=>a-b);let first=0;
  while(first<values.length){let last=first;while(last+1<values.length&&values[last+1]===values[last]+1)last++;
   arrows.push({edge,position:(values[first]+values[last]+1)/2,kind:'inflow'});first=last+1;
  }
  if(scenario.parameters.outflowEdges.includes(edge)){
   const length=edge==='top'||edge==='bottom'?width:height;
   for(const fraction of [0.25,0.5,0.75])arrows.push({edge,position:length*fraction,kind:'outflow'});
  }
 }
 return arrows;
}
