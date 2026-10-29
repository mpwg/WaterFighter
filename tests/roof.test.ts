import { describe, expect, it } from 'vitest';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import { roofIndices } from '../src/render/roof';

describe('Gebäudedächer', () => {
  it('zeigt bei beiden Grundrissrichtungen zum Licht', () => {
    for (const points of [[0,0, 4,0, 4,4, 0,4], [0,4, 4,4, 4,0, 0,0]]) {
      const vertices: number[] = [];
      for (let i=0; i<points.length; i+=2) vertices.push(points[i], 1, points[i+1]);
      const normals: number[] = [];
      VertexData.ComputeNormals(vertices, roofIndices(points, []), normals);
      for (let i=1; i<normals.length; i+=3) expect(normals[i]).toBeGreaterThan(0.99);
    }
  });
});
