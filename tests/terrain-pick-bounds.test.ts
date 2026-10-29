import { expect, it, vi } from 'vitest';
import { NullEngine } from '@babylonjs/core/Engines/nullEngine';
import { Scene } from '@babylonjs/core/scene';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { Vector3, Matrix } from '@babylonjs/core/Maths/math.vector';
import { CreateGround } from '@babylonjs/core/Meshes/Builders/groundBuilder';
import { CreateLines } from '@babylonjs/core/Meshes/Builders/linesBuilder';
import { VertexBuffer } from '@babylonjs/core/Buffers/buffer';
import { World } from '../src/render/world';

it('refreshes lowered terrain and road bounds after a state update', () => {
  const engine = new NullEngine({ renderWidth: 800, renderHeight: 600, textureSize: 512, deterministicLockstep: false, lockstepMaxSteps: 4 });
  const scene = new Scene(engine);
  try {
    const camera = new ArcRotateCamera('camera', -Math.PI / 2, Math.PI / 4, 60, Vector3.Zero(), scene);
    scene.activeCamera = camera;
    const land = CreateGround('land', { width: 80, height: 80, updatable: true }, scene);
    const roads = CreateLines('roads', { points: [new Vector3(-10, 0, 0), new Vector3(10, 0, 0)], updatable: true }, scene);
    const world = {
      scene, land, roads, roadPositions: new Float32Array(roads.getVerticesData(VertexBuffer.PositionKind)!), width: 1, height: 1, cell: 80, bed: [0], terrainRevision: 0,
      landPositions: new Float32Array(land.getVerticesData(VertexBuffer.PositionKind)!),
      updateSurveyRidges: vi.fn(), updateTrenches: vi.fn(), damSignature: '[]',
    } as unknown as World;
    World.prototype.updateState.call(world, new Float32Array([-10]), [], [], 1, []);
    scene.render();
    expect(land.getBoundingInfo().boundingBox.minimum.y).toBe(-10);
    expect(roads.getBoundingInfo().boundingBox.minimum.y).toBeCloseTo(-9.95, 4);
    const screen = Vector3.Project(new Vector3(0, -10, 35), Matrix.Identity(), scene.getTransformMatrix(), camera.viewport.toGlobal(800, 600));
    const hit = scene.pick(screen.x, screen.y, mesh => mesh === land);
    expect(hit?.hit).toBe(true);
    expect(hit?.pickedPoint?.z).toBeCloseTo(35, 1);
  } finally {
    scene.dispose();
    engine.dispose();
  }
});
