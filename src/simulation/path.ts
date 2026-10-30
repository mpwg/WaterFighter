import type { Face } from './game';
/** Connected grid-face approximation of the line between selected vertices. */
export function damPath(start:[number,number],end:[number,number],width:number):Face[] {
  // Use one canonical direction so reversed endpoints produce the same dam.
  const reverse=start[0]>end[0] || (start[0]===end[0] && start[1]>end[1]);
  let [x,y]=reverse?end:start;const [tx,ty]=reverse?start:end;
  const dx=Math.abs(tx-x),dy=Math.abs(ty-y),faces:Face[]=[];let ix=0,iy=0;
  while(ix<dx||iy<dy) {
    if(ix<dx && (iy===dy || (2*ix+1)*dy<=(2*iy+1)*dx)) {
      const nx=x+Math.sign(tx-x);faces.push({axis:'y',index:y*width+Math.min(x,nx)});x=nx;ix++;
    } else {
      const ny=y+Math.sign(ty-y);faces.push({axis:'x',index:Math.min(y,ny)*(width+1)+x});y=ny;iy++;
    }
  }
  return reverse?faces.reverse():faces;
}
/** A face-connected raster approximation of the line between two selected cells. */
export function trenchPath(start:[number,number],end:[number,number],width:number):number[] {
  // Canonical traversal makes reversing the selected endpoints preserve the same cells.
  const reverse=start[0]>end[0] || (start[0]===end[0] && start[1]>end[1]);
  let [x,y]=reverse?end:start;const [tx,ty]=reverse?start:end;
  const dx=Math.abs(tx-x),dy=Math.abs(ty-y),cells=[y*width+x];let ix=0,iy=0;
  while(ix<dx||iy<dy) {
    if(ix<dx && (iy===dy || (2*ix+1)*dy<=(2*iy+1)*dx)) {x+=Math.sign(tx-x);ix++;}
    else {y+=Math.sign(ty-y);iy++;}
    cells.push(y*width+x);
  }
  return reverse?cells.reverse():cells;
}

/** Snap only locally; every chosen endpoint remains visible in the resulting path. */
type Point = [number,number];
function nearby(point:Point,candidates:Point[],radius=2):Point[] {
  const [x,y]=point,seen=new Set<string>();
  return candidates.map(p=>({p,d:(p[0]-x)**2+(p[1]-y)**2}))
    .filter(({p,d})=>d<=radius*radius && !seen.has(`${p[0]},${p[1]}`) && !!seen.add(`${p[0]},${p[1]}`))
    .sort((a,b)=>a.d-b.d || a.p[1]-b.p[1] || a.p[0]-b.p[0]).map(({p})=>p);
}
function damVertices(dams:Iterable<string>,width:number):Point[] {
  const vertices=new Set<string>();
  for(const key of dams){
    const [axis,raw]=key.split(':'),i=Number(raw),x=axis==='x'?i%(width+1):i%width,y=Math.floor(i/(axis==='x'?width+1:width));
    for(const [vx,vy] of axis==='x'?[[x,y],[x,y+1]]:[[x,y],[x+1,y]]){vertices.add(`${vx},${vy}`);}
  }
  return [...vertices].map(k=>k.split(',').map(Number) as Point);
}
/** Ends near any existing dam vertex or map edge snap at most two cells. */
export function arcadeDamPath(start:Point,end:Point,width:number,height:number,existing:Iterable<string>):Face[] {
  if(start[0]===end[0]&&start[1]===end[1])return [];
  if(start[0]>end[0]||(start[0]===end[0]&&start[1]>end[1]))return arcadeDamPath(end,start,width,height,existing).reverse();
  const keys=new Set(existing),ends=damVertices(keys,width);
  const candidates=(p:Point)=>{
    const [x,y]=p,edges:Point[]=[[0,y],[width,y],[x,0],[x,height]];
    const found=nearby(p,[...ends,...edges]);
    if(found.some(q=>q[0]===x&&q[1]===y))return [p];
    return [...found,p];
  };
  for(const a of candidates(start))for(const b of candidates(end)){
    const faces=damPath(a,b,width);
    if(!faces.length)continue;
    if(faces.every(face=>{
      const x=face.axis==='x'?face.index%(width+1):face.index%width,y=Math.floor(face.index/(face.axis==='x'?width+1:width));
      return face.axis==='x'?x>0&&x<width&&y>=0&&y<height:x>=0&&x<width&&y>0&&y<height;
    }))return faces;
  }
  return damPath(start,end,width);
}
/** Extend a nearby end to an open edge or an existing trench cell. */
export function arcadeTrenchPath(start:Point,end:Point,width:number,height:number,existing:Iterable<number>,openEdges:readonly string[]):number[] {
  const trenches=[...existing].map(i=>[i%width,Math.floor(i/width)] as Point);
  const candidates=(p:Point)=>{
    const [x,y]=p,edges:Point[]=[];
    if(openEdges.includes('left'))edges.push([0,y]);if(openEdges.includes('right'))edges.push([width-1,y]);
    if(openEdges.includes('top'))edges.push([x,0]);if(openEdges.includes('bottom'))edges.push([x,height-1]);
    return nearby(p,[...edges,...trenches])[0]??p;
  };
  const a=candidates(start),b=candidates(end);
  if(a[0]===b[0]&&a[1]===b[1]&&(start[0]!==end[0]||start[1]!==end[1]))return trenchPath(start,end,width);
  return trenchPath(a,b,width);
}

/** Three-cell-wide footprint clipped to the model boundary. */
export function wideTrenchCells(cells:readonly number[],width:number,height:number):number[] {
  const expanded=new Set(cells);
  for(const i of cells){const x=i%width,y=Math.floor(i/width);for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]]){const nx=x+dx,ny=y+dy;if(nx>=0&&nx<width&&ny>=0&&ny<height)expanded.add(ny*width+nx);}}
  return [...expanded];
}
