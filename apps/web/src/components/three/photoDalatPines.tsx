'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { IS_HANDHELD } from './deviceTier';
import { bark } from './realMaterials';
import { InstancedSet } from './realProps';
import { VegetationContactShadows } from './vegetationContactShadows';

type Ground = (x: number, z: number) => number;
type Random = () => number;
type TreeInstance = { position: [number, number, number]; rotation: [number, number, number]; scale: number };
type TreeModel = { wood: THREE.BufferGeometry; crowns: THREE.BufferGeometry; needles?: THREE.BufferGeometry; near: boolean };

const TAU = 2 * Math.PI;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const UP = new THREE.Vector3(0, 1, 0);
const FORWARD = new THREE.Vector3(0, 0, 1);
const STEM_HEIGHT = 13;
const NEEDLE_COLORS = ['#374b31', '#435a36', '#536440', '#5a6f42', '#354931'].map((color) => new THREE.Color(color));
const BARK_DARK = new THREE.Color('#4a483f');
const BARK_PALE = new THREE.Color('#8a806b');

function randomFrom(seed: number): Random {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function crownMaterial() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const random = randomFrom(34128);
  const colors = ['#3d5134', '#405937', '#50673d', '#5b7140', '#687a48', '#778751'];
  ctx.lineCap = 'round';
  for (let i = 0; i < 75; i++) {
    const t = (i + random()) / 75;
    const x = 14 + t * 198;
    const side = i % 2 ? 1 : -1;
    const spread = (0.23 + 0.77 * Math.sin(Math.PI * t) ** 0.62) * (50 + 61 * random());
    const y = 130 + side * (random() - 0.5) * 23;
    const tipX = x + 15 + 11 * random();
    const tipY = 130 + side * spread;
    ctx.strokeStyle = '#38432b';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + 7, (y + tipY) * 0.50, tipX, tipY);
    ctx.stroke();
    for (let j = 0; j < 27; j++) {
      const progress = 0.10 + 0.89 * random();
      const px = x + (tipX - x) * progress ** 1.5;
      const py = y + (tipY - y) * progress;
      const length = 8 + random() * 20;
      const angle = -0.35 + random() * 2.8;
      ctx.strokeStyle = colors[Math.floor(random() * colors.length)];
      ctx.lineWidth = 0.9 + random() * 1.85;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.quadraticCurveTo(px + Math.cos(angle) * length * 0.48, py + side * Math.sin(angle) * length * 0.56,
        px + Math.cos(angle - 0.18) * length, py + side * Math.sin(angle - 0.12) * length);
      ctx.stroke();
    }
  }
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 4;
  return new THREE.MeshLambertMaterial({ map, alphaTest: 0.32, vertexColors: true, side: THREE.DoubleSide });
}

class PineGeometry {
  private positions: number[] = [];
  private colors: number[] = [];
  private uv: number[] = [];
  private indexes: number[] = [];

  private vertex(point: THREE.Vector3, tint: THREE.Color, u: number, v: number) {
    this.positions.push(point.x, point.y, point.z);
    this.colors.push(tint.r, tint.g, tint.b);
    this.uv.push(u, v);
  }

  tube(points: THREE.Vector3[], radii: number[], sides: number, phase: number) {
    const offset = this.positions.length / 3;
    const stride = sides + 1;
    const radial = new THREE.Vector3();
    const axis = new THREE.Vector3();
    const side = new THREE.Vector3();
    const across = new THREE.Vector3();
    const tint = new THREE.Color();
    let meters = 0;
    for (let row = 0; row < points.length; row++) {
      const center = points[row];
      if (row) meters += center.distanceTo(points[row - 1]);
      axis.subVectors(points[Math.min(row + 1, points.length - 1)], points[Math.max(row - 1, 0)]).normalize();
      side.crossVectors(Math.abs(axis.y) > 0.93 ? FORWARD : UP, axis).normalize();
      across.crossVectors(axis, side);
      for (let column = 0; column <= sides; column++) {
        const u = column / sides;
        const angle = u * TAU;
        const furrow = Math.sin(angle * 3 + phase) * 0.09 + Math.sin(angle * 5 - meters * 0.21) * 0.042;
        const shade = THREE.MathUtils.clamp(0.34 + 0.25 * Math.sin(angle + phase) + 0.21 * Math.cos(6 * angle - meters * 0.93), 0.06, 0.92);
        radial.copy(center).addScaledVector(side, radii[row] * (1 + furrow) * Math.cos(angle));
        radial.addScaledVector(across, radii[row] * (1 + furrow) * Math.sin(angle));
        this.vertex(radial, tint.copy(BARK_DARK).lerp(BARK_PALE, shade), u, meters * 0.32);
        if (row + 1 < points.length && column < sides) {
          const i = offset + row * stride + column;
          this.indexes.push(i, i + 1, i + stride, i + 1, i + stride + 1, i + stride);
        }
      }
    }
  }

  needle(root: THREE.Vector3, axis: THREE.Vector3, size: number, width: number, tint: THREE.Color) {
    const start = this.positions.length / 3;
    const side = new THREE.Vector3().crossVectors(axis, Math.abs(axis.y) > 0.93 ? FORWARD : UP).normalize();
    const shoulder = root.clone().addScaledVector(axis, size * 0.37);
    const tip = root.clone().addScaledVector(axis, size).addScaledVector(UP, -size * 0.15);
    this.vertex(root, tint.clone().multiplyScalar(0.62), 0.5, 0);
    this.vertex(shoulder.clone().addScaledVector(side, width), tint, 0, 0.37);
    this.vertex(shoulder.addScaledVector(side, -width), tint, 1, 0.37);
    this.vertex(tip, tint.clone().multiplyScalar(1.16), 0.5, 1);
    this.indexes.push(start, start + 2, start + 1, start + 1, start + 2, start + 3);
  }

  /** Offset, pitched needle sprays sit around the actual bough and overlap into a thin, airy canopy. */
  crown(center: THREE.Vector3, heading: number, length: number, width: number, random: Random) {
    for (let layer = 0; layer < 3; layer++) {
      const start = this.positions.length / 3;
      const angle = heading + (layer - 1) * 0.49 + (random() - 0.5) * 0.35;
      const along = new THREE.Vector3(Math.cos(angle), 0.06 + (random() - 0.5) * 0.23, Math.sin(angle));
      const across = new THREE.Vector3(-Math.sin(angle), (layer - 1) * 1.14 + (random() - 0.5) * 0.27, Math.cos(angle)).normalize();
      const middle = center.clone().addScaledVector(UP, (layer - 1) * 0.14);
      const span = width * (0.76 + random() * 0.31);
      const tone = 0.79 + random() * 0.35;
      const tint = new THREE.Color();
      const reverse = layer === 0;
      for (let column = 0; column < 3; column++) {
        const u = column * 0.5;
        for (let side = 0; side < 2; side++) {
          const point = middle.clone().addScaledVector(along, (u - 0.5) * length)
            .addScaledVector(across, (side - 0.5) * span * (column === 1 ? 1 : 0.74))
            .addScaledVector(UP, column === 1 ? 0.14 : -0.10);
          const variation = 0.10 * Math.sin(angle * 4.1 + column * 1.43 + side * 1.91);
          this.vertex(point, tint.setScalar(tone + variation), reverse ? 1 - u : u, side);
        }
      }
      this.indexes.push(start, start + 2, start + 1, start + 1, start + 2, start + 3,
        start + 2, start + 4, start + 3, start + 3, start + 4, start + 5);
    }
  }

  toGeometry() {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(this.positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(this.colors, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    geometry.setIndex(this.indexes);
    geometry.computeVertexNormals();
    return geometry;
  }
}

function pineSpray(needles: PineGeometry, root: THREE.Vector3, tip: THREE.Vector3, spread: number, random: Random) {
  const along = tip.clone().sub(root).normalize();
  const side = new THREE.Vector3().crossVectors(along, Math.abs(along.y) > 0.90 ? FORWARD : UP).normalize();
  const across = new THREE.Vector3().crossVectors(along, side);
  const count = IS_HANDHELD ? 11 : 16;
  for (let i = 0; i < count; i++) {
    const t = (i + 0.3 * random()) / count;
    const angle = i * GOLDEN_ANGLE + random() * 0.63;
    const direction = along.clone().multiplyScalar(0.40 + t * 0.83)
      .addScaledVector(side, Math.cos(angle) * (1.12 - t * 0.77))
      .addScaledVector(across, Math.sin(angle) * (1.02 - t * 0.70)).normalize();
    const length = spread * (0.38 + random() * 0.50) * (1 - t * 0.34);
    const tint = NEEDLE_COLORS[Math.floor(random() * NEEDLE_COLORS.length)];
    needles.needle(root.clone().lerp(tip, t), direction, length, 0.014, tint);
  }
}

/** Mature Đà Lạt pines have an exposed main stem with thin, broad shelves of terminal needle sprays. */
function createPine(seed: number, near: boolean): TreeModel {
  const random = randomFrom(seed);
  const wood = new PineGeometry();
  const crowns = new PineGeometry();
  const needles = near ? new PineGeometry() : undefined;
  const radius = 0.20 + 0.11 * random();
  const lean = 0.20 + random() * 0.82;
  const sweep = random() * TAU;
  const mature = random();
  const bend = (random() - 0.51) * 0.36;
  const stem = (t: number) => new THREE.Vector3(
    Math.cos(sweep) * lean * t ** 1.20 + bend * Math.sin(t * TAU),
    t * STEM_HEIGHT,
    Math.sin(sweep) * lean * t ** 1.60 + bend * Math.sin(t * Math.PI * 0.86),
  );
  const trunkRings = near ? 15 : 8;
  const heightFractions = Array.from({ length: trunkRings }, (_, i) => i / (trunkRings - 1));
  wood.tube(heightFractions.map(stem), heightFractions.map((t) => radius * (1.24 * (1 - t) ** 0.85 + 0.026 + 0.27 * (1 - t) ** 20)), near ? 12 : 6, sweep);
  if (near) {
    for (let i = 0; i < 4; i++) {
      const angle = i * GOLDEN_ANGLE + sweep;
      const end = new THREE.Vector3(Math.cos(angle) * radius * 2.3, 0, Math.sin(angle) * radius * 2.3);
      wood.tube([stem(0.029), end], [radius * 0.44, 0.025], 5, angle);
    }
  }

  const whorls = near ? 6 : 5;
  const crownBase = 0.43 + mature * 0.13;
  for (let layer = 0; layer < whorls; layer++) {
    const fraction = layer / (whorls - 1);
    const tier = crownBase + (0.966 - crownBase) * fraction + (random() - 0.5) * 0.042;
    const branches = near ? 3 + Math.floor(random() * 2) : 2 + layer % 2;
    const orientation = layer * GOLDEN_ANGLE + sweep;
    for (let i = 0; i < branches; i++) {
      const a = orientation + i * TAU / branches + (random() - 0.5) * 0.66;
      const reach = (3.6 - 3.02 * fraction ** 1.38) * (0.66 + random() * 0.54);
      const outset = stem(Math.min(0.985, tier + (random() - 0.5) * 0.029));
      const along = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
      const across = new THREE.Vector3(-Math.sin(a), 0, Math.cos(a));
      const bow = (random() - 0.50) * 0.57;
      const lift = (random() - 0.46 + fraction * 0.41) * reach * 0.83;
      const branch = (t: number) => outset.clone().addScaledVector(along, reach * t)
        .addScaledVector(across, reach * Math.sin(t * Math.PI * 0.85) * bow)
        .addScaledVector(UP, Math.sin(t * Math.PI) * reach * 0.19 + lift * t);
      const width = radius * (0.53 - fraction * 0.39) * (0.78 + random() * 0.30);
      wood.tube([outset, branch(0.36), branch(0.70), branch(1)], [width, width * 0.64, width * 0.37, 0.008], near ? 6 : 4, a);
      const foliage = 0.84 + 0.14 * random() - fraction * 0.36;
      const boughSpan = (1.3 + Math.min(reach, 2.8) * 0.58) * foliage;
      crowns.crown(branch(0.66), a + 0.31, boughSpan * 1.34, boughSpan * 0.81, random);
      const outerPad = branch(1).addScaledVector(along, 0.19).addScaledVector(UP, 0.13);
      crowns.crown(outerPad, a - 0.38, boughSpan * 1.42, boughSpan * 0.96, random);
      if (!needles) continue;
      const shoots = IS_HANDHELD ? 3 : 4;
      for (let j = 0; j < shoots; j++) {
        const t = 0.47 + j / (shoots - 1) * 0.53;
        const from = branch(t);
        const side = (j % 2 === 0 ? 1 : -1) * (0.38 + random() * 0.51);
        const length = Math.min(1.21, reach * 0.5) * (0.65 + random() * 0.6) * (1 - t * 0.28);
        const end = from.clone().addScaledVector(along, length * 0.74).addScaledVector(across, length * side)
          .addScaledVector(UP, (0.08 + random() * 0.32) * length);
        wood.tube([from, end], [width * 0.22, 0.005], 4, a);
        const spread = 0.78 * (0.74 + random() * 0.52) * (1 - fraction * 0.25);
        pineSpray(needles, from.clone().lerp(end, 0.36), end, spread, random);
        if (j % 2 === 0) {
          const outer = end.clone().addScaledVector(across, length * -side * 0.57);
          pineSpray(needles, from.clone().lerp(end, 0.64), outer, spread * 0.76, random);
        }
      }
    }
  }
  const leader = stem(1);
  crowns.crown(leader, sweep, 1.22, 0.80, random);
  if (needles) pineSpray(needles, stem(0.948), leader, 0.61, random);
  return { wood: wood.toGeometry(), crowns: crowns.toGeometry(), needles: needles?.toGeometry(), near };
}

const NEAR_SITES: [number, number, number][] = [
  [-18, 18, 15.8], [-24, 21, 13.0], [18, 23, 16.1], [26, 20, 11.9],
  [-20, 8, 17.1], [-25, 5, 10.8], [19.1, 12, 15.4], [25.5, 7, 13.5],
  [-19, -5, 12.6], [20, -1, 14.4], [27, -5, 10.2], [-25, -9, 13.8],
  [-18.6, -17.8, 15.9], [19.6, -16.8, 13.8], [26, -21, 16.0], [-30, -20, 11.6],
  [-16, -24, 11.0], [-8.4, -26, 14.4], [1.3, -29, 12.4], [8.4, -23, 15.6],
  [14.0, -32, 13.1], [19, -26, 11.5], [-23.0, -31, 15.2], [-33.4, -31, 14.4],
  [-17, 28, 11.5], [24, 30, 10.2], [1.4, 26.5, 11.8], [-8.3, 31, 9.8],
];

function stands(seed: number, ground: Ground, modelCounts: { near: number; far: number }) {
  const random = randomFrom(seed);
  const groups: TreeInstance[][] = Array.from({ length: modelCounts.near + modelCounts.far }, () => []);
  const accepted: Array<[number, number]> = [];
  function place(x: number, z: number, height: number, near: boolean) {
    const span = near ? modelCounts.near : modelCounts.far;
    const i = Math.floor(random() * span) + (near ? 0 : modelCounts.near);
    groups[i].push({ position: [x, ground(x, z) - 0.035, z], rotation: [0, random() * TAU, 0], scale: height / STEM_HEIGHT });
    accepted.push([x, z]);
  }

  for (const [x, z, height] of NEAR_SITES) {
    if (IS_HANDHELD && random() < 0.18 && Math.max(Math.abs(x), Math.abs(z)) > 22) continue;
    place(x, z, height, true);
  }
  // Secondary stands extend up the gullies and wrap the hall even when the camera faces the entry.
  const count = IS_HANDHELD ? 156 : 330;
  for (let i = 0; i < count; i++) {
    const side = i % 2 ? 1 : -1;
    const behind = i % 4 > 0;
    const x = behind ? (random() - 0.5) * 205 : side * (35 + random() * 73);
    const z = behind ? -35 - random() * 116 : -39 + random() * 121;
    const ridge = Math.sin(x * 0.094 + 0.7) * Math.cos(z * 0.091);
    if (random() + ridge * 0.28 < 0.17 || accepted.some(([px, pz]) => (x - px) ** 2 + (z - pz) ** 2 < 16.5)) continue;
    place(x, z, 5.8 + random() * 8.8, false);
  }
  return groups;
}

const TRUNK_MATERIAL = bark('#ffffff').clone();
TRUNK_MATERIAL.vertexColors = true;
TRUNK_MATERIAL.normalScale.setScalar(0.62);
const NEEDLE_MATERIAL = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.84, side: THREE.DoubleSide });
const MODEL_COUNTS = { near: IS_HANDHELD ? 3 : 4, far: 3 };
let models: TreeModel[] | undefined;
let crownSurface: THREE.Material | undefined;

export function PhotoDalatPines({ seed, ground }: { seed: number; ground: Ground }) {
  const treeModels = models ??= Array.from({ length: MODEL_COUNTS.near + MODEL_COUNTS.far }, (_, i) => createPine(4390 + 167 * i, i < MODEL_COUNTS.near));
  const foliage = crownSurface ??= crownMaterial();
  const groups = useMemo(() => stands(seed, ground, MODEL_COUNTS), [seed, ground]);
  const footprints = useMemo(() => groups.slice(0, MODEL_COUNTS.near).flat().map(({ position, rotation, scale }) => ({
    position,
    radius: 1.08 * scale,
    angle: rotation[1],
  })), [groups]);

  return (
    <group name="da-lat-pine-forest">
      <VegetationContactShadows footprints={footprints} groundHeight={ground} opacity={0.29} />
      {treeModels.map(({ wood, crowns, needles, near }, i) => groups[i].length > 0 && (
        <group key={i}>
          <InstancedSet geometry={wood} material={TRUNK_MATERIAL} items={groups[i]} castShadow={near && !IS_HANDHELD} />
          <InstancedSet geometry={crowns} material={foliage} items={groups[i]} castShadow={false} />
          {needles && <InstancedSet geometry={needles} material={NEEDLE_MATERIAL} items={groups[i]} castShadow={false} />}
        </group>
      ))}
    </group>
  );
}
