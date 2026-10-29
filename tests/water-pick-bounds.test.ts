import { expect, it } from 'vitest';
import { NullEngine } from '@babylonjs/core/Engines/nullEngine';
import { Scene } from '@babylonjs/core/scene';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { Vector3, Matrix } from '@babylonjs/core/Maths/math.vector';
import { CreateGround } from '@babylonjs/core/Meshes/Builders/groundBuilder';
import { VertexBuffer } from '@babylonjs/core/Buffers/buffer';
import { World } from '../src/render/world';

it('picks the visible water near the edge after the water level changes', () => {
  const engine = new NullEngine({ renderWidth: 800, renderHeight: 600, textureSize: 512, deterministicLockstep: false, lockstepMaxSteps: 4 });
  const scene = new Scene(engine);
  try {
    const camera = new ArcRotateCamera('camera', -Math.PI / 2, Math.PI / 4, 60, Vector3.Zero(), scene);
    scene.activeCamera = camera;
    const land = CreateGround('land', { width: 80, height: 80 }, scene);
    const water = CreateGround('water', { width: 80, height: 80, updatable: true }, scene);
    water.setVerticesData(VertexBuffer.ColorKind, new Float32Array(16), true);
    const world = {
      canvas: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }) },
      scene, land, water, width: 1, height: 1, cell: 80, bed: [0],
      currentDepth: new Float32Array(1), wetVertices: new Uint8Array(4),
      waterIndexBuffer: new Uint16Array(6), wetTopologyReady: false,
      waterPositions: new Float32Array(water.getVerticesData(VertexBuffer.PositionKind)!),
      waterColors: new Float32Array(16), flowTrenchCells: [], flowSamples: [],
    } as unknown as World;

    for (const depth of [10, 3]) {
      World.prototype.updateWater.call(world, new Float32Array([depth]));
      scene.render();
      const screen = Vector3.Project(new Vector3(0, depth + 0.08, 35), Matrix.Identity(), scene.getTransformMatrix(), camera.viewport.toGlobal(800, 600));
      const hit = scene.pick(screen.x, screen.y, mesh => mesh === water);
      expect(hit?.hit).toBe(true);
      expect(hit?.pickedPoint?.x).toBeCloseTo(0, 1);
      expect(hit?.pickedPoint?.z).toBeCloseTo(35, 1);
    }
  } finally {
    scene.dispose();
    engine.dispose();
  }
});
