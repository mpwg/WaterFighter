"""Locate OSM crossings that overlap modeled buildings or survey-crest faces.

Geometry is a screening aid, not evidence of hydraulic connectivity or capacity.
"""
import json
from collections import Counter
from pathlib import Path

from shapely.geometry import LineString, Polygon
from shapely.strtree import STRtree

s = json.loads(Path('public/scenarios/brigittenau-v1.json').read_text())
size = s['grid']['cellSize']
w = s['grid']['width']
buildings = [Polygon(b['polygon']['outer'], b['polygon']['holes']) for b in s['buildings']]
tree = STRtree(buildings)
faces = []
for f in s['surveyCrests']:
    if f['axis'] == 'x':
        y, x = divmod(f['index'], w + 1)
        points = [(x * size, y * size), (x * size, (y + 1) * size)]
    else:
        y, x = divmod(f['index'], w)
        points = [(x * size, y * size), ((x + 1) * size, y * size)]
    faces.append(LineString(points))
face_tree = STRtree(faces)
rows = []
for crossing in s['crossings']:
    line = LineString(crossing['points'])
    overlap = [(s['buildings'][int(i)]['id'], round(line.intersection(buildings[int(i)]).length, 2))
               for i in tree.query(line, predicate='intersects')]
    overlap = [(bid, length) for bid, length in overlap if length > 0.05]
    close = face_tree.query(line.buffer(size), predicate='intersects')
    intersecting = [int(i) for i in close if line.intersects(faces[int(i)])]
    rows.append({'id': crossing['id'], 'bridge': crossing['bridge'], 'tunnel': crossing['tunnel'],
                 'buildingOverlaps': sorted(overlap), 'crestFacesWithin4m': len(close),
                 'crestFacesIntersecting': len(intersecting),
                 'intersectingCrests': [s['surveyCrests'][i] for i in intersecting]})
print(json.dumps({'version': s['version'], 'count': len(rows),
                  'types': dict(Counter((r['tunnel'] or 'bridge:' + str(r['bridge'])) for r in rows)),
                  'withBuildingOverlap': sum(bool(r['buildingOverlaps']) for r in rows),
                  'nearCrest': sum(r['crestFacesWithin4m'] > 0 for r in rows), 'crossings': rows}, indent=2))
