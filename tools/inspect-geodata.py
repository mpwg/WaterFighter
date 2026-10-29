#!/usr/bin/env python3
"""Vorläufige Datenprüfung für Brigittenau; erzeugt kein fertiges Szenario."""
import json
import xml.etree.ElementTree as ET
from collections import Counter
from pathlib import Path

import numpy as np
import rasterio
from pyproj import Transformer
from rasterio.enums import Resampling
from rasterio.transform import from_origin
from rasterio.warp import reproject
from shapely.geometry import Polygon, LineString, box

X, Y, SIZE, CELL = 3900, 344150, 800, 4
extent = box(X, Y, X + SIZE, Y + SIZE)
transformer = Transformer.from_crs(4326, 31256, always_xy=True)
root = ET.parse('raw-data/brigittenau.osm').getroot()
nodes = {n.attrib['id']: transformer.transform(float(n.attrib['lon']), float(n.attrib['lat'])) for n in root.findall('node')}
counts = Counter()
objects = []
for way in root.findall('way'):
    tags = {t.attrib['k']: t.attrib['v'] for t in way.findall('tag')}
    kind = 'building' if 'building' in tags else 'road' if 'highway' in tags else 'water' if tags.get('natural') == 'water' or 'waterway' in tags else None
    if not kind:
        continue
    refs = [n.attrib['ref'] for n in way.findall('nd')]
    if len(refs) < 2 or any(ref not in nodes for ref in refs):
        counts['unvollständige Wege'] += 1
        continue
    points = [nodes[ref] for ref in refs]
    if kind == 'building':
        if len(points) < 4 or refs[0] != refs[-1]:
            counts['offene Gebäudewege'] += 1
            continue
        geometry = Polygon(points)
        if not geometry.is_valid:
            counts['ungültige Gebäude'] += 1
            continue
    else:
        geometry = LineString(points)
    if geometry.intersects(extent):
        counts[kind] += 1
        objects.append({'id': way.attrib['id'], 'kind': kind, 'coordinates': [[round(x-X, 2), round(y-Y, 2)] for x,y in points], 'tags': tags})
with rasterio.open('raw-data/35_2/35_2_dgm.tif') as source:
    terrain = np.full((SIZE//CELL, SIZE//CELL), np.nan, dtype='float32')
    reproject(source=rasterio.band(source, 1), destination=terrain, src_transform=source.transform, src_crs=source.crs, dst_transform=from_origin(X, Y+SIZE, CELL, CELL), dst_crs=source.crs, dst_nodata=np.nan, resampling=Resampling.average)
    if not np.isfinite(terrain).all():
        raise ValueError('Nicht endliche Rasterwerte; Datenlücke oder ungültige Höhen')
    report = {'bounds_epsg31256': [X,Y,X+SIZE,Y+SIZE], 'cell_m': CELL, 'height_reference': 'Wiener Null (EPSG:8881)', 'height_min': float(terrain.min()), 'height_max': float(terrain.max()), 'counts': dict(counts), 'objects': objects, 'terrain': np.round(terrain,3).tolist()}
Path('/tmp/waterfighter-geodata-inspection.json').write_text(json.dumps(report, ensure_ascii=False, separators=(',',':'))+'\n')
print(json.dumps({k:v for k,v in report.items() if k not in ('objects','terrain')}, ensure_ascii=False, indent=2))
