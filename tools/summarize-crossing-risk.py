"""Combine the ordered geometry and flood screenings without implying real-world risk."""
import json
import sys
from pathlib import Path

if len(sys.argv)!=3:
    raise SystemExit('Aufruf: python tools/summarize-crossing-risk.py KREUZUNGEN.json FLUT.json')
geometry=json.loads(Path(sys.argv[1]).read_text())
flood=json.loads(Path(sys.argv[2]).read_text())
if geometry['version']!=flood['scenario'] or len(geometry['crossings'])!=len(flood['crossings']):
    raise ValueError('Szenarioversion oder Anzahl stimmt nicht')
rows=[]
for geo,wet in zip(geometry['crossings'],flood['crossings']):
    if any(geo[k]!=wet[k] for k in ('id','bridge','tunnel')):
        raise ValueError('Reihenfolge oder Kreuzungsattribute stimmen nicht')
    if wet['wetCells'] and geo['crestFacesWithin4m']:
        rows.append({'id':geo['id'],'bridge':geo['bridge'],'tunnel':geo['tunnel'],
                     'crestFacesWithin4m':geo['crestFacesWithin4m'],
                     'crestFacesIntersecting':geo['crestFacesIntersecting'],
                     'buildingOverlaps':geo['buildingOverlaps'],
                     'wetCells':wet['wetCells'],'maxDepth':wet['maxDepth'],
                     'firstWetSeconds':wet['firstWetSeconds']})
print(json.dumps({'scenario':flood['scenario'],'wetNearCrest':len(rows),
                  'wetIntersectingCrest':sum(row['crestFacesIntersecting']>0 for row in rows),
                  'crossings':rows},indent=2))
