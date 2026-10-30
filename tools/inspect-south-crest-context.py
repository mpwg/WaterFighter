"""Describe nearby scenario geometry for the five southern trench crest faces."""
import json
from pathlib import Path
from shapely.geometry import LineString, Polygon

s = json.loads(Path('public/scenarios/brigittenau-v1.json').read_text())
if s['version'] != '1.6-draft':
    raise ValueError('Szenarioversion stimmt nicht')
w, c = s['grid']['width'], s['grid']['cellSize']
target = {('x', 6266), ('x', 6664), ('x', 8054), ('y', 5643), ('y', 6434)}
faces = [f for f in s['surveyCrests'] if (f['axis'], f['index']) in target]
if len(faces) != len(target):
    raise ValueError('Referenzkanten fehlen oder sind doppelt')
layers = {
    'roads': [(r['id'], r['kind'], LineString(r['points'])) for r in s['roads']],
    'crossings': [(r['id'], {'bridge': r['bridge'], 'tunnel': r['tunnel']}, LineString(r['points'])) for r in s['crossings']],
    'buildings': [(b['id'], None, Polygon(b['polygon']['outer'], b['polygon']['holes'])) for b in s['buildings']],
}
rows = []
for f in faces:
    if f['axis'] == 'x':
        y, x = divmod(f['index'], w + 1)
        points = [[x*c, y*c], [x*c, (y+1)*c]]
    else:
        y, x = divmod(f['index'], w)
        points = [[x*c, y*c], [(x+1)*c, y*c]]
    line = LineString(points)
    nearby = {}
    for name, shapes in layers.items():
        matches = [{'id': identifier, 'kind': kind, 'distanceM': round(line.distance(shape), 3)}
                   for identifier, kind, shape in shapes if line.distance(shape) <= 8]
        nearby[name] = sorted(matches, key=lambda item: (item['distanceM'], item['id']))
    rows.append({**f, 'localPointsM': points, 'nearbyWithin8M': nearby})
print(json.dumps({'scenario': s['version'], 'radiusM': 8, 'faces': rows}, ensure_ascii=False, indent=2))
