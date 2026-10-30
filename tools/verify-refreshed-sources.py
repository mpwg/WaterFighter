#!/usr/bin/env python3
"""Rebuild in isolation from refreshed sources and compare, without changing provenance."""
import ast
import hashlib
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

root = Path(__file__).resolve().parent.parent
raw = Path(sys.argv[1]).resolve() if len(sys.argv) == 2 else None
if raw is None or not raw.is_dir():
    raise SystemExit('Aufruf: python3 tools/verify-refreshed-sources.py <Rohdatenverzeichnis>')
source = (root / 'tools/build-scenario.py').read_text(encoding='utf-8')
module = ast.parse(source)
assign = next(n for n in module.body if isinstance(n, ast.Assign) and any(isinstance(t, ast.Name) and t.id == 'SOURCES' for t in n.targets))
expected = ast.literal_eval(assign.value)
actual = {}
for name, digest in expected.items():
    path = raw / name
    actual[name] = hashlib.sha256(path.read_bytes()).hexdigest()
    # The geodata source itself must match exactly; OSM snapshots are compared
    # by rebuilding, not silently accepted as the historical byte stream.
    if name.endswith('.zip') and actual[name] != digest:
        raise SystemExit(f'Wiener Rohdaten weichen ab: {name}')
    old = f"{name!r}: {digest!r}"
    if source.count(old) != 1:
        raise SystemExit(f'Quellenmanifest nicht eindeutig: {name}')
    source = source.replace(old, f"{name!r}: {actual[name]!r}")

with tempfile.TemporaryDirectory(prefix='waterfighter-geo-verify-') as temporary:
    work = Path(temporary)
    shutil.copytree(root / 'tools', work / 'tools', ignore=shutil.ignore_patterns('__pycache__'))
    (work / 'tools/build-scenario.py').write_text(source, encoding='utf-8')
    (work / 'raw-data').symlink_to(raw, target_is_directory=True)
    subprocess.run([sys.executable, 'tools/build-scenario.py'], cwd=work, check=True)
    built = json.loads((work / 'public/scenarios/brigittenau-v1.json').read_bytes())
    delivered_bytes = (root / 'public/scenarios/brigittenau-v1.json').read_bytes()
    delivered = json.loads(delivered_bytes)
    if built['sources']['sha256'] != actual:
        raise SystemExit('Neuaufbau enthält nicht die gemessenen Quell-Hashes.')
    built['sources']['sha256'] = delivered['sources']['sha256']
    normalized = (json.dumps(built, ensure_ascii=False, separators=(',', ':'), allow_nan=False)+'\n').encode()
    if normalized != delivered_bytes:
        raise SystemExit('Neuaufbau unterscheidet sich über die Quell-Hashes hinaus vom gelieferten Paket.')
    print(json.dumps({'normalizedSha256': hashlib.sha256(normalized).hexdigest(),
                      'refreshedSources': actual,
                      'differentSourceHashes': [name for name in expected if expected[name] != actual[name]]}, ensure_ascii=False, indent=2))
