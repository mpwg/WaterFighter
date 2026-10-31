import type { BarrierSegment, Building, GameSnapshot, Point, V4Map } from './types';
export interface ViewState {hoverBuilding:Building|null;selected:Building|null;hoverBarrier:BarrierSegment|null;valid:boolean;tool:'barrier'|'demolition';blast:{point:Point;at:number}|null;reducedMotion:boolean;}
const INK='#172a35',ORANGE='#d44827';
function path(ctx:CanvasRenderingContext2D,points:Point[]){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));}
function geometry(ctx:CanvasRenderingContext2D,b:Building){
  ctx.beginPath();const groups=b.geometry.type==='Polygon'?[b.geometry.coordinates as number[][][]]:b.geometry.coordinates as number[][][][];
  for(const rings of groups)for(const ring of rings){ring.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();}
}
export class MapRenderer {
  private ctx:CanvasRenderingContext2D;private base=document.createElement('canvas');private wet=document.createElement('canvas');private wetCtx:CanvasRenderingContext2D;
  private image:ImageData;private size:number;
  constructor(private canvas:HTMLCanvasElement,private map:V4Map){
    this.ctx=canvas.getContext('2d')!;this.size=map.width*map.cellSize;
    this.base.width=this.base.height=1024;this.wet.width=map.width;this.wet.height=map.height;this.wetCtx=this.wet.getContext('2d')!;this.image=this.wetCtx.createImageData(map.width,map.height);
    this.baseMap();
  }
  private cells(ctx:CanvasRenderingContext2D,b:Building){for(const i of b.cells)ctx.fillRect(i%this.map.width*this.map.cellSize,Math.floor(i/this.map.width)*this.map.cellSize,this.map.cellSize,this.map.cellSize);}
  private baseMap(){
    const ctx=this.base.getContext('2d')!;ctx.scale(1024/this.size,1024/this.size);ctx.fillStyle='#ede9dc';ctx.fillRect(0,0,this.size,this.size);
    // Official road centerlines are context; their labels are deduplicated below.
    ctx.lineCap='round';for(const road of this.map.roads){path(ctx,road.points);ctx.lineWidth=11;ctx.strokeStyle='#faf7eb';ctx.stroke();ctx.lineWidth=.4;ctx.strokeStyle='#c8c5b4';ctx.stroke();}
    for(const b of this.map.buildings){ctx.save();ctx.translate(-.65,-1.1);ctx.fillStyle='#a9a594';this.cells(ctx,b);ctx.restore();ctx.fillStyle=b.zone==='protected'?'#c4bcaa':'#d4c9b5';this.cells(ctx,b);
      geometry(ctx,b);ctx.lineWidth=.45;ctx.strokeStyle='#a89e89';ctx.stroke();
    }
    const names=['Lassallestraße','Vorgartenstraße','Ennsgasse','Ybbsstraße','Mexikoplatz','Wohlmutstraße','Walcherstraße','Engerthstraße'];
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='600 5.5px sans-serif';
    for(const name of names){const roads=this.map.roads.filter(r=>r.name===name).sort((a,b)=>this.length(b.points)-this.length(a.points));const road=roads[0];if(!road||this.length(road.points)<60)continue;
      const middle=Math.floor((road.points.length-1)/2),a=road.points[middle],b=road.points[middle+1];if(!b)continue;
      let angle=Math.atan2(b[1]-a[1],b[0]-a[0]);if(angle>Math.PI/2||angle<-Math.PI/2)angle+=Math.PI;
      ctx.save();ctx.translate((a[0]+b[0])/2,(a[1]+b[1])/2);ctx.rotate(angle);ctx.strokeStyle='#faf7eb';ctx.lineWidth=2.6;ctx.strokeText(name,0,0);ctx.fillStyle='#4b514c';ctx.fillText(name,0,0);ctx.restore();
    }
  }
  private length(points:Point[]){let length=0;for(let i=1;i<points.length;i++)length+=Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]);return length;}
  draw(snapshot:GameSnapshot,view:ViewState,now:number){
    const rect=this.canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2.5),pixels=Math.round(rect.width*dpr);
    if(this.canvas.width!==pixels||this.canvas.height!==pixels){this.canvas.width=pixels;this.canvas.height=pixels;}
    const ctx=this.ctx;ctx.setTransform(pixels/this.size,0,0,pixels/this.size,0,0);ctx.clearRect(0,0,this.size,this.size);ctx.drawImage(this.base,0,0,this.size,this.size);
    for(const id of snapshot.demolished){const b=this.map.buildings.find(b=>b.id===id);if(!b)continue;ctx.fillStyle='#e9dfc7';this.cells(ctx,b);geometry(ctx,b);ctx.strokeStyle='#a69a81';ctx.lineWidth=.6;ctx.setLineDash([1,2]);ctx.stroke();ctx.setLineDash([]);}
    const pixelsData=this.image.data;
    for(let i=0;i<snapshot.depths.length;i++){const depth=snapshot.depths[i],o=i*4;pixelsData[o]=129;pixelsData[o+1]=80;pixelsData[o+2]=44;pixelsData[o+3]=depth>.012?Math.min(220,90+depth*85):0;}
    this.wetCtx.putImageData(this.image,0,0);ctx.imageSmoothingEnabled=false;ctx.drawImage(this.wet,0,0,this.size,this.size);
    // Every highlighted front is an edge of an actually wet simulation cell.
    ctx.strokeStyle='#80522e';ctx.lineWidth=.45;ctx.beginPath();
    const w=this.map.width,c=this.map.cellSize;
    for(let i=0;i<snapshot.depths.length;i++){if(snapshot.depths[i]<.05)continue;const x=i%w,y=Math.floor(i/w);if(y===0||snapshot.depths[i-w]<.05){ctx.moveTo(x*c,y*c);ctx.lineTo((x+1)*c,y*c);}if(x===0||snapshot.depths[i-1]<.05){ctx.moveTo(x*c,y*c);ctx.lineTo(x*c,(y+1)*c);}}
    ctx.stroke();
    // Arrows are the actual signed flux components from the solver, located at their cells.
    ctx.strokeStyle='#fff0c6';ctx.fillStyle='#fff0c6';ctx.lineWidth=.9;
    for(let y=4;y<this.map.height;y+=8)for(let x=4;x<this.map.width;x+=8){const i=y*w+x,fx=snapshot.flowX[i],fy=snapshot.flowY[i],mag=Math.hypot(fx,fy);if(snapshot.depths[i]<.04||mag<.012)continue;
      const len=Math.min(10,3+Math.sqrt(mag)*2),ux=fx/mag,uy=fy/mag,px=(x+.5)*c,py=(y+.5)*c;
      ctx.beginPath();ctx.moveTo(px-ux*len/2,py-uy*len/2);ctx.lineTo(px+ux*len/2,py+uy*len/2);ctx.stroke();ctx.beginPath();ctx.moveTo(px+ux*len/2,py+uy*len/2);ctx.lineTo(px+ux*(len/2-2)-uy*1.6,py+uy*(len/2-2)+ux*1.6);ctx.lineTo(px+ux*(len/2-2)+uy*1.6,py+uy*(len/2-2)-ux*1.6);ctx.fill();
    }
    // Source ticks occupy the real boundary cells; no painted flood extent.
    ctx.fillStyle=ORANGE;for(const i of this.map.sourceCells)ctx.fillRect(i%w*c,Math.floor(i/w)*c,c,c);
    for(const id of snapshot.barriers){const s=this.map.barrierSegments.find(s=>s.id===id);if(s)this.barrier(s,INK,2.5);}
    const selected=view.selected??view.hoverBuilding;
    if(view.tool==='demolition'&&selected&&!snapshot.demolished.includes(selected.id)){
      ctx.fillStyle=view.selected?'#d4482755':'#d4482733';this.cells(ctx,selected);geometry(ctx,selected);ctx.strokeStyle=ORANGE;ctx.lineWidth=1.2;ctx.stroke();
      // Explicit occupied-cell edges make the 2m hydraulic footprint inspectable.
      ctx.strokeStyle='#d4482780';ctx.lineWidth=.3;for(const i of selected.cells)ctx.strokeRect(i%w*c,Math.floor(i/w)*c,c,c);
    }
    if(view.tool==='barrier'&&view.hoverBarrier){const existing=snapshot.barriers.includes(view.hoverBarrier.id);this.barrier(view.hoverBarrier,existing?ORANGE:view.valid?'#237d69':'#d44827',2);}
    if(view.blast){const age=now-view.blast.at;if(age<550){const [x,y]=view.blast.point;ctx.save();ctx.globalAlpha=1-age/550;ctx.strokeStyle=ORANGE;ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,view.reducedMotion?7:4+age/35,0,Math.PI*2);ctx.stroke();ctx.font='bold 6px sans-serif';ctx.textAlign='center';ctx.fillStyle=INK;ctx.fillText('ABRISS',x,y-12);ctx.restore();}}
    ctx.font='bold 6px sans-serif';ctx.textAlign='right';ctx.fillStyle=INK;ctx.fillText('N ↑',this.size-9,13);
    ctx.lineWidth=.9;ctx.strokeStyle=INK;ctx.beginPath();ctx.moveTo(this.size-63,this.size-13);ctx.lineTo(this.size-13,this.size-13);ctx.stroke();ctx.font='5px sans-serif';ctx.fillText('50 m',this.size-13,this.size-18);
  }
  private barrier(segment:BarrierSegment,color:string,width:number){const ctx=this.ctx;path(ctx,segment.points);ctx.strokeStyle='#faf6e6';ctx.lineWidth=width+1.4;ctx.lineCap='butt';ctx.lineJoin='miter';ctx.stroke();ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
}
