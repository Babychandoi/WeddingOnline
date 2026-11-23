'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { AndalusiaFountain } from './AndalusiaFountain';
import { IS_HANDHELD } from './deviceTier';
import { detailNormal, detailRoughness } from './pbr';
import { PhScatter, usePhSurface, type ScatterItem } from './phAssets';
import { flutedColumn, pleatedCurtain } from './realGeometry';
import { fabric, painted, wood } from './realMaterials';
import { InstancedSet } from './realProps';

export type ArchitectureStyle = 'ballroom' | 'shrine' | 'courtyard' | 'old-town' | 'canal' | 'palace' | 'villa' | 'chapel' | 'barn' | 'skyline' | 'pavilion' | 'heritage';
type Palette = { primary: string; secondary: string; accent: string; shadow: string };
type Vec3 = [number, number, number];
type Piece = { position: Vec3; rotation?: Vec3; scale: Vec3; color: string };
type Geometry = 'block' | 'timber' | 'arch' | 'hip' | 'gable' | 'asian' | 'tile' | 'column' | 'spire' | 'dome' | 'glass' | 'light' | 'cloth' | 'sail' | 'plaster' | 'plasterArch' | 'glazedDome' | 'basin' | 'ivy';
type Point = { x: number; z: number; yaw?: number; elevation?: number };
type Batch = Partial<Record<Geometry, Piece[]>>;
type Builder = { parts: Batch; pick: () => number; palette: Palette };

type Finish = { wall: string; trim: string; roof: string; frame: string; window?: string; lit?: boolean; paintedFrames?: boolean };

const BOX = new THREE.BoxGeometry(1, 1, 1);
const COLUMN = flutedColumn(1, 0.5);
const TILE = new THREE.CylinderGeometry(0.5, 0.53, 1, 7);
const SPIRE = new THREE.ConeGeometry(0.5, 1, 12).translate(0, 0.5, 0);
const DOME = new THREE.SphereGeometry(0.5, 20, 10, 0, 2 * Math.PI, 0, Math.PI * 0.5);
const CURTAIN = pleatedCurtain(1, 1, 13);
const WINDOW = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.39, metalness: 0.23 });
const LIT_WINDOW = new THREE.MeshBasicMaterial({ color: '#fff3dc', toneMapped: false });

function roundedArch() {
  const shape = new THREE.Shape();
  shape.moveTo(-0.5, 0);
  shape.lineTo(-0.5, 0.48);
  shape.absarc(0, 0.48, 0.5, Math.PI, 0, true);
  shape.lineTo(0.5, 0);
  shape.lineTo(0.39, 0);
  shape.lineTo(0.39, 0.48);
  shape.absarc(0, 0.48, 0.39, 0, Math.PI, false);
  shape.lineTo(-0.39, 0);
  shape.closePath();
  return new THREE.ExtrudeGeometry(shape, { depth: 1, bevelEnabled: false, curveSegments: 16 });
}

const ARCH = roundedArch();

function roofGeometry(tipo: 'gable' | 'hip' | 'asian') {
  const wide = tipo === 'gable' ? 0.5 : 0.32;
  if (tipo !== 'asian') {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([
      -0.5, 0, 0.5, 0.5, 0, 0.5, 0.5, 0, -0.5, -0.5, 0, -0.5, -wide, 1, 0, wide, 1, 0,
    ], 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1, 0.15, 0.5, 0.85, 0.5], 2));
    g.setIndex([0, 1, 5, 0, 5, 4, 1, 2, 5, 2, 3, 4, 2, 4, 5, 3, 0, 4, 3, 2, 1, 3, 1, 0]);
    const flat = g.toNonIndexed();
    g.dispose();
    flat.computeVertexNormals();
    return flat;
  }
  const g = new THREE.PlaneGeometry(1, 1, 22, 14);
  const pos = g.getAttribute('position');
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = -pos.getY(i);
    const ridge = 1 - Math.abs(z) * 2;
    const upsweep = 0.17 * (2 * Math.abs(x)) ** 5;
    const corrugation = 0.016 * Math.cos(x * Math.PI * 46) * (0.62 + ridge * 0.38);
    pos.setXYZ(i, x * (1 - ridge * 0.17), ridge ** 1.52 + upsweep + corrugation, z);
  }
  g.computeVertexNormals();
  return g;
}

const HIP = roofGeometry('hip');
const GABLE = roofGeometry('gable');
const ASIAN = roofGeometry('asian');

function sailGeometry() {
  const mesh = new THREE.PlaneGeometry(1, 1, 22, 18);
  const pos = mesh.getAttribute('position');
  for (let i = 0; i < pos.count; i++) {
    const across = pos.getX(i) * 2;
    const length = pos.getY(i) + 0.5;
    const span = (0.41 + 0.59 * Math.sin(length * Math.PI * 0.86)) * (1 - length ** 5);
    const ridge = Math.sin(length * Math.PI * 0.52) ** 0.85;
    const crown = Math.max(0, 1 - across * across) ** 0.58;
    const seam = 0.006 * Math.sin(66 * across) * span * crown;
    pos.setXYZ(i, length - 0.5 - Math.abs(across) * 0.17 * length, ridge * (0.18 * across ** 2 + crown * 0.88) + seam, across * span * 0.51);
  }
  mesh.computeVertexNormals();
  return mesh;
}

const SAIL = sailGeometry();

function shade(hex: string, gain: number) {
  return `#${new THREE.Color(hex).multiplyScalar(gain).getHexString()}`;
}

function tint(base: string, source: string, influence = 0.28) {
  return `#${new THREE.Color(base).lerp(new THREE.Color(source), influence).getHexString()}`;
}

function seeded(seed: number) {
  let state = (seed || 175) >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function at(builder: Builder, point: Point = { x: 0, z: 0 }) {
  const yaw = point.yaw ?? 0;
  const cos = Math.cos(yaw);
  const sin = Math.sin(yaw);
  return (kind: Geometry, x: number, y: number, z: number, scale: Vec3, color: string, tilt = 0, roll = 0) => {
    (builder.parts[kind] ??= []).push({
      position: [point.x + x * cos + z * sin, (point.elevation ?? 0) + y, point.z - x * sin + z * cos],
      scale, color, rotation: [tilt, yaw, roll],
    });
  };
}

type Add = ReturnType<typeof at>;

function plinth(add: Add, width: number, depth: number, y: number, color: string) {
  add('block', 0, y * 0.45, 0, [width, y * 0.9, depth], shade(color, 0.79));
  add('block', 0, y * 0.93, 0, [width + 0.12, y * 0.14, depth + 0.13], shade(color, 1.15));
}

function lintel(add: Add, x: number, y: number, z: number, width: number, material: 'block' | 'timber', color: string) {
  add(material, x, y - 0.09, z, [width * 1.14, 0.09, 0.25], shade(color, 0.70));
  add(material, x, y, z, [width * 1.22, 0.09, 0.33], color);
}

function casement(add: Add, x: number, y: number, z: number, width: number, height: number, finish: Finish, shutter = false) {
  const frame = finish.paintedFrames ? 'plaster' : 'timber';
  add(frame, x, y, z, [width + 0.17, height + 0.17, 0.14], finish.frame);
  add(finish.lit ? 'light' : 'glass', x, y, z + 0.075, [width, height, 0.045], finish.window ?? '#677372');
  add(frame, x, y, z + 0.116, [0.05, height + 0.02, 0.06], finish.frame);
  add(frame, x, y + height * 0.17, z + 0.116, [width + 0.025, 0.055, 0.06], finish.frame);
  lintel(add, x, y - height * 0.5 - 0.14, z + 0.03, width, 'block', finish.trim);
  if (!shutter) return;
  for (const side of [-1, 1]) {
    const wing = x + side * width * 0.71;
    add(frame, wing, y, z + 0.09, [width * 0.35, height * 1.10, 0.11], shade(finish.frame, 1.12));
    for (let i = 1; i < 7; i++) add(frame, wing, y + (i / 7 - 0.5) * height, z + 0.157, [width * 0.29, 0.04, 0.025], shade(finish.frame, 0.62));
  }
}

function roof(add: Add, y: number, width: number, depth: number, rise: number, kind: 'hip' | 'gable' | 'asian', color: string, close: boolean) {
  add('timber', 0, y - 0.12, 0, [width * 0.98, 0.18, depth * 0.99], shade(color, 0.52));
  add(kind, 0, y, 0, [width, rise, depth], color);
  add('tile', 0, y + rise + 0.04, 0, [0.16, width * (kind === 'gable' ? 1.02 : 0.74), 0.16], shade(color, 0.82), 0, Math.PI / 2);
  if (!close) return;
  const count = Math.min(IS_HANDHELD ? 24 : 54, Math.ceil(width / 0.22));
  const length = Math.hypot(depth * 0.5, rise);
  const pitch = Math.acos(rise / length);
  for (let i = 0; i < count; i++) {
    const t = (i + 0.5) / count - 0.5;
    const rib = shade(color, 0.72 + ((i * 71) % 17) * 0.026);
    for (const side of [-1, 1]) {
      const len = kind === 'asian' ? Math.min(0.45, length * 0.3) : length * (kind === 'hip' ? 0.84 - Math.abs(t) * 0.8 : 0.98);
      const yEave = kind === 'asian' ? (Math.abs(t * 2) ** 5 * 0.17 + 0.06) * rise : 0.04;
      const tilt = kind === 'asian' ? Math.PI * 0.5 - 0.12 : pitch;
      add('tile', t * width, y + yEave + (kind === 'asian' ? 0.015 : rise * len / length * 0.5), side * (depth * 0.5 - len * Math.sin(tilt) * 0.5), [0.11, len, 0.11], rib, -side * tilt);
    }
  }
}

function blockHouse(add: Add, width: number, height: number, depth: number, finish: Finish, top: 'hip' | 'gable' | 'asian' | 'flat', seed: number, close: boolean, shutters = false) {
  const front = depth * 0.5;
  const roofHeight = top === 'flat' ? 0.21 : height * (top === 'asian' ? 0.25 : 0.31);
  plinth(add, width + 0.14, depth + 0.11, 0.28, finish.trim);
  add('block', 0, 0.25 + height * 0.5, 0, [width, height, depth], finish.wall);
  if (top === 'flat') {
    add('block', 0, height + 0.31, 0, [width + 0.25, 0.18, depth + 0.25], shade(finish.trim, 0.94));
    add('block', 0, height + 0.57, front + 0.02, [width + 0.20, 0.4, 0.22], finish.wall);
    for (const sign of [-1, 1]) add('block', sign * width * 0.5, height + 0.53, 0, [0.22, 0.36, depth + 0.12], finish.wall);
  } else roof(add, height + 0.24, width + 0.44, depth + 0.5, roofHeight, top, finish.roof, close);
  for (const y of [0.38, height * 0.51 + 0.25]) {
    add('block', 0, y, 0, [width + 0.11, 0.15, depth + 0.13], shade(finish.trim, 0.90));
  }
  const count = width > 7.25 ? 4 : 3;
  for (let i = 0; i < count; i++) {
    const winX = ((i + 0.5) / count - 0.5) * width * 0.97;
    const door = i === Math.floor(count / 2);
    const lit = finish.lit && (i + seed) % 3 !== 1;
    casement(add, winX, height * 0.73 + 0.23, front + 0.07, Math.min(width / count * 0.48, 1.42), height * 0.24, { ...finish, lit }, shutters);
    casement(add, winX, door ? height * 0.24 : height * 0.30, front + 0.07, Math.min(width / count * (door ? 0.66 : 0.44), 1.64), height * (door ? 0.41 : 0.25), { ...finish, lit }, shutters && !door);
  }
}

function porchHouse(add: Add, width: number, depth: number, height: number, finish: Finish, eastAsia: boolean, bays = 3, flat = false) {
  const near = depth * 0.48;
  const gable = eastAsia ? 'asian' : 'hip';
  plinth(add, width + 0.7, depth + 0.36, 0.40, finish.trim);
  add('block', 0, height * 0.5 + 0.32, -depth * 0.27, [width, height, depth * 0.5], finish.wall);
  add('block', 0, 0.30, near + 0.44, [width * 0.82, 0.22, 0.55], finish.trim);
  add('block', 0, 0.11, near + 0.81, [width * 0.87, 0.18, 0.6], shade(finish.trim, 0.89));
  for (let i = 0; i <= bays; i++) {
    const px = (i / bays - 0.5) * width * 0.94;
    for (const z of [near, -near]) {
      add(eastAsia ? 'timber' : 'column', px, eastAsia ? 0.37 + height / 2 : 0.38, z, [0.36, height, 0.39], finish.frame);
      add('block', px, 0.48, z, [0.60, 0.26, 0.58], finish.trim);
      add('timber', px, height + 0.21, z, [0.71, 0.22, 0.57], shade(finish.frame, 1.16));
    }
    if (i === bays) continue;
    const gap = (i / bays - 0.5 + 0.5 / bays) * width * 0.94;
    casement(add, gap, height * 0.49 + 0.36, 0.08, width * 0.62 / bays, height * 0.74, finish);
    if (eastAsia) {
      for (let t = 0; t < 4; t++) {
        add('timber', gap + (t - 1.5) * width * 0.14 / bays, height * 0.55 + 0.26, 0.2,
          [0.09, height * 0.62, 0.1], shade(finish.frame, t % 2 ? 1.02 : 0.83));
      }
    }
  }
  add('timber', 0, height + 0.39, near - 0.14, [width + 0.18, 0.28, 0.51], finish.frame);
  if (flat) add('block', 0, height + 0.57, 0, [width + 0.36, 0.27, depth + 0.41], finish.trim);
  else roof(add, height + 0.48, width + 0.98, depth + 0.9, height * (eastAsia ? 0.51 : 0.42), gable, finish.roof, true);
}

function arcade(add: Add, width: number, height: number, depth: number, count: number, finish: Finish, band: 'plain' | 'tile' | 'tudor' = 'plain') {
  const cell = width / count;
  const face = depth / 2 - 0.14;
  const cap = height * 0.92;
  const centerY = height * 0.59;
  add('block', 0, 0.12, 0, [width, 0.24, depth], shade(finish.trim, 0.84));
  add('block', 0, height / 2, -depth / 2, [width, height, 0.38], shade(finish.wall, 0.73));
  add('block', 0, height - 0.02, 0, [width + 0.14, 0.24, depth], finish.wall);
  add('block', 0, cap, face, [width + 0.2, 0.15, 0.58], finish.trim);
  add('block', 0, height + 0.17, 0, [width + 0.36, 0.2, depth + 0.54], finish.roof);
  for (let i = 0; i < count; i++) {
    const x = (i - (count - 1) * 0.5) * cell;
    const archW = cell * 0.91;
    const head = Math.min(height * 0.86, cell * 1.25);
    add('arch', x, 0.20, face - 0.33, [archW, head, 0.47], finish.trim);
    add('arch', x, 0.20, face + 0.15, [archW * 1.03, head * 1.015, 0.15], shade(finish.trim, 1.08));
    add('block', x - cell * 0.5, height * 0.5, face, [cell * 0.125, height, 0.70], finish.wall);
    add('column', x - cell * 0.5, 0.22, face + 0.25, [cell * 0.17, centerY, 0.55], shade(finish.trim, 0.94));
    casement(add, x, centerY, -depth / 2 + 0.23, cell * 0.325, height * 0.31, finish);
    if (band === 'plain') continue;
    const rows = band === 'tile' ? 4 : 2;
    for (let r = 0; r < rows; r++) {
      for (let j = 0; j < 8; j++) {
        const step = cell / 8;
        const grout = band === 'tile' ? (r + j) % 3 : (r * 3 + j) % 3;
        const color = [finish.frame, finish.trim, shade(finish.roof, 1.33)][grout];
        add('block', x + (j - 3.5) * step, cap + 0.17 + r * 0.111, face + 0.34,
          [step * 0.72, 0.083, 0.034], color, 0, band === 'tile' ? Math.PI * 0.25 : 0);
      }
    }
  }
  add('block', width * 0.5, height * 0.5, face, [cell * 0.125, height, 0.70], finish.wall);
}

function ballroom(builder: Builder, variant: string) {
  const rococo = variant === 'luxury_ballroom';
  const linen = tint('#e9d9c3', builder.palette.primary, 0.24);
  const trim = tint('#f0e5cd', builder.palette.secondary, 0.18);
  const walnut = tint('#684a39', builder.palette.shadow, 0.30);
  const curtain = tint(variant === 'ar_tango' ? '#722932' : '#53413c', builder.palette.accent, 0.38);
  const finish: Finish = { wall: linen, trim, roof: walnut, frame: walnut, window: '#cbb296', lit: false };
  const width = 33.7;
  const ceiling = rococo ? 10.5 : 9.8;
  const frames = [
    { x: 0, z: -16.42 }, { x: 0, z: 16.42, yaw: Math.PI },
    { x: -16.42, z: 0, yaw: Math.PI / 2 }, { x: 16.42, z: 0, yaw: -Math.PI / 2 },
  ];
  for (const [face, point] of frames.entries()) {
    const add = at(builder, point);
    add('block', 0, ceiling * 0.5, -0.02, [width, ceiling, 0.47], finish.wall);
    add('timber', 0, 0.24, 0.28, [width, 0.49, 0.14], shade(walnut, 0.82));
    add('block', 0, 1.3, 0.27, [width, 0.10, 0.18], shade(trim, 0.66));
    add('block', 0, ceiling - 0.3, 0.28, [width, 0.31, 0.59], trim);
    add('block', 0, ceiling - 0.61, 0.29, [width, 0.12, 0.49], shade(trim, 0.91));
    for (let i = 0; i < 6; i++) {
      const x = (i - 2.5) * width / 6;
      add('timber', x, 0.82, 0.27, [4.51, 0.89, 0.136], shade(walnut, 0.76));
      add('timber', x, 0.82, 0.36, [4.21, 0.66, 0.035], shade(walnut, 1.13));
      add('block', x, 4.9, 0.22, [4.46, 6.1, 0.18], shade(trim, i % 2 ? 0.81 : 0.97));
      add('block', x, 4.9, 0.32, [4.14, 5.81, 0.039], shade(linen, i % 2 ? 0.88 : 1.08));
      if ((i + face) % 2 === 0) {
        const height = 5.55;
        add('arch', x, 1.89, 0.36, [3.49, height, 0.12], trim);
        add('cloth', x, 4.56, 0.55, [2.86, 5.25, 0.84], shade(curtain, 0.76 + builder.pick() * 0.26));
        add('timber', x, 7.21, 0.56, [3.28, 0.15, 0.18], walnut);
      } else {
        add('block', x, 4.39, 0.43, [0.10, 0.48, 0.12], shade(walnut, 0.76));
        add('light', x, 4.62, 0.50, [0.30, 0.40, 0.13], '#ffdfae');
        add('block', x, 4.84, 0.50, [0.35, 0.07, 0.19], '#89714e');
      }
      add('column', x - 2.75, 0.05, 0.47, [0.48, ceiling - 0.36, 0.38], trim);
    }
  }
  const add = at(builder);
  add('block', 0, ceiling + 0.17, 0, [33.45, 0.3, 33.45], shade(linen, 0.95));
  for (let row = -3; row <= 3; row++) {
    add('block', row * 4.48, ceiling - 0.09, 0, [0.28, 0.27, 33.3], trim);
    add('block', 0, ceiling - 0.09, row * 4.48, [33.3, 0.27, 0.28], trim);
    for (const offset of [-0.21, 0.21]) {
      add('block', row * 4.48 + offset, ceiling - 0.015, 0, [0.048, 0.11, 33.3], shade(walnut, 1.20));
      add('block', 0, ceiling - 0.012, row * 4.48 + offset, [33.3, 0.11, 0.048], shade(walnut, 1.20));
    }
  }
}

function courtyard(builder: Builder, variant: string) {
  const { palette } = builder;
  if (variant === 'es_andalusia') {
    andalusia(builder);
    return;
  }
  if (variant === 'jp_sakura' || variant === 'il_chuppah') {
    const temple = variant === 'jp_sakura';
    const plaster = tint(temple ? '#cabb9b' : '#bba789', palette.primary, 0.23);
    const footing = '#928a76';
    const cap = temple ? '#514e46' : '#c8b596';
    const frames: Point[] = [{ x: 0, z: -20.9 }, { x: -19.2, z: -12.8, yaw: Math.PI / 2 }];
    for (const [face, point] of frames.entries()) {
      const add = at(builder, point);
      const w = face === 0 ? 35.5 : 14.8;
      const y = temple ? 2.03 : 1.13;
      add('block', 0, 0.24, 0, [w, 0.48, 0.73], footing);
      add('block', 0, y * 0.5 + 0.39, -0.04, [w - 0.08, y - 0.13, 0.58], plaster);
      for (let i = 1; i < Math.ceil(w / 1.06); i++) {
        const x = i * 1.06 - w * 0.5;
        add('block', x, 0.26, 0.35, [1.021, 0.33, 0.082], shade(footing, 0.72 + builder.pick() * 0.45));
        if (temple) add('tile', x, y + 0.37, 0, [0.17, 0.94, 0.2], shade(cap, 0.82 + builder.pick() * 0.26), Math.PI / 2);
      }
      add('block', 0, y + 0.31, 0, [w + 0.16, 0.21, 0.88], cap);
    }
    return;
  }
  const eastAsia = ['cn_courtyard', 'kr_hanok', 'vn_gia_tien'].includes(variant);
  if (eastAsia || variant === 'ng_yoruba') {
    const vietnam = variant === 'vn_gia_tien';
    const korea = variant === 'kr_hanok';
    const china = variant === 'cn_courtyard';
    const finish: Finish = {
      wall: tint(vietnam ? '#8e7c64' : korea ? '#d6c9a6' : china ? '#8c8678' : '#9a6441', palette.primary),
      trim: tint(korea ? '#9a8d71' : '#81715f', palette.secondary),
      roof: tint(vietnam ? '#805a45' : korea ? '#3d4545' : china ? '#454140' : '#745141', palette.shadow),
      frame: tint(vietnam ? '#523525' : korea ? '#4a3524' : china ? '#734334' : '#553720', palette.accent, 0.18),
      window: '#556159',
    };
    porchHouse(at(builder, { x: 0, z: -22.4 }), vietnam ? 16.0 : 17.6, 7, vietnam ? 3.9 : 4.8, finish, eastAsia, china ? 5 : 3);
    for (const side of [-1, 1]) {
      porchHouse(at(builder, { x: side * 21.4, z: -8.7, yaw: -side * Math.PI / 2 }), 12, 6.4, 3.45, finish, eastAsia, 3);
      const wall = at(builder, { x: side * 16.87, z: -24.2 });
      wall('block', 0, 1.12, 0, [13.8, 2.23, 0.49], shade(finish.trim, 0.95));
      wall('timber', 0, 2.25, 0, [13.89, 0.14, 0.58], finish.roof);
    }
    return;
  }
  const morocco = variant === 'ma_riad';
  const iran = variant === 'ir_persian_garden';
  const wall = morocco ? '#d7c8aa' : iran ? '#c5a778' : '#c58d66';
  const accent = morocco ? '#326e72' : iran ? '#29628a' : '#78533a';
  const finish: Finish = {
    wall: tint(wall, palette.primary), trim: tint('#e3d2ad', palette.secondary, 0.19),
    roof: tint(iran ? '#8e7857' : '#804f37', palette.shadow, 0.19),
    frame: tint(accent, palette.accent, 0.19), window: '#475555',
  };
  arcade(at(builder, { x: 0, z: -22.6 }), 32.5, iran ? 7.4 : 6.1, 5.2, iran ? 7 : 8, finish, morocco || iran ? 'tile' : 'plain');
  for (const side of [-1, 1]) {
    arcade(at(builder, { x: side * 19.6, z: -9.7, yaw: -side * Math.PI / 2 }), 13.4, 4.9, 4.5, 4, finish, morocco ? 'tile' : 'plain');
    if (morocco) {
      const pots = at(builder, { x: side * 18.34, z: -19.77 });
      for (let i = 0; i < 5; i++) {
        pots('tile', 0, 0.37, -3.8 + i * 1.65, [0.53, 0.63, 0.53], shade('#a65f40', 0.78 + builder.pick() * 0.24));
        pots('tile', 0, 0.60, -3.8 + i * 1.65, [0.59, 0.13, 0.59], '#a96341');
      }
    }
  }
  if (iran) {
    const add = at(builder, { x: 0, z: -19.82 });
    add('arch', 0, 0.1, 0, [5.65, 8.78, 0.56], '#2f687b');
    add('arch', 0, 0.16, 0.59, [5.96, 9.0, 0.22], '#d7c4a0');
    for (const side of [-1, 1]) add('column', side * 3.06, 0.13, 0.83, [0.47, 6.68, 0.45], '#b2b999');
  }
}

function terraceHouse(add: Add, width: number, depth: number, height: number, plaster: string, blue: string, lit: boolean, shutters: boolean) {
  const front = depth * 0.5;
  add('plaster', 0, (height - 2.8) * 0.5, 0, [width, height + 2.8, depth], plaster);
  add('plaster', 0, height - 0.12, 0, [width + 0.20, 0.24, depth + 0.21], shade(plaster, 0.93));
  add('plaster', 0, height + 0.13, front + 0.03, [width + 0.12, 0.33, 0.20], plaster);
  const finish: Finish = { wall: plaster, trim: shade(plaster, 0.85), roof: plaster, frame: blue, window: lit ? '#ffc27d' : '#487993', lit, paintedFrames: true };
  add('plasterArch', -width * 0.23, 0.08, front - 0.02, [1.54, 2.61, 0.16], shade(plaster, 0.79));
  add('plaster', -width * 0.23, 1.15, front + 0.12, [0.91, 2.14, 0.09], shade(blue, 1.12));
  for (const side of [-1, 1]) {
    casement(add, side * width * 0.24, height * 0.74, front + 0.02, 0.79, 1.16, finish, shutters);
    add('plaster', side * width * 0.5, height + 0.13, 0, [0.18, 0.33, depth], plaster);
  }
  if (shutters) {
    const y = height * 0.74 - 0.63;
    add('plaster', width * 0.24, y, front + 0.26, [1.72, 0.15, 0.68], shade(plaster, 0.93));
    add('plaster', width * 0.24, y + 0.53, front + 0.59, [1.70, 0.045, 0.048], blue);
    for (let rail = -4; rail <= 4; rail++) {
      add('plaster', width * 0.24 + rail * 0.18, y + 0.27, front + 0.58, [0.034, 0.53, 0.035], blue);
    }
  }
  if (lit) add('light', width * 0.18, 2.11, front + 0.06, [0.32, 0.42, 0.05], '#ffd294');
}

function andalusia(builder: Builder) {
  const wall = '#f1e8d1';
  const foliage = ['#556d35', '#6e7a42', '#4b6832', '#5e7639'];
  const backdrop = at(builder, { x: 0, z: -23.5 });
  backdrop('plaster', 0, 4.04, -1.2, [32, 8.08, 4.5], wall);
  backdrop('plaster', 0, 8.12, -0.78, [32.55, 0.22, 5.7], '#e0d0ad');
  for (let bay = -3; bay <= 3; bay++) {
    const x = bay * 4.29;
    backdrop('plasterArch', x, 5.1, 1.02, [1.66, 2.72, 0.18], '#627f71');
    casement(backdrop, x, 6.39, 1.15, 1.15, 1.99, { wall, frame: '#61817b', roof: wall, trim: wall, window: '#a1b9b7' });
    backdrop('plaster', x, 5.08, 1.38, [1.79, 0.16, 0.86], '#dfcba5');
    for (let n = -3; n <= 3; n++) backdrop('timber', x + n * 0.22, 5.49, 1.79, [0.035, 0.65, 0.048], '#465f58');
    backdrop('timber', x, 5.81, 1.80, [1.56, 0.056, 0.07], '#4b6055');
    backdrop('plasterArch', x, 0.16, 1.03, [2.63, 3.62, 0.34], '#d2be95');
    backdrop('glass', x, 1.48, 1.12, [1.82, 2.70, 0.08], '#4b6255');
  }
  for (let i = 0; i < (IS_HANDHELD ? 150 : 324); i++) {
    const x = (builder.pick() - 0.5) * 31.7;
    const edge = 4.55 + 0.37 * Math.cos(x * 0.69) + 0.32 * Math.sin(x * 1.27);
    const y = 1.7 + builder.pick() * (edge - 1.4);
    const archCenter = Math.abs(x - Math.round(x / 4.29) * 4.29);
    if (archCenter < 0.92 && y < 2.94) continue;
    const spread = 0.28 + builder.pick() * 0.40;
    backdrop('ivy', x, y, 1.24 + builder.pick() * 0.15, [spread, spread * 0.86, spread * 0.37], foliage[i % foliage.length], 0, builder.pick());
  }
  for (const side of [-1, 1]) {
    const wing = at(builder, { x: side * 22.6, z: -11.75, yaw: -side * Math.PI / 2 });
    wing('plaster', 0, 2.52, -0.16, [18.7, 5.04, 0.55], '#eadcc1');
    wing('plaster', 0, 5.08, -0.10, [19.1, 0.20, 0.80], '#ccb78f');
    const pots = at(builder, { x: side * 18.34, z: -19.77 });
    for (let i = 0; i < 5; i++) {
      const z = -3.8 + i * 1.65;
      pots('basin', 0, 0.34, z, [0.72, 0.69, 0.72], '#a36344');
      pots('basin', 0, 0.64, z, [0.78, 0.11, 0.78], '#b77b58');
      for (let cluster = 0; cluster < 8; cluster++) {
        wing('ivy', -8.2 + i * 3.95 + (builder.pick() - 0.5) * 3.5, 1.65 + builder.pick() * 2.37, 0.16 + builder.pick() * 0.17,
          [0.56, 0.66, 0.4], foliage[cluster % foliage.length]);
      }
    }
  }
}

function mediterraneanTown(builder: Builder, santorini: boolean) {
  const white = ['#eee9e0', '#f6f0df', '#e3e3dc', '#efdfca', '#f3eee5'];
  const blue = ['#125d9c', '#206caa', '#16578f'];
  for (let i = 0; i < (santorini ? 17 : 10); i++) {
    const tier = santorini ? Math.floor(i / 7) : 0;
    const side = i >= 7 && !santorini;
    const x = side ? 19.9 + builder.pick() : (i % 7 - 3) * (santorini ? 5.3 : 6.1) + tier * 9;
    const z = side ? -12.4 + (i - 7) * 6.5 : -23 - tier * 7.3 - builder.pick() * 2.0;
    const elevation = santorini ? tier * 2.26 + Math.max(0, x) * 0.08 : 0;
    const add = at(builder, { x, z, elevation, yaw: side ? -Math.PI / 2 : (builder.pick() - 0.5) * 0.18 });
    terraceHouse(add, 4.6 + builder.pick() * 0.96, 4.38 + builder.pick() * 1.04, 4.45 + builder.pick() * (santorini ? 1.7 : 1.4),
      white[i % white.length], blue[i % blue.length], santorini && i % 3 !== 1, !santorini);
  }
  if (!santorini) {
    const gate = at(builder, { x: -13.2, z: -18.2 });
    gate('plasterArch', 0, 0.01, 0, [4.33, 5.11, 0.66], '#d6ba8c');
    gate('plasterArch', 0, 0.10, 0.67, [4.17, 4.96, 0.24], '#d1b483');
    return;
  }
  for (const [x, z, height] of [[0.8, -25.2, 4.8], [16.2, -36.2, 7.2]]) {
    const church = at(builder, { x, z });
    church('plaster', 0, (height - 2) * 0.5, 0, [5.1, height + 2, 5.3], '#f7ede0');
    church('basin', 0, height + 0.09, 0, [4.33, 0.60, 4.33], '#e9e2d8');
    church('glazedDome', 0, height + 0.34, 0, [4.6, 3.93, 4.6], '#245e9a');
    church('plasterArch', 0, 0.14, 2.61, [1.65, 3.47, 0.24], '#e6d4b6');
    church('light', 0, 2.0, 2.87, [0.72, 1.34, 0.04], '#ffcb83');
    church('plaster', 0, height + 2.54, 0, [0.11, 0.68, 0.11], '#e5dfc9');
    church('plaster', 0, height + 2.63, 0, [0.54, 0.11, 0.11], '#e5dfc9');
  }
  const mill = at(builder, { x: -8.6, z: -30.3, elevation: 1.2 });
  mill('basin', 0, 3.1, 0, [3.36, 6.20, 3.36], '#e4d8c5');
  mill('spire', 0, 6.02, 0, [4.0, 1.43, 4.0], '#65554b');
  for (let i = 0; i < 8; i++) {
    const angle = i * Math.PI / 4;
    mill('timber', -Math.sin(angle) * 1.47, 5.14 + Math.cos(angle) * 1.47, 1.83, [0.063, 2.94, 0.063], '#68584a', 0, angle);
  }
}

function housing(builder: Builder, variant: string, canal: boolean) {
  if (variant === 'tn_sidi_bou_said' || variant === 'gr_santorini') {
    mediterraneanTown(builder, variant === 'gr_santorini');
    return;
  }
  if (variant === 'vn_gia_tien' || variant === 'kr_hanok' || variant === 'cn_courtyard') {
    courtyard(builder, variant);
    return;
  }
  const { palette, pick } = builder;
  const china = variant === 'cn_jiangnan';
  const venice = variant === 'it_venice';
  const pastel = variant === 'cu_havana' || variant === 'it_amalfi';
  const lisbon = variant === 'pt_lisbon';
  const dubrovnik = variant === 'hr_dubrovnik';
  const night = variant === 'fr_paris' || variant === 'cz_prague';
  const varied = pastel ? ['#bd886b', '#d5b97a', '#88a283', '#c7909c', '#b7bba6'] : ['#bda484', '#cfbfa6', '#c19a89', '#b9aa91'];
  const facade = china ? '#e2ddc8' : '#c8b594';
  const row: Point[] = [];
  for (let i = 0; i < 8; i++) row.push({ x: (i - 3.5) * 6.3, z: (canal ? -30.4 : -23.0) - pick() * 2.4 });
  if (!canal) for (const side of [-1, 1]) {
    for (let i = 0; i < 2; i++) row.push({ x: side * (21.2 + pick() * 1.1), z: -8.8 + i * 7.2, yaw: -side * Math.PI / 2 });
  }
  for (const [i, point] of row.entries()) {
    const width = 4.6 + pick() * 1.55;
    const height = (china ? 4.3 : 5.35) + pick() * (pastel ? 3.2 : 2.45);
    const depth = 4.5 + pick() * 0.98;
    const add = at(builder, point);
    const finish: Finish = {
      wall: tint(china ? facade : varied[i % varied.length], palette.primary, 0.23),
      trim: tint('#d1c4aa', palette.secondary, 0.20),
      roof: tint(china ? '#55534d' : '#975645', palette.shadow, 0.28),
      frame: tint(lisbon ? '#25657d' : china ? '#4e3e30' : '#584232', palette.accent, 0.16),
      window: night ? '#f5c597' : '#6f8182', lit: night,
    };
    const roofKind = variant === 'cu_havana' ? 'flat' : china ? 'asian' : 'hip';
    blockHouse(add, width, height, depth, finish, roofKind, i, true, !china);
    if (venice || pastel || lisbon) {
      const y = height * 0.48;
      const face = depth * 0.5 + 0.34;
      const balW = width * 0.8;
      const railing = shade(finish.frame, 0.55);
      add('block', 0, y, face, [balW, 0.17, 0.85], finish.trim);
      add('timber', 0, y + 0.83, face + 0.42, [balW, 0.08, 0.07], railing);
      for (let n = 0; n <= 13; n++) {
        const x = (n / 13 - 0.5) * balW;
        add('timber', x, y + 0.43, face + 0.41, [0.035, 0.78, 0.065], railing);
      }
      for (const side of [-1, 1]) {
        add('timber', side * balW * 0.495, y + 0.83, face + 0.085, [0.07, 0.08, 0.72], railing);
      }
    }
    if (lisbon) for (let j = 0; j < 14; j++) {
      const x = (j / 13 - 0.5) * width * 0.87;
      add('block', x, height * 0.51 + 0.39, depth * 0.5 + 0.11, [0.08, 0.08, 0.03], finish.frame, 0, Math.PI / 4);
    }
  }
  if (dubrovnik) {
    const add = at(builder, { x: 0, z: -18.8 });
    add('block', 0, 1.02, 0, [42.6, 2.05, 1.48], '#a59072');
    for (let i = 0; i < 24; i++) add('block', (i - 11.5) * 1.78, 2.31, 0, [0.82, 0.60, 1.49], '#c8b697');
    for (const side of [-1, 1]) add('tile', side * 16.5, 1.81, 0, [4.58, 3.64, 4.58], '#b9a98b');
  }
  if (!canal) return;
  const bank = at(builder, { x: 0, z: -27.4 });
  const wall = china ? '#a09c88' : '#b0a288';
  bank('block', 0, -1.48, -7.75, [53.4, 2.98, 14.9], shade(wall, 0.89));
  bank('block', 0, -0.04, 0, [53.4, 1.21, 1.03], shade(wall, 0.77));
  bank('block', 0, 0.62, 0.0, [53.6, 0.24, 1.29], shade(wall, 1.07));
  for (let row = 0; row < 4; row++) for (let i = 0; i < 65; i++) {
    const x = (i - 32) * 0.78 + (row % 2) * 0.39;
    bank('block', x, 0.38 - row * 0.28, 0.53, [0.75, 0.26, 0.055], shade(wall, 0.79 + pick() * 0.29));
  }
  const bridge = at(builder, { x: variant === 'it_venice' ? 12.6 : -12.6, z: -23.44, yaw: variant === 'it_venice' ? -0.27 : 0.42 });
  bridge('arch', 0, 0.0, -1.13, [10.35, 3.62, 2.7], shade(wall, 1.11));
  bridge('arch', 0, 0.0, 1.62, [10.52, 3.72, 0.26], wall);
  for (let k = -10; k <= 10; k++) {
    const f = k / 10;
    const y = 0.45 + (1 - f * f) * 3.14;
    bridge('block', f * 5.18, y + 0.19, 0.27, [0.54, 0.26, 3.05], shade(wall, 1.12));
    for (const side of [-1, 1]) bridge('block', f * 5.18, y + 0.48, side * 1.55, [0.52, 0.55, 0.22], wall);
  }
}

function masonryTower(add: Add, height: number, width: number, wall: string, roofColor: string, pinnacle: 'khmer' | 'pagoda' | 'gothic') {
  const stages = pinnacle === 'khmer' ? 6 : pinnacle === 'pagoda' ? 5 : 4;
  const tiers = pinnacle === 'gothic' ? height * 0.49 : height * 0.67;
  add('block', 0, height * 0.15, 0, [width, height * 0.30, width], wall);
  for (let i = 0; i < stages; i++) {
    const f = i / stages;
    const w = width * (1 - f * (pinnacle === 'gothic' ? 0.24 : 0.76));
    const high = tiers * (0.24 + f) * 0.79;
    add('block', 0, height * 0.22 + high, 0, [w, tiers * 0.22, w], shade(wall, 0.92 + f * 0.17));
    add(pinnacle === 'pagoda' ? 'hip' : 'block', 0, height * 0.26 + high, 0, [w * 1.12, tiers * 0.083, w * 1.12], shade(wall, 0.78));
    if (pinnacle === 'pagoda') continue;
    for (const side of [-1, 1]) {
      add('block', side * w * 0.28, height * 0.25 + high, w * 0.48, [w * 0.12, tiers * 0.21, w * 0.14], shade(wall, 0.89));
    }
  }
  const top = pinnacle === 'gothic' ? width * 0.78 : width * 0.47;
  add(pinnacle === 'gothic' ? 'hip' : 'dome', 0, height * (pinnacle === 'gothic' ? 0.72 : 0.89), 0, [top, height * 0.24, top], roofColor);
  add('spire', 0, height * 0.96, 0, [top * 0.36, height * 0.14, top * 0.36], roofColor);
}

function shrine(builder: Builder, variant: string) {
  if (variant === 'id_bali') {
    const body = tint('#8b8574', builder.palette.primary, 0.22);
    const base = at(builder, { x: 0, z: -23.9 });
    base('block', 0, 0.22, 0, [14.7, 0.44, 6.4], shade(body, 0.81));
    for (let i = 0; i < 4; i++) {
      base('block', 0, 0.12 + i * 0.20, 3.36 - i * 0.38, [9.7 - i * 0.5, 0.23, 0.64], shade(body, 0.87 + i * 0.03));
    }
    for (const side of [-1, 1]) {
      const add = at(builder, { x: side * 3.20, z: -23.9 });
      for (let i = 0; i < 12; i++) {
        const f = i / 11;
        const w = 3.18 * (1 - f * 0.81);
        const x = -side * f * 1.06;
        const y = 0.65 + i * 0.67;
        add('block', x, y, 0, [w, 0.72, 1.91 * (1 - f * 0.55)], shade(body, 0.81 + builder.pick() * 0.30));
        add('block', x, y + 0.32, 0, [w + 0.29, 0.13, 2.11 * (1 - f * 0.51)], shade(body, 0.93 + builder.pick() * 0.28));
        add('block', x + side * w * 0.33, y, 1.01 * (1 - f * 0.50), [w * 0.30, 0.51, 0.16], shade(body, 0.74 + builder.pick() * 0.15));
      }
      add('spire', -side * 1.06, 8.32, 0, [0.62, 1.12, 0.72], shade(body, 0.75));
    }
    return;
  }
  if (variant === 'kh_temple_ruins' || variant === 'mm_bagan') {
    const khmer = variant === 'kh_temple_ruins';
    const body = tint(khmer ? '#827862' : '#996c55', builder.palette.primary, 0.23);
    const top = khmer ? '#74654f' : '#9d7351';
    const finish = { wall: body, trim: shade(body, 1.12), roof: shade(body, 0.8), frame: '#48392f', window: '#37352d' };
    arcade(at(builder, { x: 0, z: -24.0 }), 29.2, 4.8, 4.8, khmer ? 9 : 7, finish);
    for (const [i, x] of [-14.2, -9.9, 0, 9.9, 14.2].entries()) {
      const height = i === 2 ? (khmer ? 12.7 : 13.6) : i === 1 || i === 3 ? 9.63 : 6.31;
      masonryTower(at(builder, { x, z: i === 2 ? -26.7 : -28.5 }), height, i === 2 ? 6.15 : 4.2, body, top, khmer ? 'khmer' : 'pagoda');
    }
    const step = at(builder, { x: 0, z: -19.2 });
    for (let i = 0; i < 6; i++) {
      step('block', 0, 0.12 + 0.20 * i, -i * 0.36, [12.3 - i * 0.25, 0.23, 0.69], shade(body, 0.89 + i * 0.018));
      for (const side of [-1, 1]) step('block', side * 6.39, 0.21 + i * 0.19, -i * 0.36, [0.49, 0.45, 0.63], body);
    }
    return;
  }
  const laos = variant === 'la_baci';
  const thai = variant === 'th_sala';
  const finish: Finish = {
    wall: tint(laos || thai ? '#b1a175' : '#b2a791', builder.palette.primary),
    trim: tint(laos || thai ? '#b5a573' : '#91897b', builder.palette.secondary),
    roof: tint(laos ? '#774c36' : thai ? '#6a5f43' : '#56594f', builder.palette.shadow, 0.24),
    frame: tint(laos || thai ? '#926544' : '#493428', builder.palette.accent, 0.16),
    window: '#4d4e43',
  };
  const add = at(builder, { x: 0, z: -22.5 });
  porchHouse(add, laos ? 15.8 : 13.7, 7.1, laos ? 4.25 : 4.45, finish, true, 4);
  if (laos || thai) {
    roof(add, 6.32, 11.7, 5.8, 1.84, 'asian', shade(finish.roof, 1.12), true);
    roof(add, 7.67, 7.9, 4.23, 1.5, 'asian', shade(finish.roof, 1.15), true);
    add('spire', 0, 8.84, 0.0, [0.47, 1.8, 0.47], '#b99d51');
    for (const side of [-1, 1]) add('spire', side * 3.43, 8.38, 0, [0.23, 0.95, 0.23], '#b9a161');
  }
  if (variant === 'jp_shinto') for (const side of [-1, 1]) {
    const lamp = at(builder, { x: side * 7.4, z: -17.83 });
    lamp('block', 0, 0.18, 0, [0.79, 0.36, 0.72], '#8c8774');
    lamp('column', 0, 0.26, 0, [0.34, 1.05, 0.34], '#9b927f');
    lamp('block', 0, 1.37, 0, [0.64, 0.18, 0.68], '#9d9380');
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) lamp('block', sx * 0.216, 1.60, sz * 0.22, [0.11, 0.39, 0.10], '#8e8674');
    roof(lamp, 1.78, 0.79, 0.76, 0.24, 'hip', '#8b8876', false);
    lamp('tile', 0, 2.06, 0, [0.18, 0.18, 0.18], '#8d8a79');
  }
}

function palace(builder: Builder, variant: string) {
  if (variant === 'ir_persian_garden') {
    courtyard(builder, variant);
    return;
  }
  if (variant === 'vn_hue_imperial') {
    const base = tint('#9f7f60', builder.palette.primary, 0.22);
    const finish: Finish = { wall: base, trim: shade(base, 1.05), roof: '#8a6448', frame: '#803b2f', window: '#393430' };
    arcade(at(builder, { x: 0, z: -25.2 }), 39.8, 4.75, 7.9, 7, finish);
    const add = at(builder, { x: 0, z: -25.0 });
    add('block', 0, 4.75, 0, [41.2, 0.42, 8.8], shade(base, 0.89));
    add('block', 0, 6.17, 0, [16.6, 2.5, 5.1], '#b4a168');
    for (let i = 0; i < 8; i++) {
      const x = (i - 3.5) * 2.17;
      add('timber', x, 6.17, 2.68, [0.27, 2.68, 0.28], '#813e30');
      casement(add, x + 0.65, 6.24, 2.59, 0.70, 1.39, finish);
    }
    roof(add, 7.44, 18.2, 6.78, 1.75, 'asian', '#9d733a', true);
    for (const side of [-1, 1]) {
      add('block', side * 13.43, 5.22, 0.07, [9.8, 0.88, 5.13], '#a7916a');
      const wing = at(builder, { x: side * 13.43, z: -24.93 });
      roof(wing, 5.73, 10.48, 5.93, 1.17, 'asian', '#a27c42', true);
    }
    return;
  }
  const u = variant === 'in_udaipur';
  const fr = variant === 'fr_chateau';
  const germany = variant === 'de_bavaria';
  const scotland = variant === 'sc_highlands';
  const prague = variant === 'cz_prague';
  const budapest = variant === 'hu_budapest';
  const stone = tint(u ? '#eadac0' : scotland ? '#9c8b75' : '#d3c9b6', builder.palette.primary, 0.24);
  const roofColor = tint(u ? '#bca379' : fr || germany || prague ? '#4a5560' : '#7b6353', builder.palette.shadow, 0.19);
  const finish = { wall: stone, trim: shade(stone, 1.13), roof: roofColor, frame: '#665648', window: u ? '#617778' : '#6d7773', lit: prague || budapest };
  const z = u ? -31.7 : -26.5;
  const wide = u || fr || budapest ? 37.0 : 25.4;
  const withTowers = fr || germany || prague || budapest;
  arcade(at(builder, { x: 0, z }), wide, 6.12, 5.5, Math.round(wide / 4.0), finish);
  for (let i = 0; i < 3; i++) {
    const x = (i - 1) * wide / 3.03;
    const add = at(builder, { x, z: z - 2.8 });
    blockHouse(add, wide / 3.03 + 0.37, (i === 1 ? 9.2 : 7.13), 4.9 + (i % 2) * 0.57, finish, u || budapest ? 'flat' : 'hip', i, true);
    if (u || budapest) {
      const w = i === 1 ? 5.0 : 3.19;
      const y = i === 1 ? 9.4 : 7.25;
      add('tile', 0, y + 0.43, 0, [w, 0.88, w], stone);
      add('dome', 0, y + 0.89, 0, [w * 1.08, w * (budapest ? 1.45 : 0.91), w * 1.08], budapest ? '#a66454' : '#e1caa5');
      add('spire', 0, y + 0.9 + w * (budapest ? 0.70 : 0.44), 0, [0.42, 1.07, 0.42], budapest ? '#875444' : '#b79a5e');
    }
  }
  for (const side of [-1, 1]) {
    const x = side * wide * 0.51;
    const add = at(builder, { x, z: z - 0.55 });
    if (withTowers) {
      const height = fr ? 10.9 : germany ? 15.1 : 11.6;
      add('tile', 0, height * 0.42, 0, [4.85, height * 0.84, 4.85], stone);
      add('tile', 0, height * 0.83, 0, [5.03, 0.4, 5.03], shade(stone, 1.08));
      add('spire', 0, height * 0.84, 0, [5.18, fr ? 3.77 : 4.85, 5.18], roofColor);
      add('spire', 0, height * 0.84 + (fr ? 3.66 : 4.69), 0, [0.42, 0.74, 0.42], '#a18960');
      casement(add, 0, height * 0.58, 2.47, 0.66, 1.48, finish);
    } else if (scotland) {
      const wall = at(builder, { x: side * 8.4, z: z + 5.7 });
      wall('block', 0, 0.66, 0, [7.6, 1.34, 0.63], shade(stone, 0.76));
      for (let i = 0; i < 6; i++) wall('block', (i - 2.5) * 1.22, 1.62, 0, [0.57, 0.55, 0.66], stone);
    }
  }
}

function villa(builder: Builder, variant: string) {
  const ghana = variant === 'gh_kente';
  const french = variant === 'fr_provence' || variant === 'uk_garden';
  const spanish = variant === 'it_amalfi' || variant === 'mx_hacienda';
  const finish: Finish = {
    wall: tint(ghana ? '#dfd7bd' : french ? '#c0ad8a' : '#d9ccb1', builder.palette.primary, 0.24),
    trim: tint('#d0bfa3', builder.palette.secondary, 0.28),
    roof: tint(ghana ? '#8a473f' : '#985e47', builder.palette.shadow, 0.20),
    frame: tint('#514536', builder.palette.accent, 0.21),
    window: '#53625b',
  };
  const add = at(builder, { x: french ? -11.65 : 0, z: french ? -29.6 : -25.2, yaw: french ? 0.17 : 0 });
  blockHouse(add, ghana ? 15.1 : 16.8, 6.86, 8.34, finish, 'hip', 2, true, true);
  if (ghana || spanish) {
    const loggia = at(builder, { x: 0, z: -20.32 });
    arcade(loggia, spanish ? 13.3 : 7.3, 3.45, 2.75, spanish ? 6 : 3, finish);
  }
  for (const side of [-1, 1]) {
    const px = side * (ghana ? 12.9 : 16.1);
    blockHouse(at(builder, { x: px, z: -28.2, yaw: -side * 0.10 }), 7.35, 4.73, 6.4, finish, 'hip', 4, true, true);
    if (french || spanish) {
      const wall = at(builder, { x: px, z: -18.68 - builder.pick() * 0.7 });
      wall('block', 0, 0.49, 0, [7.6, 0.98, 0.56], shade(finish.trim, 0.77));
      wall('block', 0, 0.92, 0, [7.68, 0.18, 0.72], shade(finish.trim, 1.03));
    }
  }
}

function chapelOrBarn(builder: Builder, variant: string, barn: boolean) {
  const vegas = variant === 'us_vegas';
  const napa = variant === 'us_napa';
  const finish: Finish = {
    wall: tint(napa ? '#855a47' : barn ? '#a35141' : '#e8dfcc', builder.palette.primary, 0.17),
    trim: '#d4cbbb', roof: tint(napa ? '#79594b' : barn ? '#595854' : '#61687a', builder.palette.shadow, 0.18),
    frame: barn ? '#e0ceb1' : '#5c4d47', window: vegas ? '#ffdcbc' : '#627679', lit: vegas,
  };
  const x = barn ? -11.78 : 0;
  const z = barn ? -23.73 : -23.83;
  const add = at(builder, { x, z });
  const width = barn ? 11.9 : 8.55;
  const depth = barn ? 10.05 : 8.43;
  const high = barn ? 5.37 : 5.24;
  const front = depth * 0.5;
  plinth(add, width + 0.22, depth + 0.19, 0.34, '#a09985');
  add('block', 0, high * 0.5 + 0.31, 0, [width, high, depth], finish.wall);
  roof(add, high + 0.29, width + 0.67, depth + 0.63, barn ? 3.63 : 2.98, 'gable', finish.roof, true);
  if (barn) {
    for (let i = 0; i < 44; i++) {
      const slot = (i - 21.5) * width / 44;
      for (const side of [-1, 1]) {
        const color = shade(finish.wall, 0.70 + builder.pick() * 0.60);
        add('timber', slot, high * 0.5 + 0.31, side * (front + 0.025), [width / 44 * 0.97, high, 0.055], color);
        const depthSlot = (i - 21.5) * depth / 44;
        add('timber', side * (width * 0.5 + 0.03), high * 0.5 + 0.31, depthSlot, [0.073, high, depth / 44 * 0.965], color);
      }
    }
    add('timber', 0, 2.38, front + 0.087, [4.29, 4.22, 0.129], shade(finish.wall, 0.61));
    for (const side of [-1, 1]) {
      add('timber', side * 1.02, 2.39, front + 0.17, [0.097, 4.43, 0.06], finish.trim, 0, -side * 0.44);
      add('timber', side * 2.18, 2.37, front + 0.18, [0.145, 4.17, 0.08], finish.trim);
    }
    lintel(add, 0, 4.53, front + 0.11, 4.0, 'timber', finish.trim);
    casement(add, -4.2, 2.73, front + 0.078, 1.22, 1.34, finish);
    casement(add, 4.2, 2.73, front + 0.078, 1.22, 1.34, finish);
    return;
  }
  add('timber', 0, 1.96, front + 0.19, [1.56, 3.36, 0.18], '#6c523c');
  add('arch', 0, 0.30, front + 0.26, [2.23, 4.12, 0.22], '#c2b298');
  for (const side of [-1, 1]) {
    casement(add, side * 2.89, 2.98, front + 0.076, 0.91, 2.07, finish);
    add('arch', side * 2.89, 1.81, front + 0.14, [1.29, 2.62, 0.15], '#c2b298');
  }
  add('block', 0, 6.76, 0.38, [2.05, 2.72, 1.92], finish.wall);
  add('glass', 0, 7.16, 1.36, [0.37, 1.15, 0.071], '#514947');
  add('spire', 0, 8.04, 0.35, [2.49, 2.25, 2.41], finish.roof);
  add('timber', 0, 10.54, 0.35, [0.075, 0.58, 0.086], '#d5c1a1');
  add('timber', 0, 10.56, 0.35, [0.44, 0.061, 0.081], '#d5c1a1');
}

function pavilion(builder: Builder, variant: string) {
  if (variant === 'th_sala' || variant === 'la_baci') {
    shrine(builder, variant);
    return;
  }
  if (variant === 'vn_da_lat') {
    const add = at(builder, { x: -11.8, z: -24.6, yaw: 0.37 });
    const w = 10.05, d = 8.8, h = 4.5;
    plinth(add, w + 0.35, d + 0.23, 0.22, '#a3a194');
    add('gable', 0, h + 0.19, 0, [w + 0.18, 2.36, d + 0.19], '#809b98');
    for (const side of [-1, 1]) {
      const z = side * d * 0.5;
      add('glass', 0, h * 0.5 + 0.19, z, [w, h, 0.063], '#a0b6ac');
      add('glass', side * w * 0.5, h * 0.5 + 0.19, 0, [0.068, h, d], '#a0b6ac');
      for (let i = 0; i < 8; i++) {
        add('timber', (i / 7 - 0.5) * w, h * 0.5 + 0.21, z + side * 0.032, [0.087, h, 0.091], '#416458');
        add('timber', side * (w * 0.5 + 0.035), h * 0.5 + 0.21, (i / 7 - 0.5) * d, [0.087, h, 0.091], '#416458');
        add('tile', (i / 7 - 0.5) * w, h + 1.41, z * 0.5, [0.093, 4.98, 0.093], '#4c6e61', -side * 1.08);
      }
    }
    for (const y of [0.22, 2.04, h + 0.21]) {
      add('timber', 0, y, 0, [w + 0.2, 0.105, d + 0.21], '#416458');
    }
    return;
  }
  const polynesia = variant === 'ws_fale' || variant === 'pf_bora_bora' || variant === 'jm_caribbean';
  const finish: Finish = {
    wall: tint('#c5ae89', builder.palette.primary, 0.17), trim: '#a49478',
    roof: tint(polynesia ? '#685c44' : '#7e543c', builder.palette.shadow, 0.21),
    frame: tint('#583f30', builder.palette.accent, 0.16), window: '#7b7a68',
  };
  const center = { x: polynesia ? -11.8 : 0, z: polynesia ? -22.8 : -24.3 };
  const add = at(builder, center);
  const width = polynesia ? 8.7 : 14.5;
  const height = polynesia ? 3.83 : 4.23;
  const depth = polynesia ? 6.65 : 8.1;
  plinth(add, width + 0.2, depth + 0.24, polynesia ? 0.55 : 0.62, finish.trim);
  for (let i = 0; i <= 4; i++) {
    const x = (i / 4 - 0.5) * width * 0.9;
    for (const side of [-1, 1]) {
      add('timber', x, height * 0.5 + 0.55, side * depth * 0.45, [0.31, height, 0.35], finish.frame, 0, (i - 2) * 0.008);
      add('timber', x, height + 0.48, side * depth * 0.45, [0.59, 0.24, 0.55], shade(finish.frame, 0.61));
      add('block', x, 0.63, side * depth * 0.45, [0.57, 0.23, 0.55], finish.trim);
    }
  }
  roof(add, height + 0.57, width + 0.98, depth + 0.94, polynesia ? 2.6 : 2.91, 'hip', finish.roof, true);
  if (polynesia) {
    for (let i = 0; i < 36; i++) {
      const x = (i / 35 - 0.5) * (width + 0.88);
      const y = height + 0.41 + builder.pick() * 0.22;
      add('timber', x, y, (depth + 0.9) * 0.5, [0.097, 0.22 + builder.pick() * 0.20, 0.16], shade(finish.roof, 0.73 + builder.pick() * 0.29), 0, (builder.pick() - 0.5) * 0.42);
    }
  } else roof(add, height + 2.40, width * 0.52, depth * 0.63, 1.63, 'asian', shade(finish.roof, 1.05), true);
}

function eiffel(builder: Builder) {
  const add = at(builder, { x: -12.85, z: -54.1 });
  const metal = '#977755';
  const glow = '#f4b564';
  const levels = [{ y: 0, w: 6.8 }, { y: 7.2, w: 4.38 }, { y: 15.3, w: 2.56 }, { y: 26.4, w: 1.03 }];
  for (let i = 0; i < 3; i++) {
    const a = levels[i], b = levels[i + 1];
    const y = (a.y + b.y) * 0.5;
    const w = (a.w + b.w) * 0.5;
    const rise = b.y - a.y;
    const shift = (a.w - b.w) / rise;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      add('timber', sx * w, y, sz * w, [0.33, rise * 1.16, 0.32], metal, -sz * Math.atan(shift), sx * Math.atan(shift));
      for (let j = 1; j < 7; j++) {
        const f = j / 7;
        const px = THREE.MathUtils.lerp(a.w, b.w, f);
        add('light', sx * px, a.y + rise * f, sz * px + 0.18, [0.09, 0.11, 0.09], glow);
        add('timber', 0, a.y + rise * f, sz * px, [px * 2, 0.085, 0.10], shade(metal, 0.76));
      }
    }
    add('timber', 0, b.y, 0, [b.w * 2.46, 0.34, b.w * 2.46], '#725848');
  }
  add('arch', 0, 0.34, 5.1, [11.5, 6.85, 0.14], shade(metal, 0.82));
  add('spire', 0, 25.90, 0, [1.07, 5.6, 1.07], metal);
  add('light', 0, 30.8, 0, [0.18, 0.32, 0.18], '#fff7d9');
}

function sydney(builder: Builder) {
  const add = at(builder, { x: -10.0, z: -36.6, yaw: -0.30 });
  add('plaster', 0, -0.35, 0, [20.6, 2.0, 10.7], '#9a8268');
  add('plaster', 0, 1.10, -0.9, [18.2, 1.27, 7.6], '#c1a27b');
  for (let step = 0; step < 5; step++) {
    add('plaster', 0, 0.48 + step * 0.23, 4.12 - step * 0.48, [16.9, 0.25, 1.53], '#d9c29f');
  }
  for (const [x, z, run, rise, span] of [[-6.8, 0.4, 6.6, 4.9, 3.6], [-3.4, -0.13, 7.4, 7.3, 4.3], [0.19, -0.36, 7.8, 8.9, 4.7], [3.38, -0.67, 7.17, 7.3, 4.0], [6.75, -1.04, 5.81, 5.66, 3.27], [-4.1, -3.15, 6.4, 6.1, 3.6], [0.12, -3.5, 7.2, 8.2, 4.21], [4.5, -3.8, 7.3, 7.5, 3.8]]) {
    add('sail', x, 1.70, z, [run, rise, span], '#f4e8d1');
    add('plaster', x, 2.12, z, [2.31, 0.89, span * 0.66], '#bbb1a3');
    for (let bay = -3; bay <= 3; bay++) {
      add('glass', x + bay * 0.295, 2.16, z + span * 0.339, [0.27, 0.70, 0.036], '#645546');
      add('light', x + bay * 0.295, 1.84, z + span * 0.352, [0.22, 0.042, 0.032], '#eec98f');
    }
  }
  for (let i = 0; i < 15; i++) {
    add('light', (i - 7) * 1.10, 0.93, 4.71, [0.42, 0.092, 0.075], '#ffd59a');
  }
  const bridge = at(builder, { x: 9.8, z: -61.2, yaw: -0.05 });
  const arch = (x: number) => 6.35 + 11.0 * Math.sqrt(Math.max(0, 1 - (x / 22.0) ** 2));
  const beam = (x1: number, y1: number, x2: number, y2: number, z: number, width: number, color: string) =>
    bridge('plaster', (x1 + x2) / 2, (y1 + y2) / 2, z, [width, Math.hypot(x2 - x1, y2 - y1) + 0.025, width], color, 0, -Math.atan2(x2 - x1, y2 - y1));
  bridge('plaster', 0, 6.06, -1.83, [47.6, 0.53, 4.65], '#697681');
  for (const z of [0, -3.6]) {
    for (let i = 0; i < 28; i++) {
      const x1 = (i - 14) * 1.53;
      const x2 = x1 + 1.53;
      const y1 = arch(x1);
      const y2 = arch(x2);
      beam(x1, y1, x2, y2, z, 0.23, '#89949f');
      beam(x1, y1 - 0.72, x2, y2 - 0.72, z, 0.15, '#6c7a86');
      beam(x1, y1 - 0.72, x2, y2, z, 0.105, '#778691');
      beam(x1, 6.32, x1, y1 - 0.67, z, 0.093, '#7f8990');
      if (z === 0) bridge('light', x1, 6.28, z + 0.24, [0.14, 0.077, 0.065], '#ffcc90');
    }
  }
  for (const side of [-1, 1]) {
    bridge('plaster', side * 22.4, 3.42, -1.76, [2.96, 9.57, 5.1], '#b9a68b');
    bridge('plaster', side * 22.4, 8.31, -1.76, [3.28, 0.33, 5.35], '#ac9980');
  }
}

function skyline(builder: Builder, variant: string) {
  if (variant === 'au_sydney') {
    sydney(builder);
    return;
  }
  if (variant === 'hu_budapest' || variant === 'cz_prague') {
    palace(builder, variant);
    return;
  }
  if (variant === 'fr_paris') {
    eiffel(builder);
    housing(builder, variant, false);
    return;
  }
  const night = ['vn_saigon_rooftop', 'hk_harbour', 'us_nyc_rooftop', 'sg_garden', 'us_vegas'].includes(variant);
  const vietnam = variant === 'vn_saigon_rooftop';
  const newYork = variant === 'us_nyc_rooftop';
  const singapore = variant === 'sg_garden';
  const towers = IS_HANDHELD ? 21 : 31;
  for (let i = 0; i < towers; i++) {
    const front = i < 15;
    const x = (i % 15 - 7) * (front ? 7.84 : 8.32) + builder.pick() * 3.9;
    const z = -(front ? 42 : 61) - builder.pick() * 12.0;
    const isIcon = i === 8 || (i === 4 && singapore);
    const h = isIcon ? 34.9 + builder.pick() * 8.2 : (front ? 7.5 : 12.0) + builder.pick() * (front ? 15.5 : 13.0);
    const w = (isIcon ? 5.3 : 4.22) + builder.pick() * 1.83;
    const d = w * (0.75 + builder.pick() * 0.45);
    const tone = tint(shade('#5a7179', 0.54 + builder.pick() * 0.43), builder.palette.shadow, 0.31);
    const add = at(builder, { x, z, yaw: (builder.pick() - 0.5) * 0.14 });
    add('block', 0, h * 0.45, 0, [w, h * 0.90, d], tone);
    add('block', 0, h * 0.935, 0, [w * 0.87, h * 0.11, d * 0.83], shade(tone, 1.25));
    add('block', 0, h * 1.012, 0, [w * 0.41, h * 0.068, d * 0.46], tone);
    if (isIcon) {
      if (vietnam) {
        add('tile', w * 0.68, h * 0.64, 0, [w * 0.95, 0.36, w * 0.95], '#68818a');
        add('tile', w * 0.68, h * 0.646, 0, [w * 0.87, 0.29, w * 0.87], '#a3aaa0');
      }
      if (newYork || variant === 'hk_harbour') {
        add('block', 0, h * 1.09, 0, [w * 0.26, h * 0.10, d * 0.29], shade(tone, 1.32));
        add('spire', 0, h * 1.12, 0, [w * 0.09, 4.7, w * 0.11], '#b2b0a3');
      }
    }
    const levels = Math.ceil(h / (IS_HANDHELD ? 2.53 : 1.96));
    const lines = (night ? 4 : 3);
    for (let level = 1; level < levels; level++) for (let col = 0; col < lines; col++) {
      const fx = (col + 0.5) / lines - 0.5;
      const y = level / levels * h * 0.90;
      const lit = night && builder.pick() > 0.42;
      const window = lit ? (builder.pick() < 0.42 ? '#c6d2c9' : '#e9bd8c') : shade('#637d85', 0.45 + builder.pick() * 0.37);
      for (const side of [-1, 1]) {
        add(lit ? 'light' : 'glass', fx * w * 0.91, y, side * (d * 0.5 + 0.019), [w / lines * 0.73, 0.55, 0.047], window);
        if (front && !IS_HANDHELD) add(lit ? 'light' : 'glass', side * (w * 0.5 + 0.022), y, fx * d * 0.88, [0.046, 0.57, d / lines * 0.68], window);
      }
    }
  }
  if (singapore) for (const [i, x] of [-11.7, 3.2, 13.0].entries()) {
    const add = at(builder, { x, z: -25.8 - i * 1.4 });
    const y = 8.2 + i * 0.65;
    const rose = '#954f69';
    add('tile', 0, y * 0.38, 0, [1.45, y * 0.78, 1.45], '#685456');
    add('tile', 0, y + 0.18, 0, [7.18, 0.32, 7.18], '#7a5066');
    for (let j = 0; j < 12; j++) {
      const a = (j / 12) * 2 * Math.PI;
      const put = at(builder, { x: x + Math.cos(a) * 2.21, z: -25.8 - i * 1.4 + Math.sin(a) * 2.21, yaw: -a });
      put('timber', 0, y - 1.02, 0, [0.11, 3.86, 0.12], rose, 0, -0.78);
      put('light', 1.26, y + 0.37, 0, [0.34, 0.10, 0.10], '#d3a6ce');
    }
  }
  if (variant === 'us_vegas') chapelOrBarn(builder, variant, false);
}

const STONE = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.89, normalMap: detailNormal('stone'), roughnessMap: detailRoughness('stone'), normalScale: new THREE.Vector2(0.29, 0.29) });
const TILE_MATERIAL = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.82, normalMap: detailNormal('stone'), normalScale: new THREE.Vector2(0.23, 0.23), side: THREE.DoubleSide });
const CLOTH = fabric('#ffffff', 'velvet');
const PORCELAIN_TILE = painted('#ffffff', 0.78).clone();
PORCELAIN_TILE.side = THREE.DoubleSide;
PORCELAIN_TILE.onBeforeCompile = (shader) => {
  shader.vertexShader = 'varying vec2 vShellUv;\n' + shader.vertexShader
    .replace('#include <uv_vertex>', '#include <uv_vertex>\nvShellUv = uv;');
  shader.fragmentShader = 'varying vec2 vShellUv;\n' + shader.fragmentShader
    .replace('#include <color_fragment>', `#include <color_fragment>
      vec2 repeat = vShellUv * vec2(44.0, 32.0);
      vec2 seam = abs(fract(repeat) - 0.5);
      float visible = 1.0 - clamp(max(fwidth(repeat.x), fwidth(repeat.y)), 0.0, 1.0);
      diffuseColor.rgb *= 1.0 - 0.19 * smoothstep(0.455, 0.5, max(seam.x, seam.y)) * visible;
    `);
};
const PLASTER = new THREE.MeshStandardMaterial({
  roughness: 0.92, normalMap: detailNormal('micro'), normalScale: new THREE.Vector2(0.17, 0.17),
  emissive: '#f4eadd', emissiveIntensity: 0.035,
});
const GLAZE = new THREE.MeshStandardMaterial({ roughness: 0.57, normalMap: detailNormal('micro'), normalScale: new THREE.Vector2(0.21, 0.21) });
const BASIN = new THREE.CylinderGeometry(0.5, 0.43, 1, 32);
function ivySpray() {
  const pick = seeded(12419);
  const positions: number[] = [];
  const indices: number[] = [];
  for (let n = 0; n < 25; n++) {
    const angle = pick() * Math.PI * 2;
    const distance = Math.sqrt(pick()) * 0.76;
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;
    const z = (1 - distance) * 0.31 + pick() * 0.38;
    const leaf = 0.13 + pick() * 0.15;
    const dx = Math.cos(angle) * leaf;
    const dy = Math.sin(angle) * leaf;
    const start = positions.length / 3;
    positions.push(x - dx * 0.6, y - dy * 0.6, z, x - dy * 0.66, y + dx * 0.66, z - 0.055,
      x + dx * 0.28, y + dy * 0.28, z + 0.055, x + dx, y + dy, z - 0.018, x + dy * 0.66, y - dx * 0.66, z - 0.025);
    indices.push(start, start + 1, start + 2, start + 1, start + 3, start + 2,
      start + 3, start + 4, start + 2, start + 4, start, start + 2);
  }
  const mesh = new THREE.BufferGeometry();
  mesh.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  mesh.setIndex(indices);
  mesh.computeVertexNormals();
  return mesh;
}

const IVY = ivySpray();
const IVY_MATERIAL = new THREE.MeshStandardMaterial({ roughness: 0.88, side: THREE.DoubleSide });

const SURFACES: Record<Geometry, [THREE.BufferGeometry, THREE.Material]> = {
  block: [BOX, STONE], timber: [BOX, wood('#ffffff', 0.12)], arch: [ARCH, STONE], hip: [HIP, TILE_MATERIAL],
  gable: [GABLE, TILE_MATERIAL], asian: [ASIAN, TILE_MATERIAL], tile: [TILE, TILE_MATERIAL], column: [COLUMN, STONE],
  spire: [SPIRE, TILE_MATERIAL], dome: [DOME, TILE_MATERIAL], glass: [BOX, WINDOW], light: [BOX, LIT_WINDOW],
  cloth: [CURTAIN, CLOTH], sail: [SAIL, PORCELAIN_TILE],
  plaster: [BOX, PLASTER], plasterArch: [ARCH, PLASTER], glazedDome: [DOME, GLAZE], basin: [BASIN, PLASTER],
  ivy: [IVY, IVY_MATERIAL],
};

/** Walkable display remains clear inside the hall's 30 m footprint. The surroundings are solid and orbitable. */
export function PhotoArchitecture({ style, seed, variant, palette }: { style: ArchitectureStyle; seed: number; variant: string; palette: Palette }) {
  const { primary, secondary, accent, shadow } = palette;
  const stonePhoto = usePhSurface('stone', 4);
  const tilePhoto = usePhSurface('tile', 3);
  const woodPhoto = usePhSurface('wood', 3);

  const surfaces = useMemo<Record<Geometry, [THREE.BufferGeometry, THREE.Material]>>(() => {
    const stoneMat = STONE.clone();
    if (stonePhoto) {
      stoneMat.map = stonePhoto.map;
      stoneMat.normalMap = stonePhoto.normalMap;
      stoneMat.roughnessMap = stonePhoto.roughnessMap;
    }
    const tileMat = TILE_MATERIAL.clone();
    if (tilePhoto) {
      tileMat.map = tilePhoto.map;
      tileMat.normalMap = tilePhoto.normalMap;
      tileMat.roughnessMap = tilePhoto.roughnessMap;
    }
    const timberMat = wood('#ffffff', 0.16).clone();
    if (woodPhoto) {
      timberMat.map = woodPhoto.map;
      timberMat.normalMap = woodPhoto.normalMap;
      timberMat.roughnessMap = woodPhoto.roughnessMap;
    }
    return {
      ...SURFACES,
      block: [BOX, stoneMat],
      timber: [BOX, timberMat],
      arch: [ARCH, stoneMat],
      hip: [HIP, tileMat],
      gable: [GABLE, tileMat],
      asian: [ASIAN, tileMat],
      tile: [TILE, tileMat],
      column: [COLUMN, stoneMat],
      spire: [SPIRE, tileMat],
      dome: [DOME, tileMat],
    };
  }, [stonePhoto, tilePhoto, woodPhoto]);

  const parts = useMemo(() => {
    const builder: Builder = { parts: {}, pick: seeded(seed), palette: { primary, secondary, accent, shadow } };
    switch (style) {
      case 'ballroom': ballroom(builder, variant); break;
      case 'shrine': shrine(builder, variant); break;
      case 'courtyard': courtyard(builder, variant); break;
      case 'old-town':
        if (variant === 'fr_paris') eiffel(builder);
        housing(builder, variant, false);
        break;
      case 'canal': housing(builder, variant, true); break;
      case 'palace': palace(builder, variant); break;
      case 'villa': villa(builder, variant); break;
      case 'chapel': chapelOrBarn(builder, variant, false); break;
      case 'barn': chapelOrBarn(builder, variant, true); break;
      case 'skyline': skyline(builder, variant); break;
      case 'pavilion': pavilion(builder, variant); break;
      case 'heritage':
        if (variant === 'vn_gia_tien' || variant === 'kr_hanok' || variant === 'ng_yoruba') courtyard(builder, variant);
        else shrine(builder, variant);
        break;
    }
    return builder.parts;
  }, [style, seed, variant, primary, secondary, accent, shadow]);

  // Photo-scanned Poly Haven 3D props tailored to every single one of the 12 architecture styles
  const scannedSets = useMemo(() => {
    const out: Array<{ id: string; items: ScatterItem[]; height: number; handheld?: boolean }> = [];
    const perimeterSpots: ScatterItem[] = [
      { position: [-15.6, 0, -12], rotationY: 0.4, scale: 1 },
      { position: [15.6, 0, -12], rotationY: -0.4, scale: 1 },
      { position: [-15.6, 0, 0], rotationY: 1.2, scale: 1.05 },
      { position: [15.6, 0, 0], rotationY: -1.2, scale: 1.05 },
      { position: [-15.6, 0, 12], rotationY: 2.1, scale: 0.95 },
      { position: [15.6, 0, 12], rotationY: -2.1, scale: 0.95 },
    ];
    const benchSpots: ScatterItem[] = [
      { position: [-15.8, 0, -6], rotationY: Math.PI / 2, scale: 1 },
      { position: [15.8, 0, -6], rotationY: -Math.PI / 2, scale: 1 },
      { position: [-15.8, 0, 6], rotationY: Math.PI / 2, scale: 1 },
      { position: [15.8, 0, 6], rotationY: -Math.PI / 2, scale: 1 },
    ];
    const lampSpots: ScatterItem[] = [
      { position: [-16.2, 0, -14], rotationY: 0, scale: 1 },
      { position: [16.2, 0, -14], rotationY: Math.PI, scale: 1 },
      { position: [-16.2, 0, -3], rotationY: 0, scale: 1 },
      { position: [16.2, 0, -3], rotationY: Math.PI, scale: 1 },
      { position: [-16.2, 0, 8], rotationY: 0, scale: 1 },
      { position: [16.2, 0, 8], rotationY: Math.PI, scale: 1 },
    ];

    if (style === 'ballroom') {
      out.push({
        id: variant === 'luxury_ballroom' ? 'Chandelier_01' : variant === 'ar_tango' ? 'Chandelier_03' : 'Chandelier_02',
        height: 2.1,
        items: [
          { position: [-6.5, 7.3, -6], rotationY: 0, scale: 1 },
          { position: [6.5, 7.3, -6], rotationY: 0.8, scale: 1 },
          { position: [-6.5, 7.3, 5], rotationY: 1.6, scale: 1 },
          { position: [6.5, 7.3, 5], rotationY: 2.4, scale: 1 },
        ],
      });
      out.push({ id: 'potted_plant_01', height: 1.7, handheld: true, items: perimeterSpots.slice(0, 4) });
      out.push({ id: 'potted_plant_02', height: 1.5, items: perimeterSpots.slice(2, 6) });
    } else if (style === 'shrine' || style === 'heritage' || style === 'courtyard') {
      const eastAsian = ['vn_gia_tien', 'vn_hue_imperial', 'jp_shinto', 'jp_sakura', 'jp_ryokan_autumn', 'kr_hanok', 'cn_courtyard'].includes(variant);
      out.push({
        id: eastAsian ? 'chinese_chandelier' : 'wooden_lantern_01',
        height: 0.95,
        handheld: true,
        items: [
          { position: [-8.5, 3.8, -15.5], rotationY: 0, scale: 1 },
          { position: [8.5, 3.8, -15.5], rotationY: 0.6, scale: 1 },
          { position: [-15.5, 3.6, -6], rotationY: 1.57, scale: 0.95 },
          { position: [15.5, 3.6, -6], rotationY: -1.57, scale: 0.95 },
        ],
      });
      out.push({ id: 'potted_plant_02', height: 1.45, handheld: true, items: perimeterSpots.slice(0, 4) });
      out.push({ id: 'planter_box_01', height: 0.78, items: benchSpots.slice(0, 2) });
      out.push({ id: 'painted_wooden_bench', height: 0.88, items: benchSpots.slice(2, 4) });
    } else if (style === 'old-town' || style === 'canal' || style === 'skyline') {
      out.push({ id: 'street_lamp_01', height: 3.6, handheld: true, items: lampSpots });
      out.push({ id: 'planter_box_01', height: 0.8, handheld: true, items: perimeterSpots });
      out.push({ id: 'painted_wooden_bench', height: 0.88, items: benchSpots });
      out.push({ id: 'potted_plant_04', height: 1.2, items: perimeterSpots.slice(0, 4) });
    } else if (style === 'palace' || style === 'villa' || style === 'chapel') {
      out.push({ id: 'street_lamp_01', height: 3.5, handheld: true, items: lampSpots.slice(0, 4) });
      out.push({ id: 'potted_plant_01', height: 1.75, handheld: true, items: perimeterSpots.slice(0, 4) });
      out.push({ id: 'planter_box_01', height: 0.82, items: perimeterSpots.slice(2, 6) });
      out.push({ id: 'painted_wooden_bench', height: 0.9, items: benchSpots });
    } else {
      // pavilion & barn
      out.push({
        id: style === 'barn' ? 'lantern_chandelier_01' : 'Lantern_01',
        height: style === 'barn' ? 1.25 : 0.75,
        handheld: true,
        items: [
          { position: [-6, 4.4, -14.8], rotationY: 0, scale: 1 },
          { position: [6, 4.4, -14.8], rotationY: 1.1, scale: 1 },
          { position: [-14.8, 4.2, 0], rotationY: 1.57, scale: 1 },
          { position: [14.8, 4.2, 0], rotationY: -1.57, scale: 1 },
        ],
      });
      out.push({ id: 'planter_box_01', height: 0.8, handheld: true, items: perimeterSpots.slice(0, 4) });
      out.push({ id: 'potted_plant_04', height: 1.25, items: perimeterSpots.slice(2, 6) });
      out.push({ id: 'painted_wooden_bench', height: 0.88, items: benchSpots.slice(0, 2) });
    }
    return out;
  }, [style, variant]);

  return (
    <group name={`photo-architecture-${style}`} dispose={null}>
      {variant === 'es_andalusia' && <AndalusiaFountain />}
      {Object.entries(parts).map(([kind, pieces]) => {
        const [geometry, material] = surfaces[kind as Geometry];
        return <InstancedSet key={kind} geometry={geometry} material={material} items={pieces} castShadow={false} />;
      })}
      {scannedSets.map((s) => (
        <PhScatter key={s.id} id={s.id} items={s.items} height={s.height} handheld={s.handheld} castShadow={!IS_HANDHELD} />
      ))}
    </group>
  );
}

