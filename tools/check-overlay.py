#!/usr/bin/env python3
"""Vergleicht Szenariogeometrie mit basemap.at-Orthofoto; keine Laufzeit-Kacheln."""
import hashlib, io, json, math, sys, urllib.request
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw
from pyproj import Transformer
from rasterio.transform import from_origin
from rasterio.warp import reproject, Resampling

root=Path(__file__).resolve().parent.parent
scenario=json.loads((root/'public/scenarios/brigittenau-v1.json').read_text())
g=scenario['grid']; x0,top=g['origin']; size=g['width']*g['cellSize']; zoom=18; tile_size=256; half=20037508.342789244
project=Transformer.from_crs(31256,3857,always_xy=True)
corners=[project.transform(x,y) for x in (x0,x0+size) for y in (top-size,top)]
def tilex(x):return math.floor((x+half)/(2*half)*(2**zoom))
def tiley(y):return math.floor((half-y)/(2*half)*(2**zoom))
xmin,xmax=map(tilex,(min(p[0] for p in corners),max(p[0] for p in corners)))
ymin,ymax=map(tiley,(max(p[1] for p in corners),min(p[1] for p in corners)))
cache=root/'raw-data/basemap-orthofoto';cache.mkdir(parents=True,exist_ok=True)
manifest_path=root/'docs/orthofoto-kacheln.json'
expected=json.loads(manifest_path.read_text()) if manifest_path.exists() else {}
new={}; mosaic=np.zeros((3,(ymax-ymin+1)*tile_size,(xmax-xmin+1)*tile_size),dtype=np.uint8)
for ty in range(ymin,ymax+1):
 for tx in range(xmin,xmax+1):
  name=f'{zoom}-{ty}-{tx}.jpeg';file=cache/name
  if not file.exists():
   if '--download' not in sys.argv: raise RuntimeError(f'Kachel fehlt: {file}; --download zum Abrufen')
   url=f'https://mapsneu.wien.gv.at/basemap/bmaporthofoto30cm/normal/google3857/{zoom}/{ty}/{tx}.jpeg'
   with urllib.request.urlopen(url,timeout=30) as response: file.write_bytes(response.read())
  data=file.read_bytes();digest=hashlib.sha256(data).hexdigest()
  if expected and expected.get(name)!=digest:raise ValueError(f'Prüfsumme stimmt nicht: {name}')
  new[name]=digest
  im=np.asarray(Image.open(io.BytesIO(data)).convert('RGB'))
  if im.shape!=(tile_size,tile_size,3):raise ValueError(f'Unerwartete Kachelgröße: {name}')
  mosaic[:,(ty-ymin)*tile_size:(ty-ymin+1)*tile_size,(tx-xmin)*tile_size:(tx-xmin+1)*tile_size]=im.transpose(2,0,1)
if expected and set(expected)!=set(new):raise ValueError('Kachelliste stimmt nicht')
if not expected:manifest_path.write_text(json.dumps(new,sort_keys=True,indent=2)+'\n')
resolution=2*half/(2**zoom*tile_size)
source_transform=from_origin(-half+xmin*tile_size*resolution,half-ymin*tile_size*resolution,resolution,resolution)
dest=np.zeros((3,size,size),dtype=np.uint8)
for band in range(3):reproject(mosaic[band],dest[band],src_transform=source_transform,src_crs='EPSG:3857',dst_transform=from_origin(x0,top,1,1),dst_crs='EPSG:31256',resampling=Resampling.bilinear)
if np.all(dest==0,axis=0).any():raise ValueError('Schwarze Lücke im Orthofoto')
image=Image.fromarray(dest.transpose(1,2,0),'RGB').convert('RGBA'); draw=ImageDraw.Draw(image,'RGBA')
for road in scenario['roads']:
 if len(road['points'])>=2:draw.line([tuple(p) for p in road['points']],fill=(255,230,50,200),width=2)
for water in scenario['water']:
 for polygon in water['polygons']:
  for ring in [polygon['outer'],*polygon['holes']]:draw.line([tuple(p) for p in ring],fill=(0,220,255,255),width=2)
for building in scenario['buildings']:
 for ring in [building['polygon']['outer'],*building['polygon']['holes']]:draw.line([tuple(p) for p in ring],fill=(255,65,45,255),width=2)
image.convert('RGB').save(root/'docs/orthofoto-kontrolle.jpg',quality=90)
for line in scenario['breaklines']:
 draw.line([tuple(p[:2]) for p in line['points']],fill=(30,255,90,220) if line['type']==1 else (255,30,235,220),width=1)
image.convert('RGB').save(root/'docs/bruchkanten-kontrolle.jpg',quality=90)
print('Kacheln:',len(new),'Ausgaben: docs/orthofoto-kontrolle.jpg, docs/bruchkanten-kontrolle.jpg')
