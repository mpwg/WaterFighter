import { SCENARIO } from '../core/arena';
import type { GameState, LinkSpec, Point, Selection, WaterNode, WaterNodeSpec } from '../core/types';
import { getPreview } from './preview';

const W = 1000, H = 680;
const C = { land: '#eee9d8', ink: '#183c40', muted: '#73877b', contour: '#d9ddc6', river: '#215f72', water: '#55b6c6', foam: '#d9f4e9', basin: '#d3ddbc', town: '#cf8061', danger: '#d96741', amber: '#edb84c', cream: '#fffaf0', teal: '#277e73' };
const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const mix = (a: Point, b: Point, t: number): Point => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
const nodeSpec = (id: string) => SCENARIO.nodes.find(n => n.id === id)!;

/** Whole-map renderer. Coordinates, flood extent and flow direction come from the core. */
export class ArenaView {
  private ctx: CanvasRenderingContext2D;
  private state: GameState | null = null;
  private selection: Selection = null;
  private scale = 1;
  private offset: Point = { x: 0, y: 0 };
  private width = W;
  private height = H;
  private observer: ResizeObserver;
  private hovered: Selection = null;
  private readonly onClick = (event: MouseEvent) => this.select(this.hit(this.point(event)));
  private readonly onMove = (event: MouseEvent) => {
    const next = this.hit(this.point(event));
    if (next?.kind !== this.hovered?.kind || next?.id !== this.hovered?.id) {
      this.hovered = next;
      this.render();
    }
    this.canvas.style.cursor = this.hovered ? 'pointer' : 'default';
  };
  private readonly onLeave = () => {
    if (this.hovered) { this.hovered = null; this.render(); }
    this.canvas.style.cursor = 'default';
  };

  constructor(private canvas: HTMLCanvasElement, private select: (selection: Selection) => void) {
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Die Karte benötigt Canvas 2D.');
    this.ctx = context;
    canvas.setAttribute('aria-label', 'Spielkarte: Donau, Gemeinden, Rückhalteräume, Wehre und Dammstellen. Alle Anlagen sind auch über die Einsatzsteuerung erreichbar.');
    canvas.addEventListener('click', this.onClick);
    canvas.addEventListener('mousemove', this.onMove);
    canvas.addEventListener('mouseleave', this.onLeave);
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(canvas);
    this.resize();
  }

  update(state: GameState, selection: Selection): void { this.state = state; this.selection = selection; }

  private resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    this.width = Math.max(1, rect.width || W);
    this.height = Math.max(1, rect.height || H);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(this.width * dpr);
    this.canvas.height = Math.round(this.height * dpr);
    this.scale = Math.min(this.width / W, this.height / H);
    this.offset = { x: (this.width - W * this.scale) / 2, y: (this.height - H * this.scale) / 2 };
    this.render();
  }

  private point(event: MouseEvent): Point {
    const rect = this.canvas.getBoundingClientRect();
    return { x: (event.clientX - rect.left - this.offset.x) / this.scale, y: (event.clientY - rect.top - this.offset.y) / this.scale };
  }

  private hit(p: Point): Selection {
    if (p.x < 0 || p.y < 0 || p.x > W || p.y > H) return null;
    for (const site of [...SCENARIO.sites].reverse()) if (Math.hypot(p.x - site.position.x, p.y - site.position.y) < 24) return { kind: 'site', id: site.id };
    for (const link of [...SCENARIO.links].reverse()) if (link.kind === 'gate' && Math.hypot(p.x - link.position.x, p.y - link.position.y) < 24) return { kind: 'gate', id: link.id };
    for (const n of [...SCENARIO.nodes].reverse()) {
      if (this.inside(p, n.polygon) || Math.hypot(p.x - n.position.x, p.y - n.position.y) < 35) return { kind: 'node', id: n.id };
    }
    return null;
  }

  private inside(p: Point, polygon: Point[]): boolean {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const a = polygon[i], b = polygon[j];
      if ((a.y > p.y) !== (b.y > p.y) && p.x < (b.x - a.x) * (p.y - a.y) / (b.y - a.y) + a.x) inside = !inside;
    }
    return inside;
  }

  private polygon(points: Point[]): void {
    const c = this.ctx;
    c.beginPath();
    points.forEach((p, i) => i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y));
    c.closePath();
  }

  private line(points: Point[]): void {
    const c = this.ctx;
    c.beginPath();
    points.forEach((p, i) => i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y));
  }

  private text(text: string, x: number, y: number, size = 12, color = C.ink, weight = 500, align: CanvasTextAlign = 'left'): void {
    const c = this.ctx;
    c.font = `${weight} ${size}px "Avenir Next", "Segoe UI", sans-serif`;
    c.textAlign = align;
    c.textBaseline = 'middle';
    c.fillStyle = color;
    c.fillText(text, x, y);
  }

  private selected(kind: NonNullable<Selection>['kind'], id: string): boolean {
    return this.selection?.kind === kind && this.selection.id === id;
  }

  private terrain(): void {
    const c = this.ctx;
    c.fillStyle = C.land;
    c.fillRect(0, 0, W, H);
    // Quiet field mosaic and contours make the height of the land legible without map tiles.
    c.save();
    c.globalAlpha = .48;
    for (let i = 0; i < 27; i++) {
      const x = 30 + ((i * 139) % 920), y = 58 + ((i * 97) % 560);
      c.fillStyle = ['#dbe0c5', '#e4dec2', '#e7dfc9', '#e4e7d0'][i % 4];
      c.beginPath();
      c.moveTo(x, y); c.lineTo(x + 67, y - 8); c.lineTo(x + 77, y + 38); c.lineTo(x + 7, y + 45); c.closePath(); c.fill();
    }
    c.restore();
    c.save();
    c.strokeStyle = C.contour;
    c.lineWidth = 1.25;
    for (let i = 0; i < 9; i++) {
      c.beginPath();
      c.moveTo(-50, 380 + i * 25);
      c.bezierCurveTo(100, 300 + i * 20, 240, 480 + i * 14, 385, 495 + i * 18);
      c.bezierCurveTo(450, 500 + i * 18, 475, 660 + i * 5, 560, 720 + i * 3);
      c.stroke();
    }
    c.restore();
    // Small hill symbols in the Wienerwald, away from the river controls.
    for (let i = 0; i < 30; i++) {
      const x = 55 + ((i * 43) % 340), y = 445 + ((i * 59) % 145);
      c.fillStyle = '#b5c9aa';
      c.beginPath(); c.moveTo(x, y - 5); c.lineTo(x - 4, y + 3); c.lineTo(x + 4, y + 3); c.closePath(); c.fill();
    }
    this.text('WIENERWALD', 135, 610, 11, '#8a987f', 600);
    this.text('NIEDERÖSTERREICH', 46, 40, 13, C.muted, 700);
    this.text('DONAU · EINSATZKARTE', 46, 63, 10, '#89998c', 600);
    this.text('Spielgeografie · keine reale Gefahrenkarte', 46, 651, 10, C.muted, 500);
    c.strokeStyle = '#9aa99a'; c.lineWidth = 1;
    this.line([{ x: 943, y: 39 }, { x: 943, y: 69 }]); c.stroke();
    this.line([{ x: 938, y: 46 }, { x: 943, y: 38 }, { x: 948, y: 46 }]); c.stroke();
    this.text('N', 943, 28, 10, C.muted, 700, 'center');
  }

  private waterPath(link: LinkSpec): Point[] {
    return [nodeSpec(link.from).position, link.position, nodeSpec(link.to).position];
  }

  private channels(s: GameState): void {
    const c = this.ctx;
    const rivers = SCENARIO.nodes.filter(n => n.kind === 'river');
    // Continuous upstream/downstream extension keeps the river an actual landscape feature.
    if (rivers.length) {
      const inlet = nodeSpec(SCENARIO.inletId).position, outlet = nodeSpec(SCENARIO.outletId).position;
      c.lineWidth = 28; c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = '#c8d4bd';
      this.line([{ x: -30, y: inlet.y - 20 }, inlet]); c.stroke();
      this.line([outlet, { x: W + 30, y: outlet.y + 12 }]); c.stroke();
      c.lineWidth = 18; c.strokeStyle = C.river;
      this.line([{ x: -30, y: inlet.y - 20 }, inlet]); c.stroke();
      this.line([outlet, { x: W + 30, y: outlet.y + 12 }]); c.stroke();
    }
    for (const link of SCENARIO.links) {
      const points = this.waterPath(link), river = link.kind === 'river';
      const flow = s.flows[link.id] ?? 0;
      c.lineCap = 'round'; c.lineJoin = 'round';
      c.setLineDash(river || link.kind === 'gate' ? [] : [3, 5]);
      c.strokeStyle = river ? '#c5d0b8' : '#bcc9ac';
      c.lineWidth = river ? 30 : link.kind === 'gate' ? 7 : 2;
      this.line(points); c.stroke();
      c.setLineDash([]);
      if (river) {
        const from = s.nodes.find(n => n.id === link.from)!, to = s.nodes.find(n => n.id === link.to)!;
        const depth = (from.depth + to.depth) / 2;
        c.strokeStyle = C.river; c.lineWidth = 16 + clamp(depth / 5) * 10;
        this.line(points); c.stroke();
        c.strokeStyle = '#4696a8'; c.lineWidth = 5 + clamp(depth / 4) * 12;
        this.line(points); c.stroke();
      } else if (link.kind === 'gate') {
        c.strokeStyle = '#6e9fa4'; c.lineWidth = 4;
        this.line(points); c.stroke();
      }
      if (Math.abs(flow) > .015) {
        c.globalAlpha = .7;
        c.strokeStyle = river ? '#a4e3df' : C.water;
        c.lineWidth = river ? 2 : Math.min(9, 2 + Math.sqrt(Math.abs(flow)));
        c.setLineDash(river ? [8, 16] : [7, 5]);
        c.lineDashOffset = -s.time * (flow > 0 ? 18 : -18);
        this.line(points); c.stroke();
        c.setLineDash([]); c.globalAlpha = 1;
        const p = points[1];
        const direction = flow > 0 ? points[2] : points[0];
        const angle = Math.atan2(direction.y - p.y, direction.x - p.x);
        c.save(); c.translate(p.x, p.y); c.rotate(angle);
        c.strokeStyle = C.foam; c.lineWidth = 2;
        this.line([{ x: -5, y: -4 }, { x: 1, y: 0 }, { x: -5, y: 4 }]); c.stroke();
        c.restore();
      }
    }
  }

  private regions(s: GameState): void {
    const c = this.ctx;
    for (const n of SCENARIO.nodes) {
      if (n.kind === 'river') continue;
      const state = s.nodes.find(v => v.id === n.id)!;
      this.polygon(n.polygon);
      c.fillStyle = n.kind === 'basin' ? C.basin : '#e3d3b8';
      c.fill();
      c.strokeStyle = n.kind === 'basin' ? '#9baa81' : '#cfba9c';
      c.lineWidth = 1.5;
      c.setLineDash(n.kind === 'basin' ? [5, 5] : []); c.stroke(); c.setLineDash([]);
      if (state.depth > .005) {
        // The area grows with the square root of fill, so painted area tracks water storage.
        const fill = clamp(state.depth / Math.max(.1, n.capacityDepth));
        const factor = Math.sqrt(fill);
        this.polygon(n.polygon.map(p => mix(n.position, p, factor)));
        c.fillStyle = n.kind === 'town' ? '#6abcc6' : '#66b9bb';
        c.globalAlpha = .78; c.fill(); c.globalAlpha = 1;
        c.strokeStyle = '#b7e6da'; c.lineWidth = 2; c.stroke();
        c.save(); this.polygon(n.polygon.map(p => mix(n.position, p, factor))); c.clip();
        c.strokeStyle = '#b9e2d7'; c.globalAlpha = .55; c.lineWidth = 1;
        for (let k = 0; k < 7; k++) {
          const y = n.position.y - 40 + k * 14;
          const x = n.position.x - 65 + Math.sin(s.time * .7 + k) * 6;
          this.line([{ x, y }, { x: x + 28, y }]); c.stroke();
          this.line([{ x: x + 60, y: y + 5 }, { x: x + 77, y: y + 5 }]); c.stroke();
        }
        c.restore();
      }
      if (this.selected('node', n.id) || (this.hovered?.kind === 'node' && this.hovered.id === n.id)) {
        this.polygon(n.polygon);
        c.strokeStyle = this.selected('node', n.id) ? C.ink : '#7e9786';
        c.lineWidth = 2.5; c.stroke();
      }
    }
  }

  private buildings(n: WaterNodeSpec, state: WaterNode, s: GameState): void {
    const c = this.ctx, p = n.position;
    for (let i = 0; i < 7; i++) {
      const x = p.x + (i % 3 - 1) * 15 + (i % 2 ? 3 : 0), y = p.y + (Math.floor(i / 3) - 1) * 13;
      const washed = state.damage > .65;
      c.fillStyle = washed ? '#9c8b78' : ['#bf7155', '#ca8966', '#d19a72'][i % 3];
      c.fillRect(x - 5, y - 4, 10, 8);
      c.fillStyle = washed ? '#8c8a7d' : '#9c5c47';
      c.beginPath(); c.moveTo(x - 7, y - 4); c.lineTo(x, y - 9); c.lineTo(x + 7, y - 4); c.closePath(); c.fill();
      if (state.depth > .15) {
        c.fillStyle = '#75c4cd'; c.globalAlpha = .75;
        c.fillRect(x - 5, y + 4 - clamp(state.depth / Math.max(.1, n.capacityDepth)) * 8, 10, clamp(state.depth / Math.max(.1, n.capacityDepth)) * 8);
        c.globalAlpha = 1;
      }
    }
    const assigned = s.teams.filter(t => t === n.id).length;
    if (assigned) {
      c.fillStyle = C.teal; c.beginPath(); c.arc(p.x + 32, p.y + 1, 11, 0, Math.PI * 2); c.fill();
      this.text(String(assigned), p.x + 32, p.y + 1, 11, C.cream, 700, 'center');
      const pulse = 13 + ((s.time * 5) % 10);
      c.strokeStyle = C.teal; c.globalAlpha = 1 - (pulse - 13) / 10; c.lineWidth = 1.5;
      c.beginPath(); c.arc(p.x + 32, p.y + 1, pulse, 0, Math.PI * 2); c.stroke(); c.globalAlpha = 1;
    }
  }

  private preview(): void {
    const sel = this.selection ?? this.hovered;
    const preview = getPreview(this.state!, sel);
    if (!preview) return;
    const { link, receiverId } = preview;
    const c = this.ctx;
    c.save();
    c.strokeStyle = C.amber; c.lineWidth = 4;
    c.setLineDash([8, 5]); this.line(this.waterPath(link)); c.stroke();
    c.setLineDash([]);
    let label = 'Kein Gefälle · derzeit kein Fluss';
    if (receiverId) {
      const receiver = nodeSpec(receiverId);
      const points = this.waterPath(link);
      const middle = points[1];
      const destination = points[receiverId === link.to ? 2 : 0];
      const angle = Math.atan2(destination.y - middle.y, destination.x - middle.x);
      c.save(); c.translate(middle.x, middle.y); c.rotate(angle);
      c.strokeStyle = C.ink; c.lineWidth = 3; c.lineCap = 'round';
      this.line([{ x: -15, y: 0 }, { x: 12, y: 0 }, { x: 5, y: -6 }, { x: 12, y: 0 }, { x: 5, y: 6 }]); c.stroke();
      c.restore();
      this.polygon(receiver.polygon); c.fillStyle = '#edb84c'; c.globalAlpha = .18; c.fill(); c.globalAlpha = 1; c.lineWidth = 2.5; c.stroke();
      label = `Möglicher Flutraum · ${receiver.name}`;
    }
    c.font = '600 11px "Avenir Next", "Segoe UI", sans-serif';
    const labelWidth = c.measureText(label).width + 14;
    const labelX = clamp(link.position.x, labelWidth / 2 + 8, W - labelWidth / 2 - 8);
    const labelY = clamp(link.position.y - 26, 13, H - 13);
    c.fillStyle = '#fffaf0e8'; c.beginPath(); c.roundRect(labelX - labelWidth / 2, labelY - 10, labelWidth, 20, 5); c.fill();
    this.text(label, labelX, labelY, 11, C.ink, 600, 'center');
    c.restore();
  }

  private controls(s: GameState): void {
    const c = this.ctx;
    for (const [i, link] of SCENARIO.links.filter(l => l.kind === 'gate').entries()) {
      const p = link.position, gate = s.gates.find(g => g.id === link.id);
      const active = this.selected('gate', link.id), hover = this.hovered?.kind === 'gate' && this.hovered.id === link.id;
      c.save(); c.translate(p.x, p.y);
      c.shadowColor = '#193c4030'; c.shadowBlur = 8; c.shadowOffsetY = 2;
      c.fillStyle = active ? C.ink : C.cream; c.strokeStyle = active || hover ? C.ink : '#8da69a'; c.lineWidth = active ? 3 : 1.5;
      c.beginPath(); c.roundRect(-19, -19, 38, 38, 11); c.fill(); c.stroke(); c.shadowColor = 'transparent';
      c.strokeStyle = active ? C.cream : C.river; c.lineWidth = 2;
      this.line([{ x: -10, y: -8 }, { x: -10, y: 8 }]); c.stroke();
      this.line([{ x: 10, y: -8 }, { x: 10, y: 8 }]); c.stroke();
      const opening = gate?.opening ?? 0;
      if (opening === 0) { this.line([{ x: -8, y: 0 }, { x: 8, y: 0 }]); c.stroke(); }
      else { this.line([{ x: -8, y: 0 }, { x: -8 + 8 * (1 - opening), y: -7 }]); c.stroke(); this.line([{ x: 8, y: 0 }, { x: 8 - 8 * (1 - opening), y: -7 }]); c.stroke(); }
      if (gate && gate.readyAt > s.time) { c.strokeStyle = C.amber; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, 23, -Math.PI / 2, Math.PI * 1.25); c.stroke(); }
      c.restore();
      this.badge(`W${i + 1}`, p.x, p.y + 28, active ? C.ink : '#526f65');
    }
    for (const [i, site] of SCENARIO.sites.entries()) {
      const p = site.position, state = s.sites.find(v => v.id === site.id), active = this.selected('site', site.id);
      c.save(); c.translate(p.x, p.y);
      c.fillStyle = active ? C.ink : state?.breached ? '#f8d5ba' : C.cream;
      c.strokeStyle = active ? C.ink : state?.breached ? C.danger : '#9c9f82'; c.lineWidth = active ? 3 : 1.5;
      c.beginPath(); c.roundRect(-18, -17, 36, 34, 7); c.fill(); c.stroke();
      c.strokeStyle = active ? C.cream : state?.breached ? C.danger : '#766b51'; c.lineWidth = 3;
      if (state?.breached) { this.line([{ x: -10, y: -5 }, { x: -4, y: 3 }, { x: 2, y: -3 }, { x: 10, y: 5 }]); c.stroke(); }
      else {
        this.line([{ x: -10, y: 7 }, { x: -6, y: -4 }, { x: 6, y: -4 }, { x: 10, y: 7 }]); c.stroke();
        if (state?.built) { this.line([{ x: -5, y: -9 }, { x: 5, y: -9 }]); c.stroke(); }
      }
      if (state?.buildingUntil !== null && state?.buildingUntil !== undefined) { c.strokeStyle = C.amber; c.setLineDash([3, 3]); c.lineWidth = 3; c.strokeRect(-22, -21, 44, 42); }
      c.restore();
      this.badge(`D${i + 1}`, p.x, p.y + 26, active ? C.ink : '#7a7058');
    }
  }

  private badge(text: string, x: number, y: number, color: string): void {
    const c = this.ctx;
    c.fillStyle = C.cream; c.beginPath(); c.roundRect(x - 14, y - 8, 28, 16, 5); c.fill();
    this.text(text, x, y, 10, color, 800, 'center');
  }

  private labels(s: GameState): void {
    const c = this.ctx;
    for (const n of SCENARIO.nodes) {
      const state = s.nodes.find(v => v.id === n.id)!;
      const p = { ...n.position, x: n.position.x + (n.id === 'wien-nord' ? 27 : 0) };
      if (n.kind === 'river') continue;
      const y = p.y + (n.kind === 'town' ? 39 : 0);
      c.font = `700 ${n.kind === 'town' ? 13 : 11}px "Avenir Next", "Segoe UI", sans-serif`;
      const width = c.measureText(n.name).width + 14;
      c.fillStyle = '#eee9d8ee'; c.beginPath(); c.roundRect(p.x - width / 2, y - 11, width, 21, 4); c.fill();
      this.text(n.name, p.x, y, n.kind === 'town' ? 13 : 11, C.ink, 700, 'center');
      if (n.kind === 'town') {
        const safe = Math.floor(state.rescued), danger = state.exposed || state.depth > .15;
        this.text(safe >= n.residents ? 'EVAKUIERT' : danger ? `${Math.max(0, n.residents - safe)} ZU RETTEN` : `${n.residents - safe} MENSCHEN`, p.x, y + 17, 9, safe >= n.residents ? C.teal : danger ? '#ad492e' : C.muted, 700, 'center');
        if (state.damage > .005) {
          c.fillStyle = '#d6c5aa'; c.fillRect(p.x - 28, y + 27, 56, 3);
          c.fillStyle = C.danger; c.fillRect(p.x - 28, y + 27, 56 * clamp(state.damage), 3);
        }
      } else {
        const fill = clamp(state.depth / Math.max(.1, n.capacityDepth));
        this.text(`${Math.round(fill * 100)} % GEFÜLLT`, p.x, y + 17, 9, fill > .85 ? '#ad492e' : '#527c6c', 700, 'center');
        c.fillStyle = '#b6c5a6'; c.fillRect(p.x - 24, y + 28, 48, 3);
        c.fillStyle = fill > .85 ? C.danger : C.teal; c.fillRect(p.x - 24, y + 28, 48 * fill, 3);
      }
    }
    const river = SCENARIO.nodes.find(n => n.kind === 'river');
    if (river) this.text('D O N A U  →', river.position.x + 10, river.position.y - 31, 11, C.river, 700);
    const outlet = nodeSpec(SCENARIO.outletId).position;
    this.text('ABFLUSS →', Math.min(940, outlet.x + 10), outlet.y + 38, 9, C.river, 700, 'center');
  }

  render(): void {
    const c = this.ctx, s = this.state;
    c.setTransform(this.canvas.width / this.width, 0, 0, this.canvas.height / this.height, 0, 0);
    c.fillStyle = C.land; c.fillRect(0, 0, this.width, this.height);
    c.translate(this.offset.x, this.offset.y); c.scale(this.scale, this.scale);
    c.save(); c.beginPath(); c.rect(0, 0, W, H); c.clip();
    this.terrain();
    if (s) {
      this.regions(s);
      this.channels(s);
      this.preview();
      for (const n of SCENARIO.nodes.filter(n => n.kind === 'town')) this.buildings(n, s.nodes.find(v => v.id === n.id)!, s);
      this.labels(s);
      this.controls(s);
    }
    c.restore();
  }

  dispose(): void {
    this.observer.disconnect();
    this.canvas.removeEventListener('click', this.onClick);
    this.canvas.removeEventListener('mousemove', this.onMove);
    this.canvas.removeEventListener('mouseleave', this.onLeave);
  }
}
