#!/usr/bin/env python3
"""Zählt aus DGM-Bruchlinien abgeleitete Kanten, ohne das Szenario zu ändern."""
import json
from pathlib import Path
from breakline_faces import derive_faces
s=json.loads(Path('public/scenarios/brigittenau-v1.json').read_text())
faces=derive_faces(s)
print(json.dumps({'breaklines':sum(x['type']==1 for x in s['breaklines']),'candidateFaces':len(faces),'maxCrestM':max((x['crest'] for x in faces),default=0)},ensure_ascii=False,indent=2))
