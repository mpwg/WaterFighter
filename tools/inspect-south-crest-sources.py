"""Trace five southern trench faces back to contributing scenario breaklines."""
import json
from pathlib import Path
from breakline_faces import derive_faces

s = json.loads(Path('public/scenarios/brigittenau-v1.json').read_text())
wanted = {('x', 6266), ('x', 6664), ('x', 8054), ('y', 5643), ('y', 6434)}
delivered = {(f['axis'], f['index']): f['crest'] for f in s['surveyCrests'] if (f['axis'], f['index']) in wanted}
if set(delivered) != wanted:
    raise ValueError('Referenzkanten fehlen')
rows = {key: [] for key in wanted}
for index, line in enumerate(s['breaklines']):
    if line['type'] != 1:
        continue
    for face in derive_faces({**s, 'breaklines': [line]}):
        key = face['axis'], face['index']
        if key in wanted:
            rows[key].append({'breaklineIndex': index, 'type': line['type'], 'crest': face['crest'], 'points': line['points']})
for key, value in delivered.items():
    if not rows[key] or max(item['crest'] for item in rows[key]) != value:
        raise ValueError(f'Kante nicht aus Bruchlinien reproduziert: {key}')
print(json.dumps({'scenario': s['version'], 'faces': [{'axis': a, 'index': i, 'crest': delivered[a, i], 'contributors': rows[a, i]} for a, i in sorted(wanted)]}, ensure_ascii=False, indent=2))
