import type {Terrain} from './types';
/** Designed lowland settlement. All positions remain exact solver cell coordinates. */
export function createTerrain(width=256,height=192):Terrain {
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<8||height<8)throw new Error('Grid dimensions must be integers >= 8');
  const center=(x:number)=>height*(.285+.145*Math.sin(x/width*Math.PI*2-.8));
  const half=(x:number)=>height*(.055+.009*Math.cos(x/width*Math.PI*4+.3));
  const bank=(x:number)=>center(x)+half(x)+height*.025;
  const t:Terrain={width,height,cellSize:2,heights:new Float64Array(width*height),obstacles:new Uint8Array(width*height),river:new Uint8Array(width*height),roads:new Uint8Array(width*height),riverCenterline:[],buildings:[],gates:[]};
  for(let x=0;x<width;x++){
    const slope=(center(x+1)-center(x-1))/2,norm=Math.hypot(1,slope);
    t.riverCenterline!.push({x,y:center(x),halfWidth:half(x),dx:1/norm,dy:slope/norm});
    for(let y=0;y<height;y++){
      const i=y*width+x,distance=Math.abs(y-center(x)),shore=distance-half(x),south=y-bank(x);
      t.river[i]=shore<0?1:0;
      const ripples=.055*Math.sin(x*.09+y*.07)*Math.cos(y*.11-x*.04);
      // Flat alluvial apron, a settled terrace, then the wooded escarpment.
      const terrace=Math.max(0,south-height*.15)/height;
      const north=Math.max(0,center(x)-half(x)-y-height*.055)/height;
      t.heights[i]=shore<0? -1.15+.3*(distance/half(x))**2:
        .25+Math.max(0,shore)/height*1.1+terrace*3.8+Math.max(0,terrace-.27)*24+north*38+ripples;
      if(Math.abs(south)<1.5)t.heights[i]=2.35;
    }
  }
  const gx=Math.floor(width*.7),gy=Math.round(bank(gx));
  const edges=[];
  // On narrow maps the bank can move several rows within the gate width.
  // Join it to a horizontal control section with continuous retaining shoulders.
  const fitControl=Math.max(Math.abs(bank(gx-3)-gy),Math.abs(bank(gx+3)-gy))>3;
  if(fitControl)for(const x of [gx-4,gx+4])if(x>=0&&x<width){
    for(let y=Math.max(0,Math.floor(Math.min(bank(x)-2,gy-1)));y<=Math.min(height-1,Math.ceil(Math.max(bank(x)+2,gy+2)));y++){
      t.heights[y*width+x]=2.35;t.river[y*width+x]=0;
    }
  }
  // A seven-cell culvert through the curved embankment, bounded by intact shoulders.
  for(let x=Math.max(0,gx-3);x<=Math.min(width-1,gx+3);x++){
    const start=fitControl?Math.min(Math.floor(bank(x))-3,gy-2):Math.floor(bank(x))-3;
    const end=fitControl?Math.max(Math.ceil(bank(x))+3,gy+2):Math.ceil(bank(x))+3;
    for(let y=Math.max(0,start);y<=Math.min(height-1,end);y++){
      t.heights[y*width+x]=.25;
      // Downstream culvert cells exchange only through the controlled section.
      if(fitControl&&y>gy)t.river[y*width+x]=0;
    }
    edges.push({a:gy*width+x,b:(gy+1)*width+x});
  }
  t.gates.push({id:0,a:gy*width+gx,b:(gy+1)*width+gx,x:gx,y:gy,sill:2.35,edges});
  if(width<64||height<64)return t;
  // Two streets follow the landform; the inland lane joins the market bend.
  const streets=[(u:number)=>bank(u*width)+height*.075,
    (u:number)=>height*(.66+.075*Math.sin(u*5.2+.4)),
    (u:number)=>height*(.84-.12*u+.025*Math.sin(u*9))];
  const stamp=(x:number,y:number)=>{for(let yy=Math.round(y)-1;yy<=Math.round(y)+1;yy++)for(let xx=Math.round(x)-1;xx<=Math.round(x)+1;xx++)if(xx>=0&&xx<width&&yy>=0&&yy<height&&!t.river[yy*width+xx])t.roads![yy*width+xx]=1;};
  for(const street of streets)for(let x=5;x<width-5;x+=.3)stamp(x,street(x/width));
  // Small connecting lanes at the village centre and western farm junction.
  for(const u of [.27,.57]){
    const from=streets[0](u),to=streets[2](u);
    for(let y=from;y<to;y+=.3)stamp(u*width+4*Math.sin((y-from)/height*9),y);
  }
  const sizes=[[6,8],[8,6],[5,7],[7,5],[6,6],[9,7],[7,9]];
  const place=(cx:number,cy:number,k:number)=>{
    const [bw,bh]=sizes[k%sizes.length],x=Math.round(cx-bw/2),y=Math.round(cy-bh/2);
    if(x<3||y<3||x+bw>=width-3||y+bh>=height-3)return;
    // Preserve the established open practice meadow and avoid crowding parcels.
    if(x<115&&x+bw>96&&y<160&&y+bh>146)return;
    for(let yy=y-2;yy<y+bh+2;yy++)for(let xx=x-2;xx<x+bw+2;xx++)if(t.obstacles[yy*width+xx]||t.river[yy*width+xx]||t.roads![yy*width+xx]||t.heights[yy*width+xx]>2.8)return;
    const id=t.buildings.length;t.buildings.push({id,x,y,width:bw,height:bh,people:2+(id*7)%5});
    for(let yy=y;yy<y+bh;yy++)for(let xx=x;xx<x+bw;xx++)t.obstacles[yy*width+xx]=1;
  };
  // Parcels alternate across curved streets; deliberate gaps leave orchards and fields.
  let k=0;
  for(let s=0;s<streets.length;s++)for(let x=15+s*4;x<width-12;){
    const u=x/width;
    for(const side of [-1,1])place(x+(side===1?3:0),streets[s](u)+side*(8+(k%3)),k++);
    x+=u>.22&&u<.67?12+(k%4):19+(k%7);
  }
  return t;
}
