import { SCENARIO } from '../core/arena';
import type { GameState, LinkSpec, Selection } from '../core/types';

export type Preview = { link: LinkSpec; receiverId: string | null };

/** Resolve the hypothetical open path against the current water-surface heights. */
export function getPreview(state: GameState, selection: Selection): Preview | null {
  if (!selection || selection.kind === 'node') return null;

  const site = selection.kind === 'site'
    ? SCENARIO.sites.find(candidate => candidate.id === selection.id)
    : null;
  const link = SCENARIO.links.find(candidate => candidate.id === (site?.linkId ?? selection.id));
  if (!link) return null;

  const fromSpec = SCENARIO.nodes.find(node => node.id === link.from)!;
  const toSpec = SCENARIO.nodes.find(node => node.id === link.to)!;
  const from = state.nodes.find(node => node.id === link.from)!;
  const to = state.nodes.find(node => node.id === link.to)!;
  // A selected control previews opening it, even if its current opening is zero.
  // Breaching a site lowers its sill exactly as the core does after breach.
  const sill = site ? Math.max(fromSpec.floor, toSpec.floor) + .05 : link.sill;
  const fromHead = Math.max(fromSpec.floor + from.depth, sill);
  const toHead = Math.max(toSpec.floor + to.depth, sill);
  const receiverId = fromHead === toHead ? null : fromHead > toHead ? link.to : link.from;
  return { link, receiverId };
}
