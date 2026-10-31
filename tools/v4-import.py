#!/usr/bin/env python3
"""Import real Vienna OGD into the V4 map. Requires numpy,rasterio,shapely."""
import argparse, hashlib, json, math, pathlib, urllib.request
import numpy as np
import rasterio
from shapely.geometry import shape,box,Point,LineString,mapping
from shapely.ops import unary_union
from rasterio.features import rasterize
from rasterio.transform import from_origin
P=argparse.ArgumentParser(); P.add_argument('--raw-dir',default='/tmp/v4-raw');P.add_argument('--output',default='public/v4/map.json');P.add_argument('--download',action='store_true'); args=P.parse_args()
raw=pathlib.Path(args.raw_dir);raw.mkdir(parents=True,exist_ok=True)
bounds=[5042.3438,342463.8906,5554.3438,342975.8906]; left,bottom,right,top=bounds
sources=[('roads-wide.json','https://data.wien.gv.at/daten/geo?service=WFS&version=1.1.0&request=GetFeature&typeName=ogdwien:STRASSENGRAPHOGD&outputFormat=json&srsName=EPSG:31256&bbox=5042.3438,342463.8906,5554.3438,342975.8906,EPSG:31256'),('buildings.json','https://data.wien.gv.at/daten/geo?service=WFS&version=1.1.0&request=GetFeature&typeName=ogdwien:FMZKGEBOGD&outputFormat=json&srsName=EPSG:31256&bbox=5042.3438,342463.8906,5554.3438,342975.8906,EPSG:31256')]+[(s+'_dgm_tif.zip','https://www.wien.gv.at/ma41datenviewer/downloads/geodaten/dgm_tif/'+s+'_dgm_tif.zip') for s in ['36_1','36_3']]
for fn,url in sources:
 if args.download and not (raw/fn).exists():urllib.request.urlretrieve(url,raw/fn)
 if not (raw/fn).exists():raise RuntimeError('Missing official input: '+fn)
# Sample DGM at exact 2m cell centers; no elevation offset, smoothing or invented terrain.
coords=[(left+(x+.5)*2,top-(y+.5)*2) for y in range(256) for x in range(256)]
heights=np.full(65536,np.nan)
for s in ['36_1','36_3']:
 with rasterio.open('/vsizip/'+str((raw/(s+'_dgm_tif.zip')).resolve())+'/'+s+'_dgm.tif') as r:
  ix=[i for i,(x,y) in enumerate(coords) if r.bounds.left<=x<r.bounds.right and r.bounds.bottom<=y<r.bounds.top]
  heights[ix]=[float(a[0]) for a in r.sample([coords[i] for i in ix])]
assert np.isfinite(heights).all() and heights.min()>-10 and heights.max()<100, 'Invalid/missing official terrain'
clip=box(*bounds); groups={}
for f in json.loads((raw/'buildings.json').read_text())['features']:
 g=shape(f['geometry']).intersection(clip)
 if not g.is_empty and g.area>=2:
  k=str(f['properties'].get('BW_GEB_ID') or f['id']);groups.setdefault(k,[]).append(g)
def local(g):
 from shapely import transform
 return transform(g,lambda xy:np.column_stack((xy[:,0]-left,top-xy[:,1])))
occupied=np.zeros((256,256),dtype=np.int32);buildings=[]
for k,parts in sorted(groups.items()):
 g=unary_union(parts); mask=rasterize([(g,1)],out_shape=(256,256),transform=from_origin(left,top,2,2),fill=0).astype(bool)
 cells=np.flatnonzero(mask.ravel()).tolist()
 if not cells:continue
 index=len(buildings);occupied[mask]=index+1
 polygons=[list(map(list,p.exterior.coords)) for p in ([local(g)] if g.geom_type=='Polygon' else local(g).geoms) if p.geom_type=='Polygon']
 # Preserve interior rings as well: authoritative geometry, holes are open courtyards.
 geometry=mapping(local(g))
 buildings.append(dict(id='geb-'+k,name='Gebäude '+k,cells=cells,geometry=geometry,polygons=polygons,center=list(local(g.representative_point()).coords)[0],area=round(g.area,2),value=round(max(350,min(7000,g.area*2.5))),zone='protected'))
roads=[]
for f in json.loads((raw/'roads-wide.json').read_text())['features']:
 g=shape(f['geometry']).intersection(clip)
 if g.is_empty:continue
 for line in ([g] if g.geom_type=='LineString' else getattr(g,'geoms',[])):
  if line.geom_type=='LineString' and line.length>5:roads.append(dict(id=f['id']+'-'+str(len(roads)),name=f['properties']['FEATURENAME'],points=[list(p) for p in local(line).coords]))
# Staircase paths along grid vertices become exact solver faces, perpendicular to street centerlines.
segments=[]; seen=set()
for road in roads:
 line=LineString(road['points'])
 for fraction in [.2,.5,.8]:
  p=line.interpolate(line.length*fraction); a=line.interpolate(max(0,line.length*fraction-1));b=line.interpolate(min(line.length,line.length*fraction+1));dx,dy=b.x-a.x,b.y-a.y; length=math.hypot(dx,dy)
  if length==0:continue
  nx,ny=-dy/length,dx/length
  ends=[]
  for sign in [-1,1]:
   end=None
   for d in np.arange(2,31,1):
    x,y=p.x+nx*d*sign,p.y+ny*d*sign;c,r=int(x/2),int(y/2)
    if not(1<=c<255 and 1<=r<255):break
    end=(x,y)
    if occupied[r,c]:break
   ends.append(end)
  if None in ends:continue
  (x0,y0),(x1,y1)=[(round(x/2),round(y/2)) for x,y in ends];x,y=x0,y0; faces=[];path=[[x*2,y*2]]
  while (x,y)!=(x1,y1):
   # Ordered grid walk with minimal deviation from the original cross-section.
   sx=1 if x1>x else -1;sy=1 if y1>y else -1
   if x==x1:axis=1
   elif y==y1:axis=0
   else:axis=0 if abs((x+sx-x0)*(y1-y0)-(y-y0)*(x1-x0))<abs((x-x0)*(y1-y0)-(y+sy-y0)*(x1-x0)) else 1
   if axis==0:
    xx=x+sx; col=min(x,xx); aa=(y-1)*256+col;bb=y*256+col;x=xx
   else:
    yy=y+sy;row=min(y,yy);aa=row*256+x-1;bb=row*256+x;y=yy
   if 0<=aa<65536 and 0<=bb<65536 and not occupied.ravel()[aa] and not occupied.ravel()[bb]:
    faces.append([aa,bb]);path.append([x*2,y*2])
   elif faces:break
   else:path=[[x*2,y*2]]
  key=tuple(tuple(f) for f in faces)
  if 3<=len(faces)<=36 and key not in seen:
   seen.add(key);segments.append(dict(id='barrier-'+str(len(segments)),road=road['name'],faces=faces,points=path,center=[p.x,p.y],crestHeight=1.25))
# Fictional west-side Lassallestrasse breach: 64m-wide boundary window, open cells only.
entry=[0,232]
source=[r*256 for r in range(100,132) if not occupied[r,0]]
assert source
# Adjacent fictional value zones: northern protected quarter, southern sacrifice quarter.
for b in buildings:
 b['zone']='protected' if b['center'][1]<230 else 'sacrifice'
 if b['zone']=='protected':b['value']*=3
result=dict(schema='waterfighter-map/4',width=256,height=256,cellSize=2,crs='EPSG:31256',bounds=bounds,heights=[round(v,4) for v in heights],buildings=buildings,roads=roads,barrierSegments=segments,sourceCells=source,provenance=dict(imported='2026-10-31',attribution='Datenquelle: Stadt Wien - data.wien.gv.at',license='CC-BY-4.0',sources=[dict(file=fn,url=url,sha256=hashlib.sha256((raw/fn).read_bytes()).hexdigest()) for fn,url in sources],terrain='Unmodified DGM samples at 2m cell centers; absolute Wiener Null heights',fiction='Western Lassallestrasse boundary breach, accelerated water routing, building values/zones and barrier crest are fictional game calibration.'))
pathlib.Path(args.output).parent.mkdir(parents=True,exist_ok=True);pathlib.Path(args.output).write_text(json.dumps(result,separators=(',',':'))+'\n')
print(json.dumps(dict(buildings=len(buildings),roads=len(roads),barriers=len(segments),heightRange=[heights.min(),heights.max()],source=source,entry=entry)))
