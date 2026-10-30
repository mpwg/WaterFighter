/** Bound extra flow samples while retaining even coverage of confirmed trenches. */
export const MAX_TRENCH_FLOW_SAMPLES=200;
export function trenchFlowCells(cells:readonly number[]):number[] {
  const count=Math.min(MAX_TRENCH_FLOW_SAMPLES,Math.ceil(cells.length/6));
  return Array.from({length:count},(_,i)=>cells[Math.floor(i*cells.length/count)]);
}
