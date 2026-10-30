export interface Point { 0: number; 1: number }
export interface Polygon { outer: number[][]; holes: number[][][] }
export interface Building { id: string; polygon: Polygon; area: number; height: number; heightEstimated: boolean }
export interface Road { id: string; kind: string; points: number[][] }
export interface Scenario {
  id: string; version: string; name: string;
  grid: { width: number; height: number; cellSize: number; origin: number[]; crs: string; heightReference: string; rowDirection: string };
  terrain: number[]; bed: number[]; initialDepth: number[]; waterMask: number[];
  buildings: Building[]; roads: Road[];
  barriers: { id: string; kind: string; points: number[][] }[];
  breaklines: { type: number; points: number[][] }[];
  surveyCrests: { axis: 'x' | 'y'; index: number; crest: number }[];
  crossings: { id: string; bridge: string | null; tunnel: string | null; points: number[][] }[];
  water: { id: string; polygons: Polygon[] }[];
  parameters: { duration: number; budget: number; damageTarget: number; waterLevel: number; manning: number; damHeight: number; damCostPerCell: number; trenchDepth: number; trenchCostPerCell: number; buildingValuePerSquareMetre: number; demolitionCostFraction: number; damageDepth: number; damageDuration: number; inflowCells: number[]; inflowCurve: number[][]; outflowEdges: ('left'|'right'|'top'|'bottom')[] };
  adjustments: string[]; sources: { osm: string; terrain: string; sha256: Record<string, string> };
}

/** Reject malformed data before any simulation or rendering begins. */
export function validateScenario(value: unknown): Scenario {
  if (!value || typeof value !== 'object') throw new Error('Szenario ist kein Objekt.');
  const s = value as Scenario;
  if (s.id !== 'brigittenau' || s.version !== '1.6-draft') throw new Error('Unbekannte Szenarioversion.');
  const g = s.grid;
  if (!g || !Number.isInteger(g.width) || !Number.isInteger(g.height) || g.width < 1 || g.height < 1 || g.width * g.height > 1_000_000 || !Number.isFinite(g.cellSize) || g.cellSize <= 0 || !Array.isArray(g.origin) || g.origin.length !== 2 || !g.origin.every(Number.isFinite) || g.crs !== 'EPSG:31256' || g.rowDirection !== 'south') throw new Error('Ungültiges Szenarioraster.');
  if (g.heightReference !== 'Wiener Null (EPSG:8881)') throw new Error('Ungültiger Höhenbezug; Wiener Null erforderlich.');
  for (const field of ['terrain', 'bed', 'initialDepth', 'waterMask'] as const) {
    const a = s[field];
    if (!Array.isArray(a) || a.length !== g.width*g.height || !a.every(Number.isFinite)) throw new Error(`Ungültiges Raster: ${field}.`);
  }
  if (s.initialDepth.some(n => n < 0) || s.waterMask.some(n => n !== 0 && n !== 1)) throw new Error('Ungültige Wasserwerte.');
  const validPoints = (points: unknown, min: number): points is number[][] => Array.isArray(points) && points.length >= min && points.every(p => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite));
  const validPolygon = (p: Polygon) => p && validPoints(p.outer,4) && Array.isArray(p.holes) && p.holes.every(h => validPoints(h,4));
  if (!Array.isArray(s.buildings) || !s.buildings.every(b => b && typeof b.id === 'string' && validPolygon(b.polygon) && Number.isFinite(b.area) && b.area > 0 && Number.isFinite(b.height) && b.height > 0 && typeof b.heightEstimated === 'boolean')) throw new Error('Ungültige Gebäude.');
  if (new Set(s.buildings.map(b => b.id)).size !== s.buildings.length) throw new Error('Doppelte Gebäudekennung.');
  if (!Array.isArray(s.roads) || !s.roads.every(r => r && typeof r.id === 'string' && typeof r.kind === 'string' && validPoints(r.points,2))) throw new Error('Ungültige Straßen.');
  if (!Array.isArray(s.barriers) || !s.barriers.every(b => b && typeof b.id === 'string' && typeof b.kind === 'string' && validPoints(b.points,2))) throw new Error('Ungültige Barrieren.');
  if (!Array.isArray(s.crossings) || !s.crossings.every(c => c && typeof c.id === 'string' && (c.bridge === null || typeof c.bridge === 'string') && (c.tunnel === null || typeof c.tunnel === 'string') && validPoints(c.points,2))) throw new Error('Ungültige Brücken oder Tunnel.');
  if (!Array.isArray(s.breaklines) || !s.breaklines.every(b=>b && Number.isInteger(b.type) && Array.isArray(b.points) && b.points.length>=2 && b.points.every(p=>Array.isArray(p) && p.length===3 && p.every(Number.isFinite)))) throw new Error('Ungültige DGM-Bruchkanten.');
  if (!Array.isArray(s.surveyCrests) || !s.surveyCrests.every(f=>{if(!f || (f.axis!=='x' && f.axis!=='y') || !Number.isInteger(f.index) || !Number.isFinite(f.crest))return false; const x=f.axis==='x'?f.index%(g.width+1):f.index%g.width, y=f.axis==='x'?Math.floor(f.index/(g.width+1)):Math.floor(f.index/g.width);return f.axis==='x'?x>0&&x<g.width&&y>=0&&y<g.height:x>=0&&x<g.width&&y>0&&y<g.height;})) throw new Error('Ungültige DGM-Zellkanten.');
  if (!Array.isArray(s.water) || !s.water.every(w => w && typeof w.id === 'string' && Array.isArray(w.polygons) && w.polygons.every(validPolygon))) throw new Error('Ungültige Gewässer.');
  const p = s.parameters;
  if (!p || !Number.isFinite(p.duration) || p.duration <= 0 || !Number.isFinite(p.budget) || p.budget < 0 || !Number.isFinite(p.damageTarget) || p.damageTarget < 0 || !Number.isFinite(p.waterLevel)) throw new Error('Ungültige Spielparameter.');
  for (const k of ['damHeight','damCostPerCell','trenchDepth','trenchCostPerCell','buildingValuePerSquareMetre','damageDepth','damageDuration'] as const) if (!Number.isFinite(p[k]) || p[k] <= 0) throw new Error('Ungültiger Spielparameter: ' + k);
  if (!Number.isFinite(p.manning) || p.manning < 0 || !Number.isFinite(p.demolitionCostFraction) || p.demolitionCostFraction < 0) throw new Error('Ungültige Spielparameter.');
  if (!Array.isArray(p.inflowCells) || !p.inflowCells.length || !p.inflowCells.every(i => Number.isInteger(i) && i >= 0 && i < g.width*g.height && (i < g.width || i >= (g.height-1)*g.width || i%g.width === 0 || i%g.width === g.width-1)) || new Set(p.inflowCells).size !== p.inflowCells.length) throw new Error('Ungültige Zuflusszellen.');
  if (!Array.isArray(p.inflowCurve) || p.inflowCurve.length < 2 || !p.inflowCurve.every((v,i)=>Array.isArray(v) && v.length===2 && v.every(Number.isFinite) && v[1]>=0 && v[0]>=0 && (i===0 || v[0]>p.inflowCurve[i-1][0]))) throw new Error('Ungültige Zuflusskurve.');
  if (!Array.isArray(p.outflowEdges) || !p.outflowEdges.every(e=>['left','right','top','bottom'].includes(e))) throw new Error('Ungültige Abflussränder.');
  if (typeof s.name !== 'string' || !s.sources || typeof s.sources.osm !== 'string' || typeof s.sources.terrain !== 'string' || !Array.isArray(s.adjustments) || !s.adjustments.every(x => typeof x === 'string')) throw new Error('Szenario-Metadaten fehlen.');
  return s;
}
