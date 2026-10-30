"""Create a verified local archive of the exact scenario inputs outside Git."""
import argparse
import gzip
import hashlib
import io
import json
import tarfile
from pathlib import Path

root = Path(__file__).resolve().parent.parent
scenario = json.loads((root / 'public/scenarios/brigittenau-v1.json').read_text())
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('output', type=Path, help='New .tar.gz file outside the repository')
parser.add_argument('--refreshed-manifest', type=Path, help='Manifest of independently fetched sources; does not replace historical provenance')
args = parser.parse_args()
output = args.output.resolve()
if output.is_relative_to(root) and not output.is_relative_to(root / 'raw-data'):
    parser.error('Ausgabe muss außerhalb des Repositories oder unter raw-data/ liegen')
historical = scenario['sources']['sha256']
sources = historical
provenance = 'historical'
if args.refreshed_manifest:
    refreshed = json.loads(args.refreshed_manifest.read_text())
    sources = refreshed['files']
    if not isinstance(sources, dict) or set(sources) != set(historical):
        raise ValueError('Erneutes Quellenmanifest hat eine andere Dateiliste')
    if any(sources[name] != historical[name] for name in sources if name.endswith('.zip')):
        raise ValueError('Wiener Rohdaten weichen von den historischen Hashes ab')
    provenance = 'refreshed'
files = []
for name, expected in sorted(sources.items()):
    path = (root / 'raw-data' / name).resolve()
    if not path.is_relative_to(root / 'raw-data') or not path.is_file():
        raise ValueError(f'Ungültige Quelldatei: {name}')
    data = path.read_bytes()
    if hashlib.sha256(data).hexdigest() != expected:
        raise ValueError(f'Prüfsumme stimmt nicht: {name}')
    files.append((name, data))
manifest = json.dumps({'scenario': scenario['version'], 'provenance': provenance, 'sha256': sources}, sort_keys=True, indent=2).encode() + b'\n'
with output.open('xb') as raw, gzip.GzipFile(fileobj=raw, mode='wb', filename='', mtime=0) as compressed:
    with tarfile.open(fileobj=compressed, mode='w') as tar:
        for name, data in [('MANIFEST.json', manifest), *[(f'raw-data/{n}', d) for n, d in files]]:
            info = tarfile.TarInfo(name)
            info.size = len(data)
            info.mode = 0o644
            info.mtime = 0
            tar.addfile(info, io.BytesIO(data))
print(f'{output}: {len(files)} geprüfte Quelldateien, SHA-256 {hashlib.sha256(output.read_bytes()).hexdigest()}')
