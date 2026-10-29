#!/usr/bin/env python3
"""Prüft OSM-Gewässerrelationen und erzeugt eine lokale Kontrollgrafik."""
import json
import xml.etree.ElementTree as ET
from pathlib import Path
from html import escape
from pyproj import Transformer
from shapely.geometry import LineString, box
from shapely.ops import polygonize, unary_union

X, Y, SIZE = 3900, 344150, 800
extent = box(X, Y, X+SIZE, Y+SIZE)
t = Transformer.from_crs(4326,31256,always_xy=True)
polygons = []
for filename, ident in [('raw-data/donau-relation.osm','32484'), ('raw-data/neue-donau-relation.osm','18444')]:
    root = ET.parse(filename).getroot()
    nodes = {n.get('id'): t.transform(float(n.get('lon')),float(n.get('lat'))) for n in root.findall('node')}
    ways = {w.get('id'): [nodes[n.get('ref')] for n in w.findall('nd')] for w in root.findall('way')}
    relation = next(r for r in root.findall('relation') if r.get('id') == ident)
    rings = {}
    for role in ('outer','inner'):
        lines = [LineString(ways[m.get('ref')]) for m in relation.findall('member') if m.get('type') == 'way' and m.get('role') == role]
        rings[role] = list(polygonize(unary_union(lines)))
    if not rings['outer']:
        raise ValueError(f'Keine geschlossenen Außenringe für Relation {ident}')
    water = unary_union(rings['outer']).difference(unary_union(rings['inner'])).intersection(extent)
    if not water.is_valid:
        raise ValueError(f'Ungültige Geometrie für Relation {ident}')
    polygons.append((ident,water))
    print(ident, 'Außenringe',len(rings['outer']),'Innenringe',len(rings['inner']),'Fläche im Ausschnitt m²',round(water.area))
data=json.loads(Path('/tmp/waterfighter-geodata-inspection.json').read_text())
svg=['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">']
for row, cells in enumerate(data['terrain']):
    for col, h in enumerate(cells):
        shade = max(80,min(230,round(80+(h-data['height_min'])/(data['height_max']-data['height_min'])*150)))
        svg.append(f'<rect x="{col*4}" y="{row*4}" width="4" height="4" fill="rgb({shade},{shade},{shade})"/>')
def path_coords(coords):
    return ' '.join(f'{x-X:.1f},{SIZE-(y-Y):.1f}' for x,y in coords)
for _, water in polygons:
    parts = list(water.geoms) if hasattr(water,'geoms') else [water]
    for part in parts:
        if part.is_empty or part.geom_type != 'Polygon': continue
        rings = [part.exterior, *part.interiors]
        path = ' '.join('M '+path_coords(r.coords).replace(' ', ' L ')+' Z' for r in rings)
        svg.append(f'<path d="{path}" fill="#50a4db" fill-opacity=".65" fill-rule="evenodd"/>')
for o in data['objects']:
    if o['kind'] not in ('building','road'): continue
    points=' '.join(f'{x},{SIZE-y}' for x,y in o['coordinates'])
    if o['kind']=='building':svg.append(f'<polygon points="{escape(points)}" fill="#ed7752" stroke="#5a2414" stroke-width="1"/>')
    else:svg.append(f'<polyline points="{escape(points)}" fill="none" stroke="#ffdb61" stroke-width="1"/>')
svg.append('</svg>')
Path('/tmp/waterfighter-geodata.svg').write_text('\n'.join(svg))
