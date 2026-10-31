import { rescueState } from "../rescue-ui";
import glslangJs from "@babylonjs/core/assets/glslang/glslang.js?url";
import glslangWasm from "@babylonjs/core/assets/glslang/glslang.wasm?url";
import twgslJs from "@babylonjs/core/assets/twgsl/twgsl.js?url";
import twgslWasm from "@babylonjs/core/assets/twgsl/twgsl.wasm?url";
import {
  WebGPUEngine,
  Scene,
  ArcRotateCamera,
  Vector3,
  Color3,
  Color4,
  HemisphericLight,
  DirectionalLight,
  ShadowGenerator,
  Mesh,
  MeshBuilder,
  VertexData,
  StandardMaterial,
  Matrix,
  RawTexture,
  RawCubeTexture,
  Constants,
  Texture,
} from "@babylonjs/core";
import type { Terrain, Snapshot, Point } from "../flood/types";
import {
  cellGeometry,
  assertSnapshot,
  previewGeometry,
  roofGeometry,
} from "./geometry";
import { createPointerTrack } from "./input";
import { gatePose } from "./gate";
export type Quality = "low" | "high";
export interface ScenePick {
  point: Point;
  buildingId?: number;
  gateId?: number;
  button: number;
  originalEvent: PointerEvent;
}
export interface Preview {
  points: Point[];
  valid: boolean;
  cost: number;
  reason?: string;
}
export interface LandscapeOptions {
  quality?: Quality;
  onPointer?: (
    phase: "down" | "move" | "up" | "cancel",
    pick: ScenePick,
  ) => void;
  onDeviceLost?: (message: string) => void;
}
/** Call createLandscape(terrain), await initialize(canvas), then update(workerSnapshot). */
export function createLandscape(
  terrain: Terrain,
  options: LandscapeOptions = {},
) {
  let engine: WebGPUEngine,
    scene: Scene,
    camera: ArcRotateCamera,
    water: Mesh,
    preview: Mesh | undefined;
  let observer: ResizeObserver | undefined,
    disposed = false,
    lastTime = -1,
    previewState: Preview | undefined;
  const rescueMarkers = new Map<
    number,
    { element: HTMLDivElement; point: Vector3 }
  >();
  const houses = new Map<number, Mesh>(),
    gates = new Map<number, Mesh>(),
    barriers = new Map<string, Mesh>();
  let shadow: ShadowGenerator, renderFrame: () => void;
  let latestDepths: Float32Array | undefined,
    removePointerListeners: (() => void) | undefined;
  const quality = options.quality ?? "high",
    size = terrain.cellSize;
  const surface = (x: number, y: number) =>
    terrain.heights[
      Math.min(terrain.height - 1, Math.max(0, Math.floor(y))) * terrain.width +
        Math.min(terrain.width - 1, Math.max(0, Math.floor(x)))
    ];
  const materials = new Map<string, StandardMaterial>();
  function material(name: string, color: number[], rough = true) {
    if (materials.has(name)) return materials.get(name)!;
    const m = new StandardMaterial(name, scene);
    m.diffuseColor = Color3.FromArray(color);
    m.specularColor = rough
      ? new Color3(0.025, 0.025, 0.025)
      : new Color3(0.65, 0.72, 0.7);
    materials.set(name, m);
    return m;
  }
  function box(
    name: string,
    x: number,
    z: number,
    w: number,
    d: number,
    h: number,
    mat: StandardMaterial,
    base = surface(x / size, z / size),
  ) {
    const m = MeshBuilder.CreateBox(
      name,
      { width: w, depth: d, height: h },
      scene,
    );
    m.position.set(x, base + h / 2, z);
    m.material = mat;
    m.receiveShadows = true;
    m.isPickable = false;
    return m;
  }
  function geometry(mesh: Mesh, depths?: Float32Array) {
    const g = cellGeometry(terrain, depths),
      v = new VertexData();
    v.positions = g.positions;
    v.indices = g.indices;
    v.colors = g.colors;
    v.uvs = g.uvs;
    const normals: number[] = [];
    VertexData.ComputeNormals(g.positions, g.indices, normals);
    v.normals = normals;
    v.applyToMesh(mesh, true);
  }
  function resetCamera() {
    camera.setTarget(
      new Vector3(terrain.width * size * 0.5, 0, terrain.height * size * 0.48),
    );
    camera.alpha = -Math.PI / 2 - 0.3;
    camera.beta = 1.02;
    camera.radius = terrain.width * size * 0.85;
  }
  function roof(
    name: string,
    x: number,
    z: number,
    w: number,
    d: number,
    base: number,
    height: number,
    mat: StandardMaterial,
  ) {
    const mesh = new Mesh(name, scene),
      v = new VertexData();
    const data = roofGeometry(w, d, height);
    v.positions = data.positions;
    v.indices = data.indices;
    v.uvs = data.positions.flatMap((_, i) =>
      i % 3 === 0
        ? [
            (data.positions[i] + w / 2) / 3,
            (data.positions[i + 2] + d / 2) / 3 + data.positions[i + 1] / 3,
          ]
        : [],
    );
    const n: number[] = [];
    VertexData.ComputeNormals(v.positions, v.indices, n);
    v.normals = n;
    v.applyToMesh(mesh);
    mesh.position.set(x, base, z);
    mesh.material = mat;
    mesh.isPickable = false;
    shadow.addShadowCaster(mesh);
    return mesh;
  }
  function tree(x: number, y: number, seed: number, base?: number) {
    const ground = base ?? surface(x, y);
    if (
      terrain.river[Math.floor(y) * terrain.width + Math.floor(x)] ||
      terrain.obstacles[Math.floor(y) * terrain.width + Math.floor(x)]
    )
      return;
    const trunk = material("bark", [0.22, 0.18, 0.12]);
    box("trunk", x * size, y * size, 0.45, 0.45, 3.8, trunk, ground);
    const crown = MeshBuilder.CreateSphere(
      "linden canopy",
      {
        diameter: 6.2 + (seed % 5) * 0.9,
        segments: quality === "high" ? 12 : 8,
      },
      scene,
    );
    const foliage = crown.getVerticesData("position")!;
    for (let k = 0; k < foliage.length; k += 3) {
      const variation =
        1 +
        0.13 *
          Math.sin(foliage[k] * 1.7 + seed) *
          Math.cos(foliage[k + 1] * 2.1) +
        0.07 * Math.sin(foliage[k + 2] * 2.6 - seed);
      foliage[k] *= variation;
      foliage[k + 1] *= variation;
      foliage[k + 2] *= variation;
    }
    crown.updateVerticesData("position", foliage);
    crown.createNormals(true);
    crown.position.set(x * size, ground + 4.8, y * size);
    crown.scaling.y = 1.15 + (seed % 4) * 0.15;
    crown.material = material(
      "leaf" + (seed % 4),
      [
        [0.2, 0.31, 0.12],
        [0.27, 0.36, 0.16],
        [0.33, 0.42, 0.18],
        [0.18, 0.29, 0.17],
      ][seed % 4],
    );
    crown.isPickable = false;
    // Offset lobes break the repeated ellipsoid silhouette into irregular broadleaf crowns.
    for (let side = 0; side < 2; side++) {
      const lobe = crown.clone("linden canopy", null)!;
      const angle = seed * 2.399 + side * 2.7;
      lobe.position.x += Math.cos(angle) * (2.2 + (seed % 3) * 0.35);
      lobe.position.z += Math.sin(angle) * (1.7 + (seed % 4) * 0.25);
      lobe.position.y += side === 0 ? 0.6 : -0.8;
      lobe.scaling.scaleInPlace(0.62 + (seed % 3) * 0.06);
      lobe.isPickable = false;
      const branch = box(
        "trunk",
        x * size + Math.cos(angle) * 0.65,
        y * size + Math.sin(angle) * 0.65,
        0.22,
        0.22,
        2.7,
        trunk,
        ground + 2,
      );
      branch.rotation.z = Math.cos(angle) * 0.55;
      branch.rotation.x = Math.sin(angle) * 0.55;
    }
    shadow.addShadowCaster(crown);
  }
  async function initialize(canvas: HTMLCanvasElement) {
    if (!("gpu" in navigator))
      throw new Error(
        "WebGPU is unavailable. Use a WebGPU-capable browser and adapter.",
      );
    engine = new WebGPUEngine(canvas, {
      antialias: quality === "high",
      adaptToDeviceRatio: true,
    });
    await engine.initAsync(
      { jsPath: glslangJs, wasmPath: glslangWasm },
      { jsPath: twgslJs, wasmPath: twgslWasm },
    );
    if (disposed) {
      engine.dispose();
      throw new Error("Scene disposed during initialization");
    }
    engine.setHardwareScalingLevel(
      quality === "low" ? 1.75 : Math.max(1, window.devicePixelRatio / 1.5),
    );
    scene = new Scene(engine);
    scene.clearColor = new Color4(0.72, 0.79, 0.79, 1);
    scene.ambientColor = new Color3(0.35, 0.38, 0.36);
    scene.fogMode = Scene.FOGMODE_EXP2;
    scene.fogDensity = 0.00038;
    scene.fogColor = new Color3(0.72, 0.79, 0.79);
    camera = new ArcRotateCamera(
      "fixed aerial",
      -Math.PI / 2,
      0.67,
      450,
      Vector3.Zero(),
      scene,
    );
    resetCamera();
    camera.lowerBetaLimit = camera.upperBetaLimit = 1.02;
    camera.lowerAlphaLimit = camera.upperAlphaLimit = -Math.PI / 2 - 0.3;
    camera.lowerRadiusLimit = 120;
    camera.upperRadiusLimit = 850;
    camera.panningSensibility = 36;
    camera.wheelPrecision = 5;
    camera.minZ = 0.1;
    camera.maxZ = 2000;
    camera.attachControl(canvas, true);
    camera.inputs.attached.pointers &&
      ((
        camera.inputs.attached.pointers as unknown as { buttons: number[] }
      ).buttons = [2]);
    const sky = new HemisphericLight("sky", new Vector3(0, 1, 0), scene);
    sky.intensity = 0.75;
    sky.groundColor = new Color3(0.35, 0.36, 0.25);
    const sun = new DirectionalLight(
      "late afternoon",
      new Vector3(-0.65, -1, 0.5),
      scene,
    );
    sun.position = new Vector3(300, 400, -120);
    sun.intensity = 1.45;
    shadow = new ShadowGenerator(quality === "high" ? 2048 : 1024, sun);
    shadow.usePercentageCloserFiltering = true;
    shadow.bias = 0.001;
    const ground = new Mesh("hydraulic terrain", scene);
    geometry(ground);
    ground.material = material("meadow", [1.3, 1.3, 1.3]);
    const grassTexture = new Texture("/textures/leafy_grass_diff.jpg", scene);
    grassTexture.uScale = grassTexture.vScale = 2;
    (ground.material as StandardMaterial).diffuseTexture = grassTexture;
    ground.receiveShadows = true;
    ground.isPickable = true;
    // Continue boundary relief into a wooded valley, without a floating board edge.
    const context = new Mesh("surrounding valley", scene),
      cv = new VertexData();
    const pp: number[] = [],
      ii: number[] = [],
      uu: number[] = [],
      cc: number[] = [];
    const step = size * 4,
      nx = Math.ceil((terrain.width * size + 640) / step),
      nz = Math.ceil((terrain.height * size + 640) / step);
    for (let z = 0; z <= nz; z++)
      for (let x = 0; x <= nx; x++) {
        const wx = x * step - 320,
          wz = z * step - 320;
        const cx = Math.max(0, Math.min(terrain.width * size - 0.1, wx)),
          cz = Math.max(0, Math.min(terrain.height * size - 0.1, wz));
        const distance = Math.hypot(wx - cx, wz - cz);
        const h =
          surface(cx / size, cz / size) +
          distance *
            0.17 *
            (1 + 0.35 * Math.sin(wx * 0.014) + 0.2 * Math.cos(wz * 0.011));
        pp.push(wx, h - 0.08, wz);
        uu.push(wx / 12, wz / 12);
        cc.push(0.645, 0.817, 0.4085, 1);
        if (
          x < nx &&
          z < nz &&
          !(
            wx >= 0 &&
            wz >= 0 &&
            wx + step <= terrain.width * size &&
            wz + step <= terrain.height * size
          )
        ) {
          const k = z * (nx + 1) + x;
          ii.push(k, k + 1, k + nx + 2, k, k + nx + 2, k + nx + 1);
        }
      }
    cv.positions = pp;
    cv.indices = ii;
    cv.uvs = uu;
    cv.colors = cc;
    const cn: number[] = [];
    VertexData.ComputeNormals(pp, ii, cn);
    cv.normals = cn;
    cv.applyToMesh(context);
    context.material = ground.material;
    context.isPickable = false;
    const plaster = [
      [0.79, 0.73, 0.59],
      [0.89, 0.84, 0.7],
      [0.74, 0.79, 0.74],
      [0.85, 0.77, 0.64],
      [0.72, 0.72, 0.67],
    ];
    for (const b of terrain.buildings) {
      const x = (b.x + b.width / 2) * size,
        z = (b.y + b.height / 2) * size,
        base = surface(b.x + b.width / 2, b.y + b.height / 2),
        h = 5.6 + (b.id % 5) * 1.1;
      const house = box(
        "house " + b.id,
        x,
        z,
        b.width * size,
        b.height * size,
        h,
        material("plaster" + (b.id % 5), plaster[b.id % 5]),
        base,
      );
      house.metadata = { buildingId: b.id };
      house.isPickable = true;
      houses.set(b.id, house);
      const element = document.createElement("div");
      element.className = "rescue-marker";
      element.dataset.buildingId = String(b.id);
      element.hidden = true;
      canvas.parentElement!.append(element);
      rescueMarkers.set(b.id, {
        element,
        point: new Vector3(x, base + h + 5, z),
      });
      shadow.addShadowCaster(house);
      const tile = material(
        "terracotta" + (b.id % 3),
        [
          [0.43, 0.2, 0.12],
          [0.53, 0.26, 0.16],
          [0.35, 0.29, 0.25],
        ][b.id % 3],
      );
      if (!tile.diffuseTexture) {
        tile.diffuseTexture = new Texture(
          "/textures/roof_tiles_diff.jpg",
          scene,
        );
        tile.diffuseColor.scaleInPlace(1.8);
      }
      roof(
        "pitched tiled roof",
        x,
        z,
        b.width * size + 1,
        b.height * size + 1,
        base + h,
        3.2,
        tile,
      );
      box(
        "chimney",
        x + 3,
        z - 2,
        1,
        1,
        3,
        material("chimney brick", [0.43, 0.32, 0.24]),
        base + h + 1.6,
      );
      const glass = material("window glass", [0.17, 0.26, 0.29], false),
        trim = material("window limestone", [0.82, 0.8, 0.69]);
      for (const side of [-1, 1])
        for (let k = 0; k < 3; k++) {
          box(
            "window frame",
            x - 4 + k * 4,
            z + side * ((b.height * size) / 2 + 0.04),
            1.55,
            0.13,
            1.8,
            trim,
            base + 2,
          );
          box(
            "window",
            x - 4 + k * 4,
            z + side * ((b.height * size) / 2 + 0.13),
            1.2,
            0.08,
            1.45,
            glass,
            base + 2.18,
          );
        }
      box(
        "front door",
        x,
        z + (b.height * size) / 2 + 0.15,
        1.35,
        0.2,
        2.5,
        material("door timber", [0.29, 0.23, 0.16]),
        base,
      );
      // Gardens remain purely cosmetic and sit outside impermeable house footprints.
      const gardenZ = z + 10;
      box(
        "vegetable garden",
        x,
        gardenZ,
        11,
        4,
        0.035,
        material("garden soil", [0.3, 0.27, 0.17]),
      );
      for (let k = 0; k < 5; k++)
        box(
          "vegetable row",
          x - 4 + k * 2,
          gardenZ,
          0.45,
          3,
          0.24,
          material("vegetables", [0.28, 0.39, 0.16]),
        );
      box(
        "garden hedge",
        x + 9,
        z + 7,
        0.8,
        13,
        0.85,
        material("hedge", [0.24, 0.34, 0.15]),
      );
      tree(b.x + b.width + 3, b.y + 1, b.id);
      tree(b.x - 4, b.y + 8, b.id + 1);
    }
    // Irregular floodplain groves follow the actual meandering channel and wooded escarpment.
    for (let n = 0; n < 2600; n++) {
      const x =
        2 +
        ((((Math.sin(n * 127.13) * 43758.54) % 1) + 1) % 1) *
          (terrain.width - 4);
      const y =
        2 +
        ((((Math.sin(n * 311.73 + 17) * 13758.54) % 1) + 1) % 1) *
          (terrain.height - 4);
      const line = terrain.riverCenterline?.[Math.floor(x)];
      const bankDistance = line ? Math.abs(y - line.y) - line.halfWidth : 50;
      const i = Math.floor(y) * terrain.width + Math.floor(x);
      const grove =
        Math.sin(x * 0.11) + Math.cos(y * 0.19) + Math.sin((x + y) * 0.067);
      if (
        !terrain.roads?.[i] &&
        ((bankDistance > 3 && bankDistance < 14 && grove > 0.1) ||
          (y < (line?.y ?? 30) - 22 && grove > -0.6))
      )
        tree(x, y, n);
    }
    for (let n = 0; n < 1100; n++) {
      const x =
        ((((Math.sin(n * 91.71 + 4) * 47158.54) % 1) + 1) % 1) * terrain.width;
      const y =
        terrain.height +
        3 +
        ((((Math.sin(n * 171.71 + 9) * 13158.54) % 1) + 1) % 1) * 85;
      const wx = x * size,
        wz = y * size,
        distance = wz - terrain.height * size;
      const h =
        surface(x, terrain.height - 1) +
        distance *
          0.17 *
          (1 + 0.35 * Math.sin(wx * 0.014) + 0.2 * Math.cos(wz * 0.011));
      if (Math.sin(x * 0.08) + Math.cos(y * 0.13) > -0.7) tree(x, y, n, h);
    }
    // Batch static trees by material; dense woods remain practical in software Chrome.
    for (const mat of [
      materials.get("bark"),
      ...Array.from({ length: 4 }, (_, i) => materials.get("leaf" + i)),
    ]) {
      const meshes = scene.meshes.filter(
        (m) =>
          m.material === mat &&
          (m.name === "trunk" || m.name === "linden canopy"),
      ) as Mesh[];
      if (meshes.length) {
        const grove = Mesh.MergeMeshes(meshes, true, true);
        if (grove) {
          grove.isPickable = false;
          shadow.addShadowCaster(grove);
        }
      }
    }
    for (const gate of terrain.gates) {
      const gx = (gate.x + 0.5) * size,
        gz = (gate.y + 1) * size,
        pose = gatePose(gate, terrain.heights[gate.a], false);
      const m = box(
        "relief gate " + gate.id,
        gx,
        gz,
        7 * size,
        0.5,
        pose.height,
        material("gate steel", [0.28, 0.34, 0.32]),
        pose.bottom,
      );
      m.metadata = { gateId: gate.id };
      m.isPickable = true;
      gates.set(gate.id, m);
      for (const side of [-1, 1])
        box(
          "gate pier",
          gx + (side * 7 * size) / 2,
          gz,
          1.2,
          2,
          3,
          material("concrete", [0.6, 0.59, 0.53]),
          0.25,
        );
    }
    water = new Mesh("actual hydraulic water", scene);
    water.isPickable = false;
    const wm = material("Danube water", [1, 1, 1], false);
    wm.backFaceCulling = false;
    wm.alpha = 1;
    wm.specularPower = 38;
    wm.specularColor = new Color3(0.85, 0.82, 0.7);
    wm.ambientColor = new Color3(0.12, 0.11, 0.09);
    water.material = wm;
    // Soft sky and sun reflection make the water read as a continuous moving surface.
    const skyFaces = Array.from({ length: 6 }, (_, face) => {
      const bytes = new Uint8Array(32 * 32 * 4);
      for (let yy = 0; yy < 32; yy++)
        for (let xx = 0; xx < 32; xx++) {
          const k = (yy * 32 + xx) * 4,
            glow = face === 2 ? 35 : 0;
          bytes[k] = 145 + glow;
          bytes[k + 1] = 161 + glow;
          bytes[k + 2] = 166 + glow;
          bytes[k + 3] = 255;
        }
      return bytes;
    });
    const skyReflection = new RawCubeTexture(
      scene,
      skyFaces,
      32,
      Constants.TEXTUREFORMAT_RGBA,
      Constants.TEXTURETYPE_UNSIGNED_BYTE,
      true,
      false,
      Texture.TRILINEAR_SAMPLINGMODE,
    );
    skyReflection.level = 0.32;
    wm.reflectionTexture = skyReflection;
    // Repeating tangent-space normal field: advected ripples, with real surface heights unchanged.
    const resolution = 128,
      normalPixels = new Uint8Array(resolution * resolution * 4);
    for (let y = 0; y < resolution; y++)
      for (let x = 0; x < resolution; x++) {
        const u = (x / resolution) * Math.PI * 2,
          v = (y / resolution) * Math.PI * 2;
        const nx =
            0.08 * Math.cos(u * 7 + 1.8 * Math.sin(v * 3)) +
            0.045 * Math.cos(u * 19 - v * 11) +
            0.025 * Math.sin(u * 31 + v * 17),
          ny =
            0.07 * Math.sin(v * 9 + Math.sin(u * 5)) +
            0.04 * Math.cos(v * 23 + u * 13),
          nz = Math.sqrt(Math.max(0.1, 1 - nx * nx - ny * ny)),
          i = (y * resolution + x) * 4;
        normalPixels[i] = (nx * 0.5 + 0.5) * 255;
        normalPixels[i + 1] = (ny * 0.5 + 0.5) * 255;
        normalPixels[i + 2] = (nz * 0.5 + 0.5) * 255;
        normalPixels[i + 3] = 255;
      }
    const ripples = new RawTexture(
      normalPixels,
      resolution,
      resolution,
      Constants.TEXTUREFORMAT_RGBA,
      scene,
      true,
      false,
      Texture.TRILINEAR_SAMPLINGMODE,
    );
    const glintPixels = new Uint8Array(resolution * resolution * 4);
    for (let y = 0; y < resolution; y++)
      for (let x = 0; x < resolution; x++) {
        const u = (x / resolution) * Math.PI * 2,
          v = (y / resolution) * Math.PI * 2;
        const eddy =
          Math.sin(u * 7 + Math.sin(v * 3) * 2) *
          Math.cos(v * 9 + Math.sin(u * 4));
        const glint = Math.pow(
          Math.max(
            0,
            Math.sin(u * 29 + Math.sin(v * 17) * 3) *
              Math.cos(v * 31 + Math.sin(u * 11)),
          ),
          5,
        );
        const k = (y * resolution + x) * 4,
          value = 210 + eddy * 20 + glint * 25;
        glintPixels[k] = glintPixels[k + 1] = glintPixels[k + 2] = value;
        glintPixels[k + 3] = 255;
      }
    const currentTexture = new RawTexture(
      glintPixels,
      resolution,
      resolution,
      Constants.TEXTUREFORMAT_RGBA,
      scene,
      true,
      false,
      Texture.TRILINEAR_SAMPLINGMODE,
    );
    currentTexture.wrapU = currentTexture.wrapV = Texture.WRAP_ADDRESSMODE;
    wm.diffuseTexture = currentTexture;
    ripples.wrapU = ripples.wrapV = Texture.WRAP_ADDRESSMODE;
    ripples.level = 0.18;
    wm.bumpTexture = ripples;

    const track = createPointerTrack<ScenePick>((phase, pick, event) =>
      options.onPointer?.(phase, {
        ...pick,
        button: event.button,
        originalEvent: event,
      }),
    );
    const pickEvent = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const hit = scene.pick(
        ((e.clientX - rect.left) *
          engine.getRenderWidth() *
          engine.getHardwareScalingLevel()) /
          rect.width,
        ((e.clientY - rect.top) *
          engine.getRenderHeight() *
          engine.getHardwareScalingLevel()) /
          rect.height,
        (m) =>
          m === ground ||
          m.metadata?.buildingId !== undefined ||
          m.metadata?.gateId !== undefined,
      );
      return hit?.pickedPoint
        ? {
            point: { x: hit.pickedPoint.x / size, y: hit.pickedPoint.z / size },
            buildingId: hit.pickedMesh?.metadata?.buildingId,
            gateId: hit.pickedMesh?.metadata?.gateId,
            button: e.button,
            originalEvent: e,
          }
        : undefined;
    };
    const down = (e: PointerEvent) => {
      const pick = pickEvent(e);
      if (pick) canvas.setPointerCapture(e.pointerId);
      track("down", e, pick);
    };
    const move = (e: PointerEvent) => track("move", e, pickEvent(e));
    const up = (e: PointerEvent) => track("up", e, pickEvent(e));
    const cancel = (e: PointerEvent) => track("cancel", e);
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", cancel);
    canvas.addEventListener("lostpointercapture", cancel);
    removePointerListeners = () => {
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", cancel);
      canvas.removeEventListener("lostpointercapture", cancel);
    };
    observer = new ResizeObserver(() => engine.resize());
    observer.observe(canvas);
    canvas.addEventListener("contextmenu", preventContext);
    renderFrame = () => {
      if (!disposed) {
        ripples.uOffset = performance.now() * 0.000028;
        currentTexture.uOffset = ripples.uOffset;
        ripples.vOffset = Math.sin(performance.now() * 0.0001) * 0.018;
        scene.render();
        for (const { element, point } of rescueMarkers.values()) {
          if (element.hidden) continue;
          const p = Vector3.Project(
            point,
            Matrix.Identity(),
            scene.getTransformMatrix(),
            camera.viewport.toGlobal(
              engine.getRenderWidth(),
              engine.getRenderHeight(),
            ),
          );
          const rect = engine.getRenderingCanvas()!.getBoundingClientRect();
          element.style.left = `${rect.left + (p.x / engine.getRenderWidth()) * rect.width}px`;
          element.style.top = `${rect.top + (p.y / engine.getRenderHeight()) * rect.height}px`;
        }
      }
    };
    engine.runRenderLoop(renderFrame);
    const device = (engine as unknown as { _device?: GPUDevice })._device;
    device?.lost.then((info) => {
      if (!disposed)
        options.onDeviceLost?.(info.message || "WebGPU device lost");
    });
    return diagnostics();
  }
  function preventContext(e: Event) {
    e.preventDefault();
  }
  function update(snapshot: Snapshot) {
    assertSnapshot(terrain, snapshot);
    latestDepths = snapshot.depths;
    if (!scene || disposed) return;
    if (snapshot.time !== lastTime) {
      geometry(water, snapshot.depths);
      lastTime = snapshot.time;
    }
    for (const [id, { element }] of rescueMarkers) {
      const state = rescueState(snapshot, id);
      element.hidden = state.status === "idle";
      element.dataset.state = state.status;
      element.dataset.progress = String(state.progress);
      element.textContent = state.label;
      element.setAttribute(
        "aria-label",
        `Haus ${id}: ${state.status === "complete" ? "Bewohner gerettet" : snapshot.phase === "paused" ? "Rettung pausiert" : "Rettung läuft"} ${Math.round(state.progress * 100)}%`,
      );
      element.style.setProperty("--progress", `${state.progress * 100}%`);
    }
    for (const gate of snapshot.gates) {
      const m = gates.get(gate.id);
      const definition = terrain.gates.find((candidate) => candidate.id === gate.id);
      if (m && definition)
        m.position.y = gatePose(
          definition,
          terrain.heights[definition.a],
          gate.open,
        ).centerY;
    }
    const keys = new Set(snapshot.barriers.map((b) => b.key));
    for (const [key, m] of barriers)
      if (!keys.has(key)) {
        m.dispose();
        barriers.delete(key);
      }
    for (const b of snapshot.barriers) {
      let m = barriers.get(b.key);
      const horizontal = Math.abs(b.a - b.b) === terrain.width;
      const x = (b.x + (horizontal ? 0.5 : 0)) * size,
        z = (b.y + (horizontal ? 0 : 0.5)) * size;
      if (!m) {
        m = box(
          "sandbags " + b.key,
          x,
          z,
          horizontal ? size : 0.7,
          horizontal ? 0.7 : size,
          1,
          material("sandbags", [0.65, 0.58, 0.38]),
        );
        barriers.set(b.key, m);
      }
      m.scaling.y = Math.max(0.12, b.height * b.progress);
      m.position.y =
        Math.max(terrain.heights[b.a], terrain.heights[b.b]) + m.scaling.y / 2;
      m.visibility = b.status === "queued" ? 0.5 : 1;
    }
  }
  function setPreview(state?: Preview) {
    previewState = state;
    preview?.dispose();
    preview = undefined;
    if (!scene || !state || state.points.length < 2) return;
    const lines = previewGeometry(terrain, state.points, latestDepths).map(
      (p) => new Vector3(p.x, p.y, p.z),
    );
    preview = MeshBuilder.CreateLines(
      "barrier preview",
      { points: lines },
      scene,
    );
    (preview as import("@babylonjs/core").LinesMesh).color = state.valid
      ? new Color3(0.75, 0.93, 0.36)
      : new Color3(1, 0.22, 0.12);
    preview.isPickable = false;
    preview.renderingGroupId = 3;
    scene.setRenderingAutoClearDepthStencil(3, true, true, true);
  }
  function project(point: Point) {
    const v = Vector3.Project(
      new Vector3(point.x * size, surface(point.x, point.y), point.y * size),
      Matrix.Identity(),
      scene.getTransformMatrix(),
      camera.viewport.toGlobal(
        engine.getRenderWidth(),
        engine.getRenderHeight(),
      ),
    );
    const rect = engine.getRenderingCanvas()!.getBoundingClientRect();
    return {
      x: rect.left + (v.x / engine.getRenderWidth()) * rect.width,
      y: rect.top + (v.y / engine.getRenderHeight()) * rect.height,
    };
  }
  function diagnostics() {
    return {
      backend: "WebGPU" as const,
      quality,
      adapter: engine?.getInfo() ?? null,
      limits: engine
        ? {
            maxTextureDimension2D: engine.currentLimits.maxTextureDimension2D,
            maxBufferSize: engine.currentLimits.maxBufferSize,
          }
        : null,
      renderWidth: engine?.getRenderWidth(),
      renderHeight: engine?.getRenderHeight(),
      preview: previewState
        ? {
            valid: previewState.valid,
            cost: previewState.cost,
            reason: previewState.reason,
          }
        : null,
    };
  }
  function dispose() {
    disposed = true;
    removePointerListeners?.();
    observer?.disconnect();
    engine
      ?.getRenderingCanvas()
      ?.removeEventListener("contextmenu", preventContext);
    for (const { element } of rescueMarkers.values()) element.remove();
    rescueMarkers.clear();
    scene?.dispose();
    engine?.dispose();
  }
  return {
    setRendering: (active: boolean) => {
      if (active) engine.runRenderLoop(renderFrame);
      else engine.stopRenderLoop(renderFrame);
    },
    initialize,
    update,
    dispose,
    setPreview,
    resetCamera,
    project,
    diagnostics,
    zoom: (factor: number) => {
      camera.radius = Math.max(120, Math.min(850, camera.radius * factor));
    },
    pan: (dx: number, dy: number) => {
      camera.target.addInPlace(new Vector3(dx * size, 0, dy * size));
    },
  };
}
