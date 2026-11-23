'use client';

import * as THREE from 'three';
import { IS_HANDHELD } from './deviceTier';
import { InstancedSet } from './realProps';
import { VegetationContactShadows, type VegetationFootprint } from './vegetationContactShadows';

type Vec3 = [number, number, number];
type Point = [x: number, z: number];
type Rock = { position: Vec3; scale: Vec3; rotation: Vec3; color: string };
type Sample = (x: number, z: number) => number;
type Block = [x: number, z: number, radius: number, height: number];

const blocks: Block[] = [
  [-18.50, -21.25, 0.77, 0.66], [-19.83, -21.90, 0.55, 0.42], [-17.42, -21.73, 0.52, 0.53],
  [-20.63, -23.01, 0.62, 0.35], [-21.88, -19.03, 0.62, 0.45],
  [-6.3, -20.4, 0.81, 0.41], [3.2, -21.7, 0.68, 0.39], [16.5, -20.9, 0.66, 0.47],
  [24.0, -22.4, 0.83, 0.51], [33.5, -20.5, 0.69, 0.50],
];
const colors = ['#434748', '#515655', '#565951', '#343939', '#464b49', '#535450'];
const weathered = ['#63665e', '#626358', '#545750'];
const geometryCount = 3;

function seeded(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (Math.imul(1664525, value) + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function clip(points: Point[], plane: (p: Point) => number) {
  const result: Point[] = [];
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    const x = plane(a);
    const y = plane(b);
    if (x >= 0) result.push(a);
    if ((x >= 0) !== (y >= 0)) {
      const mix = x / (x - y);
      result.push([THREE.MathUtils.lerp(a[0], b[0], mix), THREE.MathUtils.lerp(a[1], b[1], mix)]);
    }
  }
  return result;
}

function lavaRock(seed: number, detail: 'chip' | 'rubble' | 'split') {
  const rand = seeded(seed);
  const sides = detail === 'chip' ? 5 : 6 + seed % 3;
  const outline: Point[] = Array.from({ length: sides }, (_, i) => {
    const a = (i + 0.31 * rand()) * 2 * Math.PI / sides;
    const radius = (0.65 + 0.42 * rand()) * (i === seed % sides ? 0.74 : 1);
    return [radius * Math.cos(a), radius * Math.sin(a)];
  });
  const angle = rand() * 0.65 - 0.32;
  const cut = ([x, z]: Point) => x * Math.cos(angle) + z * Math.sin(angle);
  const pieces = detail === 'split' ? [
    { outline: clip(outline, (p) => -cut(p) - 0.027), height: 0.81 + rand() * 0.18 },
    { outline: clip(outline, (p) => cut(p) - 0.038), height: 0.63 + rand() * 0.29 },
  ] : [{ outline, height: 0.83 + rand() * 0.20 }];
  const positions: number[] = [];
  const rgb: number[] = [];
  const faces: number[] = [];
  for (const piece of pieces) {
    const ringSize = piece.outline.length;
    const cx = piece.outline.reduce((sum, [x]) => sum + x, 0) / ringSize;
    const cz = piece.outline.reduce((sum, [, z]) => sum + z, 0) / ringSize;
    const start = positions.length / 3;
    const layers = detail === 'chip' ? [0, 1] : [0, 0.27, 0.58, 1];
    const heights = piece.outline.map(() => piece.height * (0.69 + rand() * 0.40));
    for (const [layer, progress] of layers.entries()) {
      for (const [i, vertex] of piece.outline.entries()) {
        const [x, z] = vertex;
        const spread = layer === 0 ? 0.83 : progress === 1 ? (0.69 + rand() * 0.24) : (0.88 + rand() * 0.18);
        const color = (0.74 + rand() * 0.25) * (0.85 + progress * 0.17);
        positions.push(cx + (x - cx) * spread + progress * 0.11 * Math.sin(seed), progress * heights[i],
          cz + (z - cz) * spread + progress * 0.085 * Math.cos(seed));
        const seam = detail === 'split' && Math.abs(cut(vertex)) < 0.075 ? 0.71 : 1;
        rgb.push(color * seam, color * seam, color * seam);
      }
    }
    for (let layer = 0; layer < layers.length - 1; layer++) {
      for (let i = 0; i < ringSize; i++) {
        const a = start + layer * ringSize + i;
        const b = start + layer * ringSize + (i + 1) % ringSize;
        const c = a + ringSize;
        const d = b + ringSize;
        if (i % 2) faces.push(a, c, d, a, d, b);
        else faces.push(a, c, b, b, c, d);
      }
    }
    const lower = positions.length / 3;
    const upper = lower + 1;
    const peak = heights.reduce((sum, y) => sum + y, 0) / ringSize;
    positions.push(cx, 0, cz, cx - 0.10, peak * (0.99 + rand() * 0.17), cz + 0.07);
    rgb.push(0.57, 0.57, 0.57, 0.94, 0.94, 0.94);
    const topRing = start + (layers.length - 1) * ringSize;
    for (let i = 0; i < ringSize; i++) {
      const next = (i + 1) % ringSize;
      faces.push(lower, start + i, start + next, upper, topRing + next, topRing + i);
    }
  }
  const indexed = new THREE.BufferGeometry()
    .setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    .setAttribute('color', new THREE.Float32BufferAttribute(rgb, 3))
    .setIndex(faces);
  indexed.computeVertexNormals();
  // Keep broken faces defined, with some softened edges from erosion.
  const geometry = indexed.toNonIndexed();
  indexed.dispose();
  geometry.name = `jeju-${detail}`;
  const p = geometry.getAttribute('position');
  const normals = geometry.getAttribute('normal');
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const n = new THREE.Vector3();
  for (let i = 0; i < p.count; i += 3) {
    a.fromBufferAttribute(p, i);
    b.fromBufferAttribute(p, i + 1).sub(a);
    c.fromBufferAttribute(p, i + 2).sub(a);
    b.cross(c).normalize();
    for (let j = i; j < i + 3; j++) {
      n.fromBufferAttribute(normals, j).lerp(b, detail === 'chip' ? 0.74 : 0.48).normalize();
      normals.setXYZ(j, n.x, n.y, n.z);
    }
  }
  return geometry;
}

const rockGeometries = (['chip', 'rubble', 'split'] as const).flatMap((detail, i) =>
  Array.from({ length: geometryCount }, (_, j) => lavaRock(1448 + 491 * j + i * 111, detail)));
const basalt = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 });
basalt.onBeforeCompile = (shader) => {
  shader.vertexShader = 'varying vec3 vBasalt;\nvarying float vStoneHeight;\n' + shader.vertexShader
    .replace('#include <begin_vertex>', `#include <begin_vertex>
      vBasalt = position;
      vec4 stonePoint = vec4(position, 1.0);
      #ifdef USE_INSTANCING
        stonePoint = instanceMatrix * stonePoint;
      #endif
      vStoneHeight = (modelMatrix * stonePoint).y;
    `);
  shader.fragmentShader = `varying vec3 vBasalt;
    varying float vStoneHeight;
    float basaltHash(vec3 p) {
      p = fract(p * 0.1031);
      p += dot(p, p.yxz + 31.32);
      return fract((p.x + p.y) * p.z);
    }
    float basaltNoise(vec3 p) {
      vec3 i = floor(p);
      vec3 f = fract(p);
      vec3 u = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(mix(basaltHash(i), basaltHash(i+vec3(1,0,0)),u.x),mix(basaltHash(i+vec3(0,1,0)),basaltHash(i+vec3(1,1,0)),u.x),u.y),
        mix(mix(basaltHash(i+vec3(0,0,1)),basaltHash(i+vec3(1,0,1)),u.x),mix(basaltHash(i+vec3(0,1,1)),basaltHash(i+vec3(1,1,1)),u.x),u.y),u.z);
    }\n` + shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
      vec3 p = vBasalt;
      float macro = basaltNoise(p * 6.3);
      float stoneDetail = 1.0 - smoothstep(0.015, 0.083, length(fwidth(p)));
      float pores = smoothstep(0.61, 0.81, basaltNoise(p * 27.0 + vec3(3.0, 1.0, 4.0)));
      vec2 fracturePlane = vec2(p.x + 0.58 * p.y, p.z - 0.54 * p.y);
      float breakLine = fracturePlane.x - (0.25 * sin(fracturePlane.y * 4.05) + 0.14 * (macro - 0.5));
      float fissure = abs(breakLine);
      float seam = (1.0 - smoothstep(0.012, 0.022 + fwidth(fissure), fissure)) * stoneDetail;
      float broken = smoothstep(0.24, 0.61, basaltNoise(p * 4.2 + vec3(7.1, 0.0, 0.0)));
      float wetStone = 1.0 - smoothstep(-0.08, 0.20 + macro * 0.08, vStoneHeight);
      diffuseColor.rgb *= (0.77 + 0.35 * macro - (0.21 * pores + 0.49 * seam * broken) * stoneDetail) * (1.0 - wetStone * 0.36);
      float microRelief = 0.015 * macro - 0.004 * pores * stoneDetail;
    `).replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor *= 1.0 - 0.26 * wetStone;')
    .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
      vec3 stoneDx = dFdx(-vViewPosition);
      vec3 stoneDy = dFdy(-vViewPosition);
      vec3 tangent = cross(stoneDy, normal);
      vec3 bitangent = cross(normal, stoneDx);
      float det = dot(stoneDx, tangent) * faceDirection;
      vec3 gradient = sign(det) * (tangent * dFdx(microRelief) + bitangent * dFdy(microRelief)) / max(0.00000001, abs(det));
      normal = normalize(normal - gradient * min(0.42, 0.26 / max(length(gradient), 0.001)) * stoneDetail);
    `);
};

export function buildJejuRubbleField(seed: number, ground: Sample, coast: Sample) {
  const rand = seeded(seed + 1523);
  const rocks: Rock[][] = rockGeometries.map(() => []);
  const contacts: VegetationFootprint[] = [];

  function add(x: number, z: number, radius: number, height: number, tier: number, tidal = false) {
    if (Math.max(Math.abs(x), Math.abs(z)) < 15.65 + radius) return;
    const y = ground(x, z);
    if (tidal ? y < -0.27 || y + height * 0.63 < -0.06 : y < -0.05) return;
    const angle = rand() * Math.PI * 2;
    const base: Vec3 = [x, y - height * (tier === 2 ? 0.28 : 0.17), z];
    const palette = rand() < 0.10 ? weathered : colors;
    const group = tier * geometryCount + Math.floor(rand() * geometryCount);
    rocks[group].push({
      position: base, scale: [radius * (0.87 + rand() * 0.39), height, radius * (0.77 + rand() * 0.24)],
      rotation: [0.08 * (rand() - 0.5), angle, 0.10 * (rand() - 0.5)],
      color: palette[Math.floor(rand() * palette.length)],
    });
    if (tier === 2 || (radius > 0.32 && rand() < 0.13)) contacts.push({ position: base, angle, radius: radius * 1.15 });
  }

  for (const [x, z, radius, height] of blocks) add(x, z, radius, height, 2);
  const spacing = IS_HANDHELD ? 0.69 : 0.46;
  for (let x = -48; x <= 48; x += spacing) {
    const shore = coast(x, 0);
    const taper = 1 - THREE.MathUtils.smoothstep(Math.abs(x), 38, 48);
    for (let inland = 0.15; inland < 10.66; inland += spacing) {
      const density = 0.96 - THREE.MathUtils.smoothstep(inland, 5, 10.66) * 0.63;
      const variation = Math.sin(x * 0.61 + Math.cos(inland * 0.79)) * Math.sin(inland * 0.83 - x * 0.24);
      if (rand() > (density + variation * 0.14) * taper) continue;
      const bx = x + (rand() - 0.5) * spacing * 1.08;
      const bz = inland - shore + (rand() - 0.5) * spacing;
      const radius = (0.145 + rand() ** 1.65 * 0.41) * (1 - 0.18 * THREE.MathUtils.smoothstep(inland, 4, 10));
      if (!blocks.some(([sx, sz, sr]) => Math.hypot(bx - sx, bz - sz) < (sr + radius) * 0.87)) {
        add(bx, bz, radius, radius * (0.32 + rand() * 0.70), radius > 0.28 ? 1 : 0);
      }
      if (rand() < (IS_HANDHELD ? 0.36 : 0.73)) {
        const chip = 0.045 + rand() * 0.14;
        add(bx + spacing * (0.31 + rand() * 0.34), bz - spacing * (0.26 + rand() * 0.37), chip, chip * (0.56 + rand() * 0.38), 0);
      }
    }
  }
  // Low shelves at the waterline expose their tops between breakers.
  const tidal = seeded(seed + 11917);
  for (let x = -44; x < 44; x += IS_HANDHELD ? 1.05 : 0.67) {
    for (const offset of [-0.72, -0.18, 0.43]) {
      if (tidal() < 0.21 + 0.25 * (0.5 + Math.sin(x * 0.52) * 0.5)) continue;
      const bx = x + (tidal() - 0.5) * 0.70;
      const z = -coast(bx, 0) + offset + (tidal() - 0.5) * 0.38;
      const radius = 0.21 + tidal() * 0.36;
      add(bx, z, radius, radius * (0.59 + tidal() * 0.44), 1, true);
    }
  }
  return { rocks, contacts };
}

export type JejuRubbleField = ReturnType<typeof buildJejuRubbleField>;

export function JejuBasaltShore({ field, ground }: { field: JejuRubbleField; ground: Sample }) {
  const { rocks, contacts } = field;
  return (
    <group name="reference-rock-outcrops-kr_jeju" dispose={null}>
      <VegetationContactShadows footprints={contacts} groundHeight={ground} opacity={0.40} />
      {rocks.map((items, index) => items.length > 0 && (
        <InstancedSet key={index} geometry={rockGeometries[index]} material={basalt} items={items} castShadow={false} />
      ))}
    </group>
  );
}
