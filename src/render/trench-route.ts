/** Adjacent confirmed cells form a schematic route; isolated cells remain visible. */
export function trenchRouteSegments(cells:readonly number[],width:number):[number,number][] {
  const selected=new Set(cells),segments:[number,number][]=[];
  for(const i of selected){
    const x=i%width;
    if(x+1<width&&selected.has(i+1))segments.push([i,i+1]);
    if(selected.has(i+width))segments.push([i,i+width]);
    if(!(x>0&&selected.has(i-1))&&!(x+1<width&&selected.has(i+1))&&!selected.has(i-width)&&!selected.has(i+width))segments.push([i,i]);
  }
  return segments;
}
