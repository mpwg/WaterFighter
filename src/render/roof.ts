import earcut from 'earcut';

/** Earcut's winding gives upward-facing Babylon normals in the X/Z plane. */
export function roofIndices(points: number[], holes: number[]): number[] {
  return earcut(points, holes, 2);
}
