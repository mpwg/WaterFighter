"""Rasterisiere hoch liegende 3D-Bruchlinien als vorläufige Zellkanten."""
import math

def derive_faces(s):
    width=s['grid']['width']; height=s['grid']['height']; cell=s['grid']['cellSize']; bed=s['bed']; candidates={}
    def record(axis,x,y,elevation):
        if axis=='x':
            if not(0<x<width and 0<=y<height): return
            index=y*(width+1)+x; a=y*width+x-1; b=a+1
        else:
            if not(0<y<height and 0<=x<width): return
            index=y*width+x; a=(y-1)*width+x; b=y*width+x
        # Avoid adding artificial barriers where the cell averages already retain the crest.
        if elevation-max(bed[a],bed[b])<=0.15:return
        key=(axis,index)
        candidates[key]=max(candidates.get(key,-math.inf),round(elevation,3))
    for line in s['breaklines']:
        if line['type']!=1:continue
        for p,q in zip(line['points'],line['points'][1:]):
            count=max(1,math.ceil(math.hypot(q[0]-p[0],q[1]-p[1])))
            prevx=round(p[0]/cell);prevy=round(p[1]/cell)
            for i in range(1,count+1):
                f=i/count;x=round((p[0]+f*(q[0]-p[0]))/cell);y=round((p[1]+f*(q[1]-p[1]))/cell);z=p[2]+f*(q[2]-p[2])
                while prevx!=x:
                    nx=prevx+(1 if x>prevx else -1);record('y',min(nx,prevx),prevy,z);prevx=nx
                while prevy!=y:
                    ny=prevy+(1 if y>prevy else -1);record('x',prevx,min(ny,prevy),z);prevy=ny
    return [{'axis':axis,'index':index,'crest':height} for (axis,index),height in sorted(candidates.items())]
