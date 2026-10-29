#!/usr/bin/env python3
"""Reproduzierbare Aufbereitung des Wiener Szenarios (Rohdaten siehe Dokumentation)."""
import hashlib
import json
import io
import zipfile
import math
import xml.etree.ElementTree as ET
from pathlib import Path

import numpy as np
import rasterio
import shapefile
from pyproj import Transformer, CRS
from rasterio.enums import Resampling
from rasterio.features import rasterize
from rasterio.transform import from_origin
from rasterio.warp import reproject
from shapely.geometry import Polygon, LineString, box, mapping
from shapely.ops import polygonize, unary_union
from breakline_faces import derive_faces

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / 'raw-data'
OUT = ROOT / 'public/scenarios/brigittenau-v1.json'
X, Y, SIZE, CELL = 3900, 344150, 800, 4
N = SIZE // CELL
EXTENT = box(X, Y, X + SIZE, Y + SIZE)
TRANSFORM = from_origin(X, Y + SIZE, CELL, CELL)
PROJECT = Transformer.from_crs(4326, 31256, always_xy=True)
SOURCES = {
    '35_2_dgm_bk.zip': 'f5abb28d8a6d93ee99ae2f0934639ad5e5e1358b2985081aa3c9a9ca771aa7db',
    '35_2_dgm_tif.zip': 'e8808f973a48223240e2c8863223ee4e2e85b988426c44fadd5f0b0cb95aa638',
    'brigittenau.osm': '954e0ac7985cc586ca5bdcb3eb912b3a1e7c75d0bbffe188b2e0bcdb9ceff9fd',
    'donau-relation.osm': 'ea5984cc48996b5455208f16aae808b72928ef03d4f88fe6fb9646a230485b88',
    'neue-donau-relation.osm': 'f68a06ba1ea23689703972b6ef48c1afc7511725cb918950ca9a1a9ff2afe682',
    'building-relations/105223.osm': '0efc2b3c68d1597945927eaa933993472c000d800d594b0bb6dfc1c6f98b3ebf',
    'building-relations/1527647.osm': '4964b66138ee0bb2d2244f3698efd415dea733caaef74fd5c68e3b64e751b689',
    'building-relations/1527705.osm': 'a6a8623de0130ce9037f437b11c9c3763bd57d8cd3f245b63fc34ee47902ccb0',
    'building-relations/1536148.osm': '1a2ab5e81727e15606d5f1dca5d19efd4ea395f1d70fccf3e254e34a470d9704',
    'building-relations/1536152.osm': 'a0a4e19e1e9c91d17d24d6c2c379143f7bce7074ca3441ab137f3da35898a99a',
    'building-relations/1577738.osm': 'd1f3eb7cb275f6c5b99ccbdcaeccbb7afe7012730897b6752ddeda3e2e7b437f',
}
for name, expected in SOURCES.items():
    actual = hashlib.sha256((RAW / name).read_bytes()).hexdigest()
    if actual != expected:
        raise ValueError(f'Prüfsumme von {name} stimmt nicht: {actual}')

def check_m34(wkt):
    # The legacy WKT has incomplete authority metadata; low-confidence EPSG
    # guesses can even identify an unrelated CRS. Check its actual parameters.
    crs=CRS.from_wkt(wkt)
    op=crs.coordinate_operation
    expected={'Latitude of natural origin':0, 'Longitude of natural origin':16+1/3, 'Scale factor at natural origin':1, 'False easting':0, 'False northing':-5000000}
    params={p.name:p.value for p in op.params} if op else {}
    if not op or op.method_name != 'Transverse Mercator' or any(k not in params or abs(params[k]-v)>1e-6 for k,v in expected.items()) or abs(crs.ellipsoid.semi_major_metre-6377397.155)>0.001 or abs(crs.ellipsoid.inverse_flattening-299.1528128)>0.00001:
        raise ValueError('Quell-Koordinatensystem stimmt nicht mit Wiener GK M34 überein')

# Direkt aus dem überprüften ZIP lesen, damit eine abweichende entpackte Datei nicht unbemerkt einfließt.
terrain = np.full((N, N), np.nan, dtype=np.float32)
with rasterio.open(f'zip://{RAW / "35_2_dgm_tif.zip"}!35_2_dgm.tif') as src:
    check_m34(src.crs.to_wkt())
    if not (src.bounds.left <= X and src.bounds.bottom <= Y and src.bounds.right >= X+SIZE and src.bounds.top >= Y+SIZE):
        raise ValueError('DGM-Koordinatensystem oder Abdeckung stimmt nicht')
    source_data = src.read(1, masked=True)
    if np.ma.getmaskarray(source_data).any() or not np.isfinite(source_data).all():
        raise ValueError('DGM enthält NoData oder nicht endliche Werte')
    reproject(source=source_data.filled(np.nan), destination=terrain, src_transform=src.transform, src_crs=src.crs,
              dst_transform=TRANSFORM, dst_crs=src.crs, src_nodata=np.nan, dst_nodata=np.nan, resampling=Resampling.average)
if not np.isfinite(terrain).all():
    raise ValueError('Datenlücke im Szenarioraster')

def parse_osm(path):
    root = ET.parse(path).getroot()
    nodes = {n.attrib['id']: PROJECT.transform(float(n.attrib['lon']), float(n.attrib['lat'])) for n in root.findall('node')}
    ways = {w.attrib['id']: w for w in root.findall('way')}
    return root, nodes, ways

def points_for(way, nodes):
    refs = [n.attrib['ref'] for n in way.findall('nd')]
    if any(ref not in nodes for ref in refs):
        raise ValueError(f'Unvollständiger OSM-Weg {way.attrib["id"]}')
    return refs, [nodes[ref] for ref in refs]

def local_ring(ring):
    return [[round(x-X, 2), round(Y+SIZE-y, 2)] for x,y in ring.coords]

def polygon_parts(geometry):
    if geometry.is_empty: return []
    if geometry.geom_type == 'Polygon': return [geometry]
    if hasattr(geometry, 'geoms'):
        return [part for g in geometry.geoms for part in polygon_parts(g)]
    return []

def local_polygon(poly):
    return {'outer': local_ring(poly.exterior), 'holes': [local_ring(r) for r in poly.interiors]}

water_geometries = []
for filename, relation_id in [('donau-relation.osm','32484'), ('neue-donau-relation.osm','18444')]:
    root, nodes, ways = parse_osm(RAW / filename)
    relation = next(r for r in root.findall('relation') if r.attrib['id'] == relation_id)
    rings = {}
    for role in ('outer','inner'):
        members = [m for m in relation.findall('member') if m.attrib.get('role') == role]
        if any(m.attrib.get('type') != 'way' or m.attrib.get('ref') not in ways for m in members):
            raise ValueError(f'Unvollständige Multipolygon-Relation {relation_id}')
        lines = [LineString(points_for(ways[m.attrib['ref']],nodes)[1]) for m in members]
        rings[role] = list(polygonize(unary_union(lines)))
        # Jede Kante muss Teil eines geschlossenen Rings sein.
        if lines and not unary_union(lines).difference(unary_union([p.boundary for p in rings[role]])).is_empty:
            raise ValueError(f'Offene Ringe in Relation {relation_id}, Rolle {role}')
    if not rings['outer']:
        raise ValueError(f'Kein Außenring in Relation {relation_id}')
    geom = unary_union(rings['outer']).difference(unary_union(rings['inner'])).intersection(EXTENT)
    if not geom.is_valid: raise ValueError(f'Ungültige Relation {relation_id}')
    water_geometries.append((relation_id,geom))

root, nodes, ways = parse_osm(RAW / 'brigittenau.osm')
# Fehlende Mitglieder aus eigenständig bezogenen vollständigen Relationen ergänzen.
for name in sorted(n for n in SOURCES if n.startswith('building-relations/')):
    _, extra_nodes, extra_ways = parse_osm(RAW / name)
    nodes.update(extra_nodes); ways.update(extra_ways)
buildings, roads, barriers, crossings = [], [], [], []
def add_building(ident, geometry, tags):
    if not geometry.is_valid: raise ValueError(f'Ungültiges Gebäude {ident}')
    for index, part in enumerate(polygon_parts(geometry.intersection(EXTENT))):
        if part.area < 1: continue
        try:
            height = float(tags.get('height',''))
            if not math.isfinite(height) or height <= 0 or height > 150: raise ValueError()
            estimated = False
        except ValueError:
            height, estimated = 12, True
        buildings.append({'id': ident+'-'+str(index), 'polygon': local_polygon(part), 'area': round(part.area,2), 'height': height, 'heightEstimated': estimated})

members_of_buildings = set()
for relation in root.findall('relation'):
    tags = {tag.attrib['k']:tag.attrib['v'] for tag in relation.findall('tag')}
    if 'building' not in tags or tags.get('type') != 'multipolygon': continue
    members = [m for m in relation.findall('member') if m.attrib.get('role') in ('outer','inner')]
    if any(m.attrib.get('type') != 'way' or m.attrib.get('ref') not in ways for m in members):
        raise ValueError(f'Gebäuderelation {relation.attrib["id"]} unvollständig')
    rings = {}
    for role in ('outer','inner'):
        lines = [LineString(points_for(ways[m.attrib['ref']],nodes)[1]) for m in members if m.attrib['role'] == role]
        rings[role] = list(polygonize(unary_union(lines)))
        if lines and not unary_union(lines).difference(unary_union([p.boundary for p in rings[role]])).is_empty:
            raise ValueError(f'Offene Gebäuderinge {relation.attrib["id"]}')
    if not rings['outer']: raise ValueError(f'Gebäude ohne Außenring {relation.attrib["id"]}')
    geometry = unary_union(rings['outer']).difference(unary_union(rings['inner']))
    add_building('r'+relation.attrib['id'], geometry, tags)
    members_of_buildings.update(m.attrib['ref'] for m in members)

for way in ways.values():
    tags = {tag.attrib['k']: tag.attrib['v'] for tag in way.findall('tag')}
    if not any(k in tags for k in ('building','highway','barrier','embankment','bridge','tunnel')): continue
    refs, points = points_for(way, nodes)
    if 'building' in tags and way.attrib['id'] not in members_of_buildings:
        if len(points)<4 or refs[0]!=refs[-1]:
            raise ValueError(f'Offenes Gebäude {way.attrib["id"]}')
        add_building('w'+way.attrib['id'], Polygon(points), tags)
    if len(points)>1 and any(k in tags for k in ('highway','barrier','embankment','bridge','tunnel')):
        line=LineString(points).intersection(EXTENT)
        parts=list(line.geoms) if hasattr(line,'geoms') else [line]
        for part in parts:
            if part.geom_type == 'LineString' and part.length > 0:
                coordinates = local_ring(part)
                if 'highway' in tags:
                    roads.append({'id': way.attrib['id'], 'kind': tags['highway'], 'points': coordinates})
                if tags.get('barrier') in ('wall','retaining_wall','city_wall','flood_gate') or tags.get('embankment') == 'yes':
                    barriers.append({'id': way.attrib['id'], 'kind': tags.get('barrier', 'embankment'), 'points': coordinates})
                if 'bridge' in tags or 'tunnel' in tags:
                    crossings.append({'id': way.attrib['id'], 'bridge': tags.get('bridge'), 'tunnel': tags.get('tunnel'), 'points': coordinates})
buildings.sort(key=lambda b:b['id']); roads.sort(key=lambda r:(r['id'],r['points'])); barriers.sort(key=lambda r:(r['id'],r['points'])); crossings.sort(key=lambda r:(r['id'],r['points']))
# Keep 3D survey breaklines independently of the averaged elevation raster.
# Their attributes do not by themselves identify hydraulic barriers or culverts.
breaklines = []
with zipfile.ZipFile(RAW / '35_2_dgm_bk.zip') as archive:
    check_m34(archive.read('35_2_dgm_bk.prj').decode())
    def member(suffix): return io.BytesIO(archive.read('35_2_dgm_bk.'+suffix))
    reader=shapefile.Reader(shp=member('shp'),shx=member('shx'),dbf=member('dbf'))
    if reader.shapeType != shapefile.POLYLINEZ: raise ValueError('Unerwarteter Bruchkantentyp')
    for record in reader.iterShapeRecords():
        shape=record.shape
        if len(shape.z)!=len(shape.points) or not all(math.isfinite(z) for z in shape.z): raise ValueError('Ungültige Bruchkantenhöhe')
        parts=list(shape.parts)+[len(shape.points)]
        for a,b in zip(parts,parts[1:]):
            if b-a<2:continue
            line=LineString([(shape.points[i][0],shape.points[i][1],shape.z[i]) for i in range(a,b)]).intersection(EXTENT)
            segments=list(line.geoms) if hasattr(line,'geoms') else [line]
            for segment in segments:
                if segment.geom_type=='LineString' and segment.length>0:
                    coords=[[round(x-X,2),round(Y+SIZE-y,2),round(z,3)] for x,y,z in segment.coords]
                    breaklines.append({'type':int(record.record[0]),'points':coords})

water_mask = rasterize([(mapping(g), 1) for _,g in water_geometries if not g.is_empty], out_shape=(N,N), transform=TRANSFORM, fill=0, dtype='uint8')
# DGM liefert keine bathymetrische Aufnahme: synthetische Sohle und Anfangspegel
# sind explizit spielerische Annahmen, die bei der Kalibrierung geändert werden können.
adjustment = json.loads((ROOT / 'tools/scenario-adjustments.json').read_text(encoding='utf-8'))
water_level = 2.0
bed_depth = 2.0
bed = terrain.copy()
bed[water_mask == 1] = water_level-bed_depth
initial = np.where(water_mask == 1, bed_depth, 0).astype(np.float32)
scenario = {
 'id':'brigittenau', 'version':adjustment['version'], 'name':'Brigittenau an der Donau',
 'grid': {'width':N, 'height':N, 'cellSize':CELL, 'origin':[X,Y+SIZE], 'crs':'EPSG:31256', 'heightReference':'Wiener Null (EPSG:8881)', 'rowDirection':'south'},
 'terrain': np.round(terrain,3).ravel().tolist(), 'bed': np.round(bed,3).ravel().tolist(), 'initialDepth': initial.ravel().tolist(), 'waterMask':water_mask.ravel().tolist(),
 'buildings':buildings, 'roads':roads, 'barriers':barriers, 'crossings':crossings, 'breaklines':breaklines,
 'water': [{'id':ident, 'polygons':[local_polygon(p) for p in polygon_parts(g)]} for ident,g in water_geometries],
 'parameters': {'duration':300, 'budget':10000, 'damageTarget':50000, 'waterLevel':water_level, 'manning':0.025, 'damHeight':4.0, 'damCostPerCell':40, 'trenchDepth':0.8, 'trenchCostPerCell':25, 'buildingValuePerSquareMetre':10, 'demolitionCostFraction':0.1, 'damageDepth':1, 'damageDuration':120, 'inflowCells':[x for x in range(min(N, adjustment['inflowMaxColumnExclusive'])) if water_mask[0,x] == 1], 'inflowCurve':adjustment['inflowCurve'], 'outflowEdges':['bottom','right']},
 'adjustments': [adjustment['inflowNote'], 'Typ-1-Bruchlinien werden mit einer 0,15-m-Schwelle auf Zellkanten gerastert; ihre Höhen dienen näherungsweise als überströmbare Kronen. Formlinien werden nicht als Barrieren behandelt. Durchlässe und die hydraulische Wirkung sind nicht vermessen.', 'OSM-Gewässerflächen erhalten eine künstliche, ebene Sohle bei 0 m Wiener Null und einen Anfangsspiegel bei 2 m Wiener Null. Dies ist keine gemessene Bathymetrie.', 'Gebäude ohne verwendbare Höhenangabe erhalten 12 m Darstellungshöhe.'],
 'sources': {'osm':'© OpenStreetMap-Mitwirkende, ODbL 1.0, https://www.openstreetmap.org/copyright und https://opendatacommons.org/licenses/odbl/1-0/', 'terrain':'Datenquelle: Stadt Wien - data.wien.gv.at, CC BY 4.0, https://creativecommons.org/licenses/by/4.0/', 'sha256':SOURCES},
}
scenario['surveyCrests'] = derive_faces(scenario)
OUT.parent.mkdir(parents=True,exist_ok=True)
OUT.write_text(json.dumps(scenario,ensure_ascii=False,separators=(',',':'),allow_nan=False)+'\n',encoding='utf-8')
print(f'{OUT.relative_to(ROOT)}: {len(buildings)} Gebäude, {len(roads)} Straßenabschnitte, {int(water_mask.sum())} Wasserzellen; SHA-256 {hashlib.sha256(OUT.read_bytes()).hexdigest()}')
