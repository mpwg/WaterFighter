import type { LinkSpec, Point, Scenario, WaterNodeSpec } from './types';

const polygon = (x: number, y: number, w: number, h: number): Point[] => [
  { x: x - w * .46, y: y - h * .34 }, { x: x + w * .13, y: y - h * .5 },
  { x: x + w * .5, y: y - h * .15 }, { x: x + w * .4, y: y + h * .4 },
  { x: x - w * .1, y: y + h * .5 }, { x: x - w * .5, y: y + h * .15 },
];
function node(id: string, name: string, kind: WaterNodeSpec['kind'], x: number, y: number, floor: number, area: number, residents = 0, assetValue = 0): WaterNodeSpec {
  return { id, name, kind, position: { x, y }, polygon: polygon(x, y, kind === 'basin' ? 145 : 122, kind === 'basin' ? 94 : 86), floor, area, initialDepth: kind === 'river' ? .8 : 0, capacityDepth: kind === 'river' ? 2 : kind === 'basin' ? 2.4 : 1.5, residents, assetValue };
}
const nodes: WaterNodeSpec[] = [
  node('r1', 'Donau · Tulln', 'river', 85, 235, 2.5, 100),
  node('r2', 'Donau · Auen', 'river', 250, 270, 2.1, 100),
  node('r3', 'Donau · Engstelle', 'river', 415, 310, 1.7, 100),
  node('r4', 'Donau · Wien Nord', 'river', 580, 350, 1.3, 100),
  node('r5', 'Donau · Wien', 'river', 740, 390, .9, 100),
  node('r6', 'Donau · Abfluss', 'river', 920, 430, .5, 100),
  node('b1', 'Tullner Auen', 'basin', 245, 160, 1.4, 90),
  node('b2', 'Korneuburger Becken', 'basin', 495, 175, 1.1, 85),
  node('b3', 'Entlastungsraum Lobau', 'basin', 785, 535, .4, 100),
  node('tulln', 'Tulln', 'town', 100, 385, 3.4, 55, 90, 100),
  node('klosterneuburg', 'Klosterneuburg', 'town', 345, 450, 2.6, 55, 80, 120),
  node('korneuburg', 'Korneuburg', 'town', 355, 85, 2.5, 55, 75, 100),
  node('wien-nord', 'Wien Nord', 'town', 650, 235, 2.1, 70, 140, 180),
  node('wien-zentrum', 'Wien Zentrum', 'town', 565, 535, 1.9, 65, 160, 240),
  node('gross-enzersdorf', 'Groß-Enzersdorf', 'town', 895, 265, 1.4, 50, 65, 80),
];
const links: LinkSpec[] = [];
function link(id: string, from: string, to: string, kind: LinkSpec['kind'], sill: number, conductance: number, maxFlow: number, name: string, position?: Point) {
  const a = nodes.find(n => n.id === from)!.position, b = nodes.find(n => n.id === to)!.position;
  links.push({ id, from, to, kind, sill, conductance, maxFlow, name, position: position ?? { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } });
}
for (let i = 1; i < 6; i++) link(`river-${i}`, `r${i}`, `r${i + 1}`, 'river', 0, 15, i === 3 ? 19 : 27, 'Donau');
link('g1', 'r2', 'b1', 'gate', 2.5, 13, 17, 'Wehr Tullner Auen', { x: 247, y: 218 });
link('g2', 'r3', 'b2', 'gate', 2.1, 12, 16, 'Wehr Korneuburg', { x: 455, y: 248 });
link('g3', 'r5', 'b3', 'gate', 1.3, 13, 17, 'Wehr Lobau', { x: 766, y: 465 });
link('g4', 'r4', 'r6', 'gate', 2.0, 10, 15, 'Wiener Entlastungskanal', { x: 770, y: 325 });
link('site-d1', 'r1', 'tulln', 'breach', 4.4, 9, 14, 'Schutzdamm Tulln', { x: 93, y: 310 });
link('site-d2', 'r3', 'korneuburg', 'breach', 3.7, 8, 12, 'Schutzdamm Korneuburg', { x: 372, y: 230 });
link('site-d3', 'r4', 'wien-nord', 'breach', 3.3, 10, 16, 'Schutzdamm Wien Nord', { x: 615, y: 296 });
link('site-d4', 'r5', 'wien-zentrum', 'breach', 2.95, 10, 16, 'Schutzdamm Wien Zentrum', { x: 655, y: 466 });
link('spill-kloster', 'r3', 'klosterneuburg', 'spill', 3.65, 9, 13, 'Ufer Klosterneuburg');
link('spill-east', 'r6', 'gross-enzersdorf', 'spill', 2.7, 10, 16, 'Ostufer');
link('spill-b1', 'b1', 'korneuburg', 'spill', 3.8, 12, 15, 'Überlauf Tullner Auen');
link('spill-b2', 'b2', 'wien-nord', 'spill', 3.5, 12, 15, 'Überlauf Korneuburger Becken');
link('spill-b3', 'b3', 'gross-enzersdorf', 'spill', 2.8, 12, 15, 'Überlauf Lobau');
// Open drainage paths have raised sills: retention is useful, but finite.
link('drain-b1', 'b1', 'r3', 'spill', 3.8, 7, 10, 'Auenüberlauf zur Donau');
link('drain-b2', 'b2', 'r4', 'spill', 3.5, 7, 10, 'Beckenüberlauf zur Donau');
link('drain-b3', 'b3', 'r6', 'spill', 2.8, 7, 10, 'Lobauüberlauf zur Donau');

export const SCENARIO: Scenario = {
  version: 3, id: 'hq100', name: 'HQ100 · Die Donau kommt', duration: 180, nodes, links,
  inletId: 'r1', outletId: 'r6',
  sites: ['d1', 'd2', 'd3', 'd4'].map(id => {
    const edge = links.find(l => l.id === `site-${id}`)!;
    return { id, name: edge.name, linkId: edge.id, position: edge.position, receiverId: edge.to };
  }),
};
