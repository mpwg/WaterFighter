"""Compare two raster-face crossings with their local source breakline geometry."""
import json
from pathlib import Path
from shapely.geometry import LineString
from breakline_faces import derive_faces

s = json.loads(Path('public/scenarios/brigittenau-v1.json').read_text())
if s['version'] != '1.6-draft':
    raise ValueError('Szenarioversion stimmt nicht')
w, c = s['grid']['width'], s['grid']['cellSize']
rows = []
for axis, index, source, road in [('x', 8054, 54, '40953689'), ('y', 5643, 35, '38991609')]:
    y, x = divmod(index, w + 1 if axis == 'x' else w)
    face = LineString([(x*c, y*c), (x*c, (y+1)*c)] if axis == 'x' else [(x*c, y*c), ((x+1)*c, y*c)])
    source_line = s['breaklines'][source]
    if source_line['type'] != 1 or not any(f['axis'] == axis and f['index'] == index for f in derive_faces({**s, 'breaklines': [source_line]})):
        raise ValueError('Bruchlinie erzeugt die erwartete Kante nicht')
    original = LineString([p[:2] for p in source_line['points']])
    local = original.intersection(face.buffer(8))
    ways = [r for r in s['roads'] if r['id'] == road]
    if local.is_empty or len(ways) != 1:
        raise ValueError('Lokale Bruchlinie oder Weg nicht eindeutig')
    way = LineString(ways[0]['points'])
    rows.append({'axis': axis, 'index': index, 'breaklineIndex': source, 'road': road, 'roadKind': ways[0]['kind'],
                 'radiusM': 8, 'faceIntersectsRoad': face.intersects(way), 'breaklineIntersectsRoad': local.intersects(way),
                 'breaklineDistanceM': round(local.distance(way), 3), 'localBreaklineLengthM': round(local.length, 3)})
print(json.dumps({'scenario': s['version'], 'comparisons': rows}, ensure_ascii=False, indent=2))
