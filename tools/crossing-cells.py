"""Rasterize a 4 m neighbourhood of each mapped crossing for flood screening."""
import json
from pathlib import Path
from affine import Affine
from rasterio.features import rasterize
from shapely.geometry import LineString, mapping

scenario=json.loads(Path('public/scenarios/brigittenau-v1.json').read_text())
grid=scenario['grid']; width,height,cell=grid['width'],grid['height'],grid['cellSize']
rows=[]
for crossing in scenario['crossings']:
    neighbourhood=LineString(crossing['points']).buffer(cell)
    mask=rasterize([(mapping(neighbourhood),1)],out_shape=(height,width),transform=Affine(cell,0,0,0,cell,0),all_touched=True)
    cells=mask.ravel().nonzero()[0].tolist()
    rows.append({'id':crossing['id'],'bridge':crossing['bridge'],'tunnel':crossing['tunnel'],'cells':cells})
print(json.dumps({'version':scenario['version'],'cellSize':cell,'crossings':rows},separators=(',',':')))
