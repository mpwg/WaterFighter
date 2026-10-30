#!/usr/bin/env python3
"""Transform the verified 1.4 package into the 1.5 roof-corrected candidate.

The full source pipeline remains the authoritative independent rebuild.
"""
import hashlib
import json
import sys
from pathlib import Path

if len(sys.argv) != 3:
    raise SystemExit('Aufruf: python3 tools/migrate-roof-scenario.py <1.4.json> <1.5.json>')
source, target = map(Path, sys.argv[1:])
if source.resolve() == target.resolve():
    raise SystemExit('Eingabe und Ausgabe müssen verschieden sein.')
data = source.read_bytes()
if hashlib.sha256(data).hexdigest() != 'bf7f274f8899ac3fa0332e2df2936423d06795a0bb193d4e7328aa0925512470':
    raise SystemExit('Das 1.4-Paket hat nicht die erwartete Prüfsumme.')
adjustment = json.loads((Path(__file__).resolve().parent.parent / 'tests/fixtures/scenario-adjustments-1.5.json').read_text(encoding='utf-8'))
scenario = json.loads(data)
roofs = set(adjustment['excludedRoofBuildings'])
if scenario['version'] != '1.4-draft' or adjustment['version'] != '1.5-draft' or len(roofs) != len(adjustment['excludedRoofBuildings']):
    raise SystemExit('Szenarioversion oder Dachliste stimmt nicht.')
found = {b['id'] for b in scenario['buildings'] if b['id'] in roofs}
if found != roofs:
    raise SystemExit(f'Erwartete Dachflächen fehlen: {sorted(roofs-found)}')
scenario['version'] = adjustment['version']
scenario['buildings'] = [b for b in scenario['buildings'] if b['id'] not in roofs]
scenario['adjustments'].append(adjustment['roofNote'])
target.write_text(json.dumps(scenario, ensure_ascii=False, separators=(',', ':'), allow_nan=False)+'\n', encoding='utf-8')
print(f'{target}: SHA-256 {hashlib.sha256(target.read_bytes()).hexdigest()}')
