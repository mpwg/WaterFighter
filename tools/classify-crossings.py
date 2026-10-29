"""Classify mapped crossing segments using the checksummed original OSM ways."""
import hashlib
import json
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

if len(sys.argv)!=3:
    raise SystemExit('Aufruf: python tools/classify-crossings.py KREUZUNGEN.json FLUT.json')
scenario=json.loads(Path('public/scenarios/brigittenau-v1.json').read_text())
geometry=json.loads(Path(sys.argv[1]).read_text());flood=json.loads(Path(sys.argv[2]).read_text())
if geometry['version']!=scenario['version'] or flood['scenario']!=scenario['version'] or len(geometry['crossings'])!=len(flood['crossings']):
    raise ValueError('Szenarioversion oder Anzahl stimmt nicht')
raw=Path('raw-data/brigittenau.osm').read_bytes()
if hashlib.sha256(raw).hexdigest()!=scenario['sources']['sha256']['brigittenau.osm']:
    raise ValueError('OSM-Rohdaten-Prüfsumme stimmt nicht')
root=ET.fromstring(raw);ways={way.get('id'):way for way in root.findall('way')}
rows=[]
for geo,wet in zip(geometry['crossings'],flood['crossings']):
    if any(geo[k]!=wet[k] for k in ('id','bridge','tunnel')):raise ValueError('Kreuzungen stimmen nicht überein')
    way=ways.get(geo['id'])
    if way is None:raise ValueError(f'OSM-Weg fehlt: {geo["id"]}')
    refs=[n.get('ref') for n in way.findall('nd')]; tags={t.get('k'):t.get('v') for t in way.findall('tag')}
    closed=len(refs)>=4 and refs[0]==refs[-1]
    kind='bridge-outline' if closed and tags.get('man_made')=='bridge' else 'other-closed' if closed else 'open-way'
    rows.append({'id':geo['id'],'kind':kind,'name':tags.get('name') or tags.get('bridge:name') or tags.get('official_name'),
                 'layer':tags.get('layer'),'crossesCrest':geo['crestFacesIntersecting']>0,'wetCells':wet['wetCells'],
                 'intersectingCrests':geo['intersectingCrests']})
print(json.dumps({'scenario':scenario['version'],'crossings':rows},indent=2))
