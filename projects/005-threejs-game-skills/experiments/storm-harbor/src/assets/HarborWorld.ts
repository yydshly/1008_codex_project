import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { WorldFrame } from '../game/contracts';
import { HOME, PICKUPS, WALLS } from '../game/level';

// Original procedural art, guided by upstream graphics authoring / technical-art.
// Collision belongs to Game. These platforms read the same WALLS data as Game.
type Palette = ReturnType<typeof createMaterials>;
type Transform = { x?: number; y?: number; z?: number; rx?: number; ry?: number; rz?: number };

function createMaterials() {
  const standard = (color: string, roughness = .65, metalness = .2) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness });
  return {
    hull: standard('#e67b38', .39, .32),
    cream: standard('#edf0dc', .52, .15),
    dark: standard('#172f35', .84, .35),
    steel: standard('#728d8d', .52, .65),
    platform: standard('#3e5559', .9, .2),
    concrete: standard('#87928b', .95, .04),
    warehouse: standard('#668284', .83, .21),
    roof: standard('#304c55', .73, .4),
    yellow: standard('#edb74e', .51, .38),
    red: standard('#9b2e45', .64, .24),
    containerBlue: standard('#416a7c', .74, .35),
    containerRust: standard('#9b5f45', .85, .36),
    rubber: standard('#15252b', .97, .03),
    glass: new THREE.MeshPhysicalMaterial({ color: '#8fdae2', metalness: .32, roughness: .16, transparent: true, opacity: .84, clearcoat: .7 }),
    // Gameplay signals stay consistent with the HUD through fog / exposure.
    reward: new THREE.MeshBasicMaterial({ color: '#36d9b1', fog: false, toneMapped: false }),
    signal: new THREE.MeshBasicMaterial({ color: '#60e2c4', fog: false, toneMapped: false }),
    danger: new THREE.MeshBasicMaterial({ color: '#ff8277', fog: false, toneMapped: false }),
    disabled: new THREE.MeshBasicMaterial({ color: '#b5cbd0' }),
    window: new THREE.MeshBasicMaterial({ color: '#efc58e' }),
    far: standard('#344d58', 1, .02),
    wake: new THREE.MeshBasicMaterial({ color: '#73c8c4', transparent: true, opacity: .34, depthWrite: false }),
  };
}

/** Build static detail by material instead of one draw call per bolt / panel. */
class PartBatch {
  private parts = new Map<THREE.Material, THREE.BufferGeometry[]>();
  add(geometry: THREE.BufferGeometry, material: THREE.Material, t: Transform = {}) {
    // Extrusions and primitives must share the same index convention to merge.
    if (geometry.index) {
      const indexed = geometry;
      geometry = indexed.toNonIndexed();
      indexed.dispose();
    }
    geometry.applyMatrix4(new THREE.Matrix4().compose(
      new THREE.Vector3(t.x ?? 0, t.y ?? 0, t.z ?? 0),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(t.rx ?? 0, t.ry ?? 0, t.rz ?? 0)),
      new THREE.Vector3(1, 1, 1),
    ));
    // Basic primitives vary in whether they carry UVs. All batched parts do.
    if (!geometry.getAttribute('uv')) geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(geometry.getAttribute('position').count * 2), 2));
    const existing = this.parts.get(material) ?? [];
    existing.push(geometry);
    this.parts.set(material, existing);
  }
  box(w: number, h: number, d: number, material: THREE.Material, t: Transform = {}) {
    this.add(new THREE.BoxGeometry(w, h, d), material, t);
  }
  cylinder(top: number, bottom: number, height: number, material: THREE.Material, t: Transform = {}, segments = 10) {
    this.add(new THREE.CylinderGeometry(top, bottom, height, segments), material, t);
  }
  beam(from: THREE.Vector3, to: THREE.Vector3, width: number, material: THREE.Material) {
    const midpoint = from.clone().add(to).multiplyScalar(.5);
    const geometry = new THREE.CylinderGeometry(width, width, from.distanceTo(to), 5);
    geometry.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), to.clone().sub(from).normalize()));
    this.add(geometry, material, { x: midpoint.x, y: midpoint.y, z: midpoint.z });
  }
  finish(target: THREE.Group, shadow = false) {
    const meshes: THREE.Mesh[] = [];
    this.parts.forEach((parts, material) => {
      const geometry = mergeGeometries(parts, false);
      parts.forEach(part => part.dispose());
      if (!geometry) throw new Error('HarborWorld material batch could not be merged');
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = shadow;
      mesh.receiveShadow = true;
      mesh.name = `authored-${material.uuid.slice(0, 8)}`;
      target.add(mesh);
      meshes.push(mesh);
    });
    this.parts.clear();
    return meshes;
  }
}

function footprint(points: [number, number][], thickness: number, bevel = .06) {
  const shape = new THREE.Shape();
  points.forEach(([x, z], index) => index ? shape.lineTo(x, z) : shape.moveTo(x, z));
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: bevel > 0, bevelSegments: 1, bevelSize: bevel, bevelThickness: bevel, steps: 1 });
  geometry.translate(0, 0, -thickness * .5);
  geometry.rotateX(Math.PI * .5);
  return geometry;
}

function createSkiff(materials: Palette) {
  const root = new THREE.Group();
  root.name = 'playerSkiff';
  const body = new THREE.Group();
  root.add(body);
  const batch = new PartBatch();
  const outline: [number, number][] = [[-.44, -1.36], [.44, -1.36], [.72, -.63], [.75, .7], [.48, 1.22], [-.48, 1.22], [-.75, .7], [-.72, -.63]];
  batch.add(footprint(outline, .21, .09), materials.hull, { y: .07 });
  batch.add(footprint(outline.map(([x, z]) => [x * 1.07, z * 1.02]), .16, .05), materials.rubber, { y: -.15 });
  batch.add(footprint([[-.35, -1.21], [.35, -1.21], [.6, -.57], [.58, .7], [-.58, .7], [-.6, -.57]], .035, .035), materials.cream, { y: .22 });
  // Raised bridge, wrapped windshield and a faceted bow reinforce direction.
  batch.add(footprint([[-.35, -.83], [.35, -.83], [.4, -.08], [-.4, -.08]], .36, .07), materials.hull, { y: .42 });
  batch.box(.62, .27, .06, materials.glass, { y: .53, z: -.87, rx: -.17 });
  batch.box(.04, .3, .07, materials.cream, { x: -.32, y: .52, z: -.9, rx: -.17 });
  batch.box(.04, .3, .07, materials.cream, { x: .32, y: .52, z: -.9, rx: -.17 });
  batch.box(.66, .06, .58, materials.cream, { y: .7, z: -.48 });
  batch.box(.06, .04, .5, materials.dark, { y: .742, z: -.45 });
  batch.box(.51, .045, .08, materials.dark, { y: .235, z: -1.07 });
  batch.box(.28, .028, .05, materials.signal, { y: .264, z: -1.105 });
  batch.box(.035, .025, .2, materials.red, { x: -.49, y: .262, z: -.81 });
  batch.box(.035, .025, .2, materials.reward, { x: .49, y: .262, z: -.81 });
  // Long buoyant pontoons are authored lathes, with fins and deck rails.
  const points = [new THREE.Vector2(.025, -1.19), new THREE.Vector2(.14, -1.1), new THREE.Vector2(.19, -.88), new THREE.Vector2(.19, .8), new THREE.Vector2(.13, 1.06), new THREE.Vector2(.015, 1.16)];
  for (const side of [-1, 1]) {
    batch.add(new THREE.LatheGeometry(points, 10), materials.dark, { x: side * .8, y: -.075, rx: Math.PI * .5 });
    batch.box(.095, .07, 1.51, materials.hull, { x: side * .8, y: .14, z: .08 });
    batch.add(footprint([[0, -.43], [side * .32, -.27], [side * .29, .65], [0, .87]], .04, .015), materials.hull, { x: side * .58, y: .08 });
    for (const z of [-.08, .32, .72]) batch.cylinder(.015, .015, .19, materials.steel, { x: side * .54, y: .32, z }, 6);
    batch.beam(new THREE.Vector3(side * .54, .42, -.08), new THREE.Vector3(side * .54, .42, .72), .019, materials.steel);
    batch.cylinder(.2, .23, .35, materials.dark, { x: side * .48, y: .11, z: 1.12, rx: Math.PI * .5 }, 12);
    batch.cylinder(.16, .16, .055, materials.steel, { x: side * .48, y: .11, z: 1.315, rx: Math.PI * .5 }, 12);
    batch.cylinder(.13, .13, .059, materials.reward, { x: side * .48, y: .11, z: 1.35, rx: Math.PI * .5 }, 12);
    for (let vent = 0; vent < 4; vent++) batch.box(.24, .04, .038, materials.steel, { x: side * .49, y: .33, z: .62 + vent * .075 });
  }
  // Cargo cradle is a real functional recess, not a floating reward glow.
  batch.box(.79, .07, .53, materials.dark, { y: .24, z: .37 });
  batch.box(.87, .06, .045, materials.yellow, { y: .28, z: .62 });
  for (const x of [-.39, .39]) batch.box(.035, .15, .51, materials.steel, { x, y: .32, z: .37 });
  for (const x of [-.31, .31]) for (const z of [-1.06, .8]) batch.cylinder(.024, .024, .035, materials.steel, { x, y: .258, z }, 6);
  batch.box(.09, .09, .21, materials.yellow, { x: -.19, y: .243, z: .83 });
  batch.box(.035, .07, .18, materials.dark, { x: -.19, y: .295, z: .83 });
  batch.cylinder(.012, .012, .43, materials.dark, { x: .28, y: .91, z: -.36 }, 5);
  batch.cylinder(.04, .04, .055, materials.signal, { x: .28, y: 1.14, z: -.36 }, 6);
  batch.finish(body, true);
  root.scale.setScalar(.82);
  const cargo = [-1, 1].map(side => {
    const group = new THREE.Group();
    const cargoBatch = new PartBatch();
    cargoBatch.box(.27, .23, .37, materials.reward, { y: .41 });
    cargoBatch.box(.3, .035, .4, materials.steel, { y: .53 });
    cargoBatch.box(.3, .035, .4, materials.steel, { y: .3 });
    cargoBatch.box(.06, .03, .22, materials.signal, { y: .56 });
    cargoBatch.finish(group);
    group.position.set(side * .21, 0, .36);
    body.add(group);
    return group;
  });
  const engineMaterial = new THREE.MeshBasicMaterial({ color: '#69e9e2', transparent: true, opacity: .7, depthWrite: false });
  const exhaust = [-1, 1].map(side => {
    const flare = new THREE.Mesh(new THREE.ConeGeometry(.115, .68, 7, 1, true), engineMaterial);
    flare.rotation.x = -Math.PI * .5;
    flare.position.set(side * .48, .11, 1.7);
    body.add(flare);
    return flare;
  });
  return { root, body, cargo, exhaust, engineMaterial };
}

function createWarehouse(batch: PartBatch, m: Palette, x: number, z: number, width: number, depth: number, height: number) {
  batch.box(width, height, depth, m.warehouse, { x, y: .31 + height * .5, z });
  batch.box(width + .15, .18, depth + .2, m.roof, { x, y: height + .41, z });
  // Saw-tooth shed roof is readable from the actual elevated camera.
  for (let index = 0; index < 3; index++) {
    batch.box(width / 3 - .1, .12, depth + .12, m.steel, { x: x - width / 3 + index * width / 3, y: height + .66, z, rz: -.16 });
    batch.box(width / 3 - .24, .21, .08, m.window, { x: x - width / 3 + index * width / 3, y: height + .49, z: z - depth * .5 });
  }
  const front = z + depth * .5 + .02;
  batch.box(width * .33, height * .6, .06, m.dark, { x: x - width * .2, y: .35 + height * .3, z: front });
  for (let line = 0; line < 7; line++) batch.box(width * .32, .032, .022, m.steel, { x: x - width * .2, y: .45 + line * height * .074, z: front + .06 });
  batch.box(width * .26, .39, .045, m.window, { x: x + width * .24, y: height * .67, z: front + .025 });
  for (let column = 0; column < 5; column++) batch.box(.08, height + .07, .13, m.steel, { x: x - width * .5 + width * column * .25, y: .35 + height * .5, z: front });
  batch.box(.38, .23, .14, m.yellow, { x: x + width * .2, y: .47, z: front + .17 });
  batch.cylinder(.21, .24, .8, m.dark, { x: x + width * .27, y: height + .96, z: z - depth * .2 });
}

function createContainer(batch: PartBatch, m: Palette, x: number, z: number, y: number, color: THREE.Material, width = 2.3, depth = 1.3) {
  batch.box(width, 1.04, depth, color, { x, y: y + .52, z });
  for (const side of [-1, 1]) {
    for (let index = 0; index < 11; index++) batch.box(.045, .96, .035, m.steel, { x: x - width * .46 + index * width * .092, y: y + .52, z: z + side * (depth * .5 + .022) });
    batch.box(width + .06, .045, .055, m.dark, { x, y: y + .055, z: z + side * depth * .5 });
    batch.box(width + .06, .045, .055, m.dark, { x, y: y + 1.02, z: z + side * depth * .5 });
  }
  for (const side of [-1, 1]) batch.box(.06, .98, depth + .04, m.dark, { x: x + side * width * .49, y: y + .52, z });
  batch.box(.48, .03, .24, m.cream, { x: x + width * .22, y: y + 1.066, z: z - depth * .13 });
  batch.box(.15, .035, .19, m.yellow, { x: x + width * .22, y: y + 1.088, z: z - depth * .13 });
}

function createCrane(batch: PartBatch, m: Palette, x: number, z: number, height = 5.8) {
  for (const side of [-1, 1]) {
    batch.box(.48, .18, 1.65, m.dark, { x: x + side * .86, y: .36, z });
    batch.box(.25, height, .25, m.yellow, { x: x + side * .86, y: .43 + height * .5, z });
    batch.beam(new THREE.Vector3(x + side * .86, .55, z - .7), new THREE.Vector3(x + side * .86, height + .39, z + .45), .035, m.steel);
  }
  batch.box(6.4, .32, .4, m.yellow, { x: x + 1.3, y: height + .54, z });
  batch.box(6.4, .07, .52, m.steel, { x: x + 1.3, y: height + .76, z });
  for (let index = 0; index < 6; index++) {
    batch.beam(new THREE.Vector3(x - 1.72 + index, height + .68, z), new THREE.Vector3(x - .72 + index, height + 1.08, z), .032, m.dark);
    batch.beam(new THREE.Vector3(x - 1.72 + index, height + 1.08, z), new THREE.Vector3(x - .72 + index, height + .68, z), .032, m.dark);
  }
  batch.box(6.4, .08, .17, m.yellow, { x: x + 1.3, y: height + 1.08, z });
  batch.box(.8, .9, .68, m.dark, { x: x - 1.1, y: height - .19, z: z + .22 });
  batch.box(.63, .44, .04, m.glass, { x: x - 1.1, y: height - .06, z: z + .59 });
  batch.cylinder(.015, .015, height - 1.75, m.dark, { x: x + 3.2, y: (height + 2.7) * .5, z }, 5);
  batch.box(.7, .17, .48, m.yellow, { x: x + 3.2, y: 2.2, z });
  batch.add(new THREE.TorusGeometry(.16, .043, 5, 10, Math.PI * 1.6), m.steel, { x: x + 3.2, y: 1.94, z, ry: Math.PI * .5 });
}

function createPlatformKit(batch: PartBatch, m: Palette) {
  WALLS.forEach((wall, index) => {
    batch.box(wall.width, .58, wall.depth, m.platform, { x: wall.x, y: -.01, z: wall.z });
    batch.box(wall.width + .035, .055, wall.depth + .035, m.concrete, { x: wall.x, y: .3, z: wall.z });
    // Edge paint and bumper piles keep the precise collision footprint legible.
    for (const side of [-1, 1]) {
      batch.box(wall.width - .3, .018, .105, m.yellow, { x: wall.x, y: .342, z: wall.z + side * (wall.depth * .5 - .14) });
      for (let marker = -wall.width * .5 + .25; marker < wall.width * .5; marker += .62) {
        batch.box(.23, .02, .1, m.dark, { x: wall.x + marker, y: .354, z: wall.z + side * (wall.depth * .5 - .14), ry: .3 });
      }
      for (let p = -wall.width * .5 + .8; p < wall.width * .5; p += 2.05) {
        batch.cylinder(.13, .13, .64, m.dark, { x: wall.x + p, y: .015, z: wall.z + side * (wall.depth * .5 + .01) }, 8);
        batch.cylinder(.16, .19, .18, m.steel, { x: wall.x + p, y: .47, z: wall.z + side * (wall.depth * .5 - .43) }, 8);
      }
    }
    for (let line = 0; line < wall.width; line += 1.4) batch.box(.018, .013, wall.depth - .2, m.platform, { x: wall.x - wall.width * .5 + line + .1, y: .337, z: wall.z });
    for (let scratch = 0; scratch < 7; scratch++) batch.box(.4 + scratch % 3 * .12, .006, .014, m.cream, { x: wall.x - wall.width * .31 + scratch * wall.width * .095, y: .346, z: wall.z + ((scratch % 3) - 1) * wall.depth * .15, ry: -.2 });
    if (index === 0) {
      createWarehouse(batch, m, wall.x - 1.9, wall.z - .6, 6.5, 3.2, 2.5);
      createContainer(batch, m, wall.x + 3.4, wall.z + .42, .37, m.containerRust, 2.6, 1.6);
      createContainer(batch, m, wall.x + 3.4, wall.z + .42, 1.43, m.containerBlue, 2.6, 1.6);
    } else if (index === 1) {
      createWarehouse(batch, m, wall.x + 1.5, wall.z - .2, 7, 2.75, 3.3);
      createContainer(batch, m, wall.x - 4.3, wall.z + .3, .37, m.containerBlue, 2.2, 1.5);
      createCrane(batch, m, wall.x - 2.6, wall.z + .3, 5.1);
    } else if (index === 2) {
      createCrane(batch, m, -1.35, -.35, 5.7);
      createContainer(batch, m, .18, 1.22, .37, m.containerBlue, 2.4, 1);
      createContainer(batch, m, -2.1, 1.22, .37, m.containerRust, 1.65, 1);
    } else if (index === 3) {
      createContainer(batch, m, wall.x - 2.8, wall.z - .75, .37, m.containerBlue);
      createContainer(batch, m, wall.x, wall.z - .75, .37, m.containerRust);
      createContainer(batch, m, wall.x, wall.z - .75, 1.43, m.containerBlue);
      createContainer(batch, m, wall.x + 2.8, wall.z - .75, .37, m.yellow);
    } else if (index === 4) {
      for (const offset of [-2, 1.1]) {
        batch.cylinder(.75, .78, 1.65, m.steel, { x: wall.x + offset, y: 1.18, z: wall.z }, 14);
        batch.cylinder(.77, .77, .1, m.cream, { x: wall.x + offset, y: 2.07, z: wall.z }, 14);
        batch.cylinder(.18, .18, .55, m.dark, { x: wall.x + offset, y: 2.39, z: wall.z }, 8);
      }
    } else {
      createContainer(batch, m, wall.x + 2.3, wall.z - .1, .37, m.containerBlue, 2.3, 1.3);
      createContainer(batch, m, wall.x - 2.8, wall.z - .1, .37, m.containerRust, 1.6, 1.3);
      batch.box(2.7, .09, 1.6, m.cream, { x: HOME.x, y: .39, z: wall.z });
      batch.box(.2, .022, 1.15, m.reward, { x: HOME.x, y: .452, z: wall.z });
    }
  });
}

function createBackdrop(batch: PartBatch, m: Palette) {
  // Layered skyline sits outside the playable limits, never inside a route.
  batch.box(68, 1.4, 5, m.far, { y: -.3, z: -23 });
  for (let index = 0; index < 15; index++) {
    const x = -31 + index * 4.5;
    const height = 3 + (index * 7 % 11) * .55;
    batch.box(2.5 + index % 3 * .4, height, 2.2, m.far, { x, y: height * .5, z: -24 - index % 3 * 2.1 });
    if (index % 2 === 0) {
      for (let row = 0; row < 3; row++) batch.box(1.9, .12, .04, m.steel, { x, y: 1.1 + row * 1.1, z: -22.86 - index % 3 * 2.1 });
    }
  }
  for (const x of [-27, 26]) {
    batch.cylinder(1.7, 1.7, 6, m.far, { x, y: 3.1, z: -19.5 }, 14);
    batch.cylinder(1.82, 1.82, .2, m.steel, { x, y: 6.11, z: -19.5 }, 14);
    batch.box(.5, 7.9, .5, m.far, { x: x - 3, y: 4.1, z: -22 });
    batch.box(9, .4, .4, m.far, { x: x - 1.3, y: 8.05, z: -22 });
    batch.beam(new THREE.Vector3(x - 3, 8.25, -22), new THREE.Vector3(x + 3, 9.5, -22), .035, m.steel);
  }
  // Boundary mooring buoys echo the navigable area, without fake collision.
  for (let index = 0; index < 13; index++) {
    const x = -21 + index * 3.5;
    const z = 17.5;
    batch.cylinder(.19, .3, .42, m.yellow, { x, y: .2, z }, 8);
    batch.cylinder(.05, .05, .55, m.steel, { x, y: .7, z }, 6);
    batch.cylinder(.09, .09, .11, m.signal, { x, y: 1.02, z }, 6);
  }
  for (const x of [-23.5, 23.5]) for (let z = -13; z < 15; z += 4.6) {
    batch.cylinder(.15, .27, .4, m.yellow, { x, y: .15, z }, 8);
    batch.cylinder(.04, .04, .5, m.dark, { x, y: .61, z }, 6);
    batch.cylinder(.09, .09, .08, m.signal, { x, y: .86, z }, 6);
  }
}

function createPickups(materials: Palette) {
  return PICKUPS.map((position, index) => {
    const root = new THREE.Group();
    root.name = `energyCell-${index + 1}`;
    root.position.set(position.x, .8, position.z);
    const batch = new PartBatch();
    batch.add(new THREE.OctahedronGeometry(.48, 0), materials.reward, { y: .1 });
    batch.box(.42, .06, .42, materials.steel, { y: -.27, ry: Math.PI * .25 });
    batch.box(.42, .06, .42, materials.steel, { y: .47, ry: Math.PI * .25 });
    for (const x of [-.23, .23]) batch.box(.035, .71, .035, materials.cream, { x, y: .1 });
    batch.add(new THREE.TorusGeometry(.61, .041, 5, 20), materials.signal, { rx: Math.PI * .5, y: -.4 });
    // A narrow vertical mast reads at the actual whole-harbor camera scale.
    batch.cylinder(.025, .038, .64, materials.dark, { y: .78 }, 6);
    batch.cylinder(.047, .047, .55, materials.signal, { y: .89 }, 6);
    batch.add(new THREE.OctahedronGeometry(.13, 0), materials.signal, { y: 1.23 });
    batch.finish(root);
    return root;
  });
}

function createHazards(materials: Palette) {
  return Array.from({ length: 3 }, (_, index) => {
    const root = new THREE.Group();
    root.name = `patrolDrone-${index + 1}`;
    const body = new THREE.Group();
    root.add(body);
    const batch = new PartBatch();
    batch.add(footprint([[-.34, -.53], [.34, -.53], [.45, .18], [0, .48], [-.45, .18]], .18, .04), materials.red, { y: 1.42 });
    batch.add(new THREE.SphereGeometry(.22, 12, 6), materials.dark, { y: 1.45, z: -.29 });
    batch.cylinder(.15, .15, .06, materials.danger, { y: 1.43, z: -.48, rx: Math.PI * .5 }, 12);
    for (const side of [-1, 1]) {
      batch.box(.64, .05, .14, materials.steel, { x: side * .57, y: 1.47 });
      batch.add(new THREE.TorusGeometry(.24, .045, 5, 12), materials.dark, { x: side * .78, y: 1.5, rx: Math.PI * .5 });
      batch.box(.34, .025, .05, materials.red, { x: side * .78, y: 1.52, rz: side * .6 });
      batch.cylinder(.05, .065, .22, materials.yellow, { x: side * .45, y: 1.31, z: .25 }, 6);
    }
    batch.box(.36, .08, .1, materials.yellow, { y: 1.55, z: .21 });
    batch.finish(body);
    const ringMaterial = new THREE.MeshBasicMaterial({ color: '#ff8277', transparent: true, opacity: .78, depthWrite: false, side: THREE.DoubleSide, fog: false, toneMapped: false });
    const scanner = new THREE.Mesh(new THREE.RingGeometry(.98, 1.105, 40), ringMaterial);
    scanner.rotation.x = -Math.PI * .5;
    scanner.position.y = .06;
    root.add(scanner);
    const dots = new PartBatch();
    for (let dot = 0; dot < 8; dot++) dots.box(.11, .02, .11, materials.danger, { x: Math.cos(dot * Math.PI * .25) * 1.12, z: Math.sin(dot * Math.PI * .25) * 1.12, y: .085 });
    const scannerDots = new THREE.Group();
    dots.finish(scannerDots);
    root.add(scannerDots);
    return { root, body, scanner, scannerDots, ringMaterial };
  });
}

function createMooring(materials: Palette) {
  const root = new THREE.Group();
  root.name = 'deliveryMooring';
  root.position.set(HOME.x, .03, HOME.z);
  const batch = new PartBatch();
  batch.add(new THREE.RingGeometry(1.98, 2.11, 48), materials.reward, { rx: -Math.PI * .5 });
  for (let index = 0; index < 4; index++) {
    const angle = index * Math.PI * .5 + Math.PI * .25;
    batch.box(.12, .028, .48, materials.signal, { x: Math.cos(angle) * 2.22, z: Math.sin(angle) * 2.22, ry: -angle + Math.PI * .5, y: .01 });
  }
  batch.add(footprint([[0, -.78], [.48, -.2], [.2, -.2], [.2, .55], [-.2, .55], [-.2, -.2], [-.48, -.2]], .01, 0), materials.signal, { y: .04 });
  for (const side of [-1, 1]) {
    batch.cylinder(.12, .17, .28, materials.dark, { x: side * 2.12, y: .15, z: .45 }, 8);
    batch.cylinder(.027, .027, .63, materials.steel, { x: side * 2.12, y: .5, z: .45 }, 6);
    batch.cylinder(.09, .09, .16, materials.signal, { x: side * 2.12, y: .84, z: .45 }, 8);
  }
  batch.finish(root);
  return root;
}

function createWater() {
  const geometry = new THREE.PlaneGeometry(90, 70, 64, 48);
  geometry.rotateX(-Math.PI * .5);
  const material = new THREE.MeshStandardMaterial({ color: '#12525c', roughness: .46, metalness: .36 });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = -.13;
  mesh.name = 'tidalWater';
  mesh.receiveShadow = true;
  const positions = geometry.getAttribute('position');
  const xs = new Float32Array(positions.count);
  const zs = new Float32Array(positions.count);
  for (let index = 0; index < positions.count; index++) { xs[index] = positions.getX(index); zs[index] = positions.getZ(index); }
  return { mesh, geometry, material, positions, xs, zs };
}

function createWaterMarks(materials: Palette) {
  const root = new THREE.Group();
  const batch = new PartBatch();
  // Deterministic current lines. Keep energy and scanner areas free of noise.
  for (let index = 0; index < 170; index++) {
    const x = ((index * 17.31) % 61) - 30.5;
    const z = ((index * 7.53) % 45) - 22.5;
    if (WALLS.some(w => Math.abs(x - w.x) < w.width * .5 + .2 && Math.abs(z - w.z) < w.depth * .5 + .2)) continue;
    if (PICKUPS.some(p => Math.hypot(x - p.x, z - p.z) < 1.2)) continue;
    batch.box(.4 + index % 5 * .11, .005, .025, materials.wake, { x, y: -.068, z, ry: -.2 });
  }
  batch.finish(root);
  return root;
}

export function createHarborWorld(scene: THREE.Scene): { update(frame: WorldFrame): void; dispose(): void } {
  const materials = createMaterials();
  const root = new THREE.Group();
  root.name = 'stormHarborWorld';
  scene.add(root);
  const previousBackground = scene.background;
  const previousFog = scene.fog;
  scene.background = new THREE.Color('#70848a');
  scene.fog = new THREE.Fog('#70848a', 37, 91);
  const ambient = new THREE.HemisphereLight('#b8dae0', '#345158', 2.15);
  const key = new THREE.DirectionalLight('#ffd4a0', 3.05);
  key.position.set(-12, 22, 9);
  // A single focused shadow. Renderer controls whether shadows are enabled.
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -26; key.shadow.camera.right = 26;
  key.shadow.camera.top = 22; key.shadow.camera.bottom = -22;
  key.shadow.camera.near = 1; key.shadow.camera.far = 60;
  key.shadow.bias = -.0006;
  key.shadow.normalBias = .02;
  const rim = new THREE.DirectionalLight('#79d5df', .85);
  rim.position.set(12, 8, -15);
  root.add(ambient, key, key.target, rim);
  const staticBatch = new PartBatch();
  createPlatformKit(staticBatch, materials);
  createBackdrop(staticBatch, materials);
  staticBatch.finish(root, false);
  const water = createWater();
  root.add(water.mesh, createWaterMarks(materials));
  const skiff = createSkiff(materials);
  root.add(skiff.root);
  const pickups = createPickups(materials);
  pickups.forEach(pickup => root.add(pickup));
  const hazards = createHazards(materials);
  hazards.forEach(hazard => root.add(hazard.root));
  const mooring = createMooring(materials);
  root.add(mooring);
  const pulseMaterial = new THREE.MeshBasicMaterial({ color: '#a4fff0', transparent: true, opacity: .6, depthWrite: false, side: THREE.DoubleSide });
  const pulseRing = new THREE.Mesh(new THREE.RingGeometry(.98, 1.025, 48), pulseMaterial);
  pulseRing.rotation.x = -Math.PI * .5;
  pulseRing.position.y = .07;
  root.add(pulseRing);
  const impactMaterial = new THREE.MeshBasicMaterial({ color: '#ffa06d', transparent: true, opacity: .6, depthWrite: false, side: THREE.DoubleSide });
  const impactRing = new THREE.Mesh(new THREE.RingGeometry(.86, .98, 32), impactMaterial);
  impactRing.rotation.x = -Math.PI * .5;
  impactRing.position.y = .095;
  root.add(impactRing);
  const wakeGeometry = new THREE.PlaneGeometry(1.1, 3.2);
  wakeGeometry.rotateX(-Math.PI * .5);
  const wakeMaterial = materials.wake.clone();
  const craftWake = new THREE.Mesh(wakeGeometry, wakeMaterial);
  craftWake.position.y = -.045;
  root.add(craftWake);
  let lastHeading = 0;
  let lastTime = 0;
  const foam = new THREE.Color('#8bdfe0');
  const heatColor = new THREE.Color('#ff9b52');

  function update(frame: WorldFrame) {
    const animatedTime = frame.reducedMotion ? 0 : frame.time;
    const delta = Math.max(0, Math.min(.1, frame.time - lastTime));
    const turn = Math.atan2(Math.sin(frame.heading - lastHeading), Math.cos(frame.heading - lastHeading));
    skiff.root.position.set(frame.x, .43 + Math.sin(animatedTime * 3.1) * .025, frame.z);
    skiff.root.rotation.y = frame.heading;
    skiff.body.rotation.z = frame.reducedMotion ? 0 : THREE.MathUtils.lerp(skiff.body.rotation.z, THREE.MathUtils.clamp(turn * -2.7, -.15, .15), delta * 8);
    skiff.body.rotation.x = frame.reducedMotion ? 0 : -.018 * Math.min(frame.speed, 10);
    skiff.cargo.forEach((cargo, index) => { cargo.visible = index < Math.min(frame.cargoCount, 2); });
    skiff.engineMaterial.color.copy(foam).lerp(heatColor, frame.heat / 100);
    skiff.engineMaterial.opacity = frame.boosting ? .86 : .42;
    skiff.exhaust.forEach(flare => {
      flare.visible = frame.speed > .35 && frame.mode === 'playing';
      flare.scale.set(1, frame.boosting ? 1.4 : .4 + frame.speed * .03, 1);
    });
    const wakeLength = Math.min(1, frame.speed / 10);
    craftWake.visible = frame.speed > .6;
    craftWake.scale.y = .3 + wakeLength;
    craftWake.rotation.y = frame.heading;
    craftWake.position.x = frame.x + Math.sin(frame.heading) * (1.1 + wakeLength);
    craftWake.position.z = frame.z + Math.cos(frame.heading) * (1.1 + wakeLength);
    wakeMaterial.opacity = .05 + wakeLength * .11;
    pickups.forEach((pickup, index) => {
      pickup.visible = !frame.collected[index];
      pickup.position.y = .73 + Math.sin(animatedTime * 2.1 + index * .8) * .08;
      pickup.rotation.y = animatedTime * .5 + index * .45;
    });
    hazards.forEach((hazard, index) => {
      const state = frame.hazards[index];
      hazard.root.visible = Boolean(state);
      if (!state) return;
      const previousX = hazard.root.position.x;
      const previousZ = hazard.root.position.z;
      hazard.root.position.set(state.x, Math.sin(animatedTime * 2.3 + index) * .035, state.z);
      if (Math.hypot(state.x - previousX, state.z - previousZ) > .002) hazard.body.rotation.y = Math.atan2(-(state.x - previousX), -(state.z - previousZ));
      hazard.ringMaterial.color.set(state.stunned ? '#a2b9bf' : '#ff8277');
      hazard.ringMaterial.opacity = state.stunned ? .23 : .78;
      hazard.scannerDots.visible = !state.stunned;
      hazard.scannerDots.rotation.y = animatedTime * .6 + index;
      hazard.scanner.scale.setScalar(state.stunned ? .83 : 1 + Math.sin(animatedTime * 2 + index) * .06);
      hazard.body.rotation.z = state.stunned && !frame.reducedMotion ? .2 : 0;
    });
    pulseRing.visible = frame.pulse > 0;
    pulseRing.position.x = frame.x; pulseRing.position.z = frame.z;
    pulseRing.scale.setScalar(1 + (1 - Math.min(1, frame.pulse / .6)) * 5.7);
    pulseMaterial.opacity = Math.min(.65, frame.pulse * 1.1);
    impactRing.visible = frame.impact > 0;
    impactRing.position.x = frame.x; impactRing.position.z = frame.z;
    impactRing.scale.setScalar(1 + (1 - Math.min(1, frame.impact / .4)) * .65);
    impactMaterial.opacity = Math.min(.5, frame.impact);
    mooring.rotation.y = frame.reducedMotion ? 0 : Math.sin(animatedTime * .25) * .045;
    // CPU waves are deliberately modest; no custom shader or second rAF.
    for (let index = 0; index < water.positions.count; index++) {
      water.positions.setY(index, Math.sin(water.xs[index] * .42 + animatedTime * .65) * .022 + Math.cos(water.zs[index] * .58 + water.xs[index] * .18 - animatedTime * .47) * .018);
    }
    water.positions.needsUpdate = true;
    water.geometry.computeVertexNormals();
    lastHeading = frame.heading;
    lastTime = frame.time;
  }

  function dispose() {
    scene.remove(root);
    scene.background = previousBackground;
    scene.fog = previousFog;
    const geometries = new Set<THREE.BufferGeometry>();
    const usedMaterials = new Set<THREE.Material>();
    root.traverse(object => {
      if (object instanceof THREE.Mesh) {
        geometries.add(object.geometry);
        (Array.isArray(object.material) ? object.material : [object.material]).forEach(material => usedMaterials.add(material));
      }
    });
    geometries.forEach(geometry => geometry.dispose());
    usedMaterials.forEach(material => material.dispose());
    Object.values(materials).forEach(material => { if (!usedMaterials.has(material)) material.dispose(); });
    key.shadow.map?.dispose();
  }
  return { update, dispose };
}
