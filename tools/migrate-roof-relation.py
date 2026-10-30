#!/usr/bin/env python3
"""Migrate the verified 1.5 package to 1.6; full pipeline remains authoritative."""
import hashlib
import json
import sys
from pathlib import Path
if len(sys.argv) != 3:
    raise SystemExit('Aufruf: python3 tools/migrate-roof-relation.py <1.5.json> <1.6.json>')
source, target = map(Path, sys.argv[1:])
if source.resolve() == target.resolve():
    raise SystemExit('Eingabe und Ausgabe müssen verschieden sein.')
data = source.read_bytes()
if hashlib.sha256(data).hexdigest() != 'f27c6082e7dee7444d20439bd94f14203abe04de412dde2ebedb9cfde7cebdd0':
    raise SystemExit('Das 1.5-Paket hat nicht die erwartete Prüfsumme.')
root = Path(__file__).resolve().parent.parent
old = json.loads((root / 'tests/fixtures/scenario-adjustments-1.5.json').read_text())
new = json.loads((root / 'tools/scenario-adjustments.json').read_text())
s = json.loads(data)
if s['version'] != old['version'] or new['version'] != '1.6-draft' or set(new['excludedRoofBuildings']) != set(old['excludedRoofBuildings']) | {'r4257449-0'}:
    raise SystemExit('Szenarioversion oder Dachliste stimmt nicht.')
if sum(b['id'] == 'r4257449-0' for b in s['buildings']) != 1 or s['adjustments'].count(old['roofNote']) != 1:
    raise SystemExit('Dachrelation oder bisheriger Anpassungshinweis fehlt.')
s['version'] = new['version']
s['buildings'] = [b for b in s['buildings'] if b['id'] != 'r4257449-0']
s['adjustments'] = [new['roofNote'] if x == old['roofNote'] else x for x in s['adjustments']]
target.write_text(json.dumps(s, ensure_ascii=False, separators=(',', ':'), allow_nan=False)+'\n', encoding='utf-8')
print(f'{target}: SHA-256 {hashlib.sha256(target.read_bytes()).hexdigest()}')
