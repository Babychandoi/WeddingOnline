'use client';

/**
 * Trees the way real-time engines make them look real: bark trunks with branches into a
 * canopy of alpha-cut leaf cards (hundreds of leaves drawn on each card), lit as one soft
 * volume and swaying in the wind. Conifers use drooping needle tiers, palms use arching
 * fronds of leaflets. Everything is instanced: one draw call per material per kit.
 */

import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { bark } from './realMaterials';
import { IS_HANDHELD } from './deviceTier';

type Vec3 = [number, number, number];

export type TreeKind = 'broadleaf' | 'blossom' | 'birch' | 'cypress' | 'acacia' | 'pine' | 'palm';

function rng(seed: number) {
  let s = (seed * 2654435761) >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/* ───────────────────────── Leaf card textures ───────────────────────── */

type CardKind = 'leaves' | 'blossom' | 'needles' | 'frond';
const cardCache = new Map<CardKind, THREE.CanvasTexture>();

function cardTexture(kind: CardKind): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const hit = cardCache.get(kind);
  if (hit) return hit;
  const S = 256;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d')!;
  const r = rng(kind.length * 97);
  ctx.clearRect(0, 0, S, S);
  if (kind === 'frond') {
    // Palm frond: a midrib with long leaflets arching off both sides
    ctx.strokeStyle = 'rgb(150,150,120)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(S / 2, S);
    ctx.lineTo(S / 2, 0);
    ctx.stroke();
    for (let y = S - 7; y > 5; y -= 6) {
      const t = 1 - y / S;
      const len = (S / 2) * (0.11 + Math.sin(t * Math.PI) ** 0.72 * 0.89) * (0.84 + r() * 0.16);
      for (const side of [-1, 1]) {
        const root = 120 + r() * 48;
        const tip = 190 + r() * 40;
        const dx = side * len;
        const dy = len * (0.23 + t * 0.18);
        const shade = ctx.createLinearGradient(S / 2, y, S / 2 + dx, y - dy);
        shade.addColorStop(0, `rgb(${root},${root},${root})`);
        shade.addColorStop(1, `rgb(${tip},${tip},${tip})`);
        ctx.fillStyle = shade;
        ctx.beginPath();
        ctx.moveTo(S / 2, y + 2.4);
        ctx.quadraticCurveTo(S / 2 + dx * 0.44, y - dy * 0.15 + 2, S / 2 + dx, y - dy);
        ctx.quadraticCurveTo(S / 2 + dx * 0.4, y - dy * 0.62 - 4, S / 2, y - 2);
        ctx.fill();
      }
    }
  } else if (kind === 'needles') {
    // Conifer spray: twigs covered in short needles
    for (let b = 0; b < 16; b++) {
      const side = b % 2 ? 1 : -1;
      const x0 = S * (0.48 + r() * 0.04);
      const y0 = S * (0.42 + (b / 16) * 0.51);
      const ang = -Math.PI / 2 + side * (0.28 + r() * 0.66);
      const len = 65 + r() * 72;
      for (let i = 0; i < 48; i++) {
        const t = i / 48;
        const px = x0 + Math.cos(ang) * len * t;
        const py = y0 + Math.sin(ang) * len * t;
        for (const side of [-1, 1]) {
          const a2 = ang + side * (0.9 + r() * 0.3);
          const tone = 120 + r() * 110;
          ctx.strokeStyle = `rgb(${tone},${tone},${tone})`;
          ctx.lineWidth = 1.35;
          ctx.beginPath();
          ctx.moveTo(px, py);
          const needle = 9 + r() * 15 * Math.sin(t * Math.PI);
          ctx.lineTo(px + Math.cos(a2) * needle, py + Math.sin(a2) * needle);
          ctx.stroke();
        }
      }
    }
  } else {
    // Broadleaf (or blossom) cluster: many small leaves, darker towards the cluster's core
    const n = kind === 'blossom' ? 260 : 170;
    for (let i = 0; i < n; i++) {
      const a = r() * Math.PI * 2;
      const d = Math.sqrt(r()) * S * 0.44;
      const x = S / 2 + Math.cos(a) * d;
      const y = S / 2 + Math.sin(a) * d;
      const shade = 110 + (d / (S * 0.44)) * 90 + r() * 55;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(r() * Math.PI * 2);
      if (kind === 'blossom' && r() < 0.75) {
        // Five-petal flower
        const t = 200 + r() * 55;
        ctx.fillStyle = `rgb(${t},${t},${t})`;
        for (let p = 0; p < 5; p++) {
          ctx.rotate((Math.PI * 2) / 5);
          ctx.beginPath();
          ctx.ellipse(0, 4, 3, 5, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
        ctx.beginPath();
        ctx.ellipse(0, 0, 4 + r() * 3, 9 + r() * 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = `rgba(60,60,60,0.35)`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(0, -9);
        ctx.lineTo(0, 9);
        ctx.stroke();
      }
      ctx.restore();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  cardCache.set(kind, tex);
  return tex;
}

/* ───────────────────────── Foliage material (wind + volume normals) ───────────────────────── */

const windUniform = { value: 0 };

function foliageMaterial(kind: CardKind, color: string): THREE.MeshStandardMaterial {
  const m = new THREE.MeshStandardMaterial({
    color,
    map: cardTexture(kind),
    alphaTest: 0.45,
    side: THREE.DoubleSide,
    roughness: 0.75,
  });
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uWind = windUniform;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec3 aCenter;\nuniform float uWind;')
      .replace(
        '#include <defaultnormal_vertex>',
        `#include <defaultnormal_vertex>
        #ifdef USE_INSTANCING
          // Light the canopy as one rounded volume rather than as flat cards
          vec3 volN = normalize(instanceMatrix[3].xyz - aCenter + vec3(0.0, 0.25, 0.0));
          transformedNormal = normalize(mix(transformedNormal, normalMatrix * volN, 0.8));
        #endif`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        #ifdef USE_INSTANCING
          float ph = instanceMatrix[3].x * 0.7 + instanceMatrix[3].z * 0.9;
          float sway = sin(uWind * 1.4 + ph) * 0.5 + sin(uWind * 2.7 + ph * 1.7) * 0.25;
          transformed.x += sway * 0.05 * (uv.y + 0.3);
          transformed.z += cos(uWind * 1.1 + ph) * 0.04 * (uv.y + 0.3);
        #endif`,
      );
  };
  m.customProgramCacheKey = () => `foliage_${kind}`;
  return m;
}

/** Advances the shared wind clock (mount once per scene) */
export function WindClock() {
  useFrame((_, dt) => {
    windUniform.value += Math.min(dt, 0.1);
  });
  return null;
}

/* ───────────────────────── Tree layout ───────────────────────── */

interface CardInstance {
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  scale: number;
  center: THREE.Vector3;
}

interface TreeBuild {
  trunks: THREE.BufferGeometry | null;
  cards: CardInstance[];
  cardKind: CardKind;
  cardGeo: THREE.BufferGeometry;
}

function taperedLimb(from: THREE.Vector3, to: THREE.Vector3, r0: number, r1: number, bend = 0.15, seed = 1): THREE.BufferGeometry {
  const r = rng(seed);
  const mid = from.clone().lerp(to, 0.5).add(new THREE.Vector3((r() - 0.5) * bend, 0, (r() - 0.5) * bend));
  const curve = new THREE.QuadraticBezierCurve3(from, mid, to);
  const tube = new THREE.TubeGeometry(curve, 8, 1, 8, false);
  // Taper the tube radius along its length
  const pos = tube.attributes.position as THREE.BufferAttribute;
  const pts = curve.getSpacedPoints(8);
  for (let i = 0; i < pos.count; i++) {
    const seg = Math.floor(i / 9);
    const t = Math.min(1, seg / 8);
    const c = pts[Math.min(8, seg)];
    const v = new THREE.Vector3().fromBufferAttribute(pos, i).sub(c);
    const rad = r0 + (r1 - r0) * t;
    v.multiplyScalar(rad).add(c);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  tube.computeVertexNormals();
  // Swap the tube's UVs so bark furrows run along the limb, tiling about every metre
  const uv = tube.attributes.uv as THREE.BufferAttribute;
  const length = curve.getLength();
  for (let i = 0; i < uv.count; i++) {
    const along = uv.getX(i);
    const around = uv.getY(i);
    uv.setXY(i, around * Math.max(1, Math.round(r0 * 12)), along * length);
  }
  return tube;
}

function cardPlane(kind: CardKind): THREE.BufferGeometry {
  if (kind === 'frond') {
    // Long strip, arching: bent along its length and folded slightly at the midrib
    const g = new THREE.PlaneGeometry(1.3, 3.2, 4, 10);
    const pos = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i) + 1.6;
      const t = y / 3.2;
      pos.setXYZ(i, x, Math.sin(t * Math.PI) * 0.63 - t * t * 1.65 - Math.abs(x) * 0.22, y);
    }
    g.computeVertexNormals();
    return g;
  }
  const g = new THREE.PlaneGeometry(1, 1, 2, 2);
  return g;
}

function buildTree(kind: TreeKind, seed: number, height: number, distant: boolean): TreeBuild {
  const r = rng(seed);
  const limbs: THREE.BufferGeometry[] = [];
  const cards: CardInstance[] = [];
  const cardKind: CardKind = kind === 'pine' || kind === 'cypress' ? 'needles' : kind === 'palm' ? 'frond' : kind === 'blossom' ? 'blossom' : 'leaves';

  const addCard = (p: THREE.Vector3, center: THREE.Vector3, scale: number, orient?: THREE.Quaternion) => {
    const q =
      orient ??
      new THREE.Quaternion().setFromEuler(new THREE.Euler((r() - 0.5) * Math.PI, r() * Math.PI * 2, (r() - 0.5) * Math.PI));
    cards.push({ position: p, quaternion: q, scale, center });
  };

  if (kind === 'palm') {
    // Leaning, slightly curved trunk with ring scars, crown of arching fronds
    const top = new THREE.Vector3((r() - 0.5) * 2.35, height, (r() - 0.5) * 1.5);
    limbs.push(taperedLimb(new THREE.Vector3(0, 0, 0), top, 0.23, 0.105, 1.2, seed));
    const n = distant ? 9 : 18;
    for (let i = 0; i < n; i++) {
      const a = i * 2.39996 + r() * 0.42;
      const lower = i < n * 0.68;
      const pitch = lower ? (r() - 0.5) * 0.45 : -0.6 - r() * 0.6;
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch, a, (r() - 0.5) * 0.35, 'YXZ'));
      const base = top.clone().add(new THREE.Vector3(Math.sin(a) * 0.10, lower ? -0.12 : 0.11, Math.cos(a) * 0.10));
      addCard(base, top, (lower ? 0.90 : 0.67) + r() * 0.32, q);
    }
    // A few coconuts
    return { trunks: mergeGeometries(limbs.map(clean)) ?? null, cards, cardKind, cardGeo: cardPlane('frond') };
  }

  if (kind === 'pine') {
    const top = new THREE.Vector3((r() - 0.5) * 0.6, height, (r() - 0.5) * 0.7);
    const base = new THREE.Vector3();
    limbs.push(taperedLimb(base, top, 0.18, 0.022, 0.24, seed));
    const firstBranch = 0.26 + r() * 0.19;
    const width = height * (0.23 + r() * 0.12);
    const count = distant ? 20 : 39;
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      const y = firstBranch + t * (0.97 - firstBranch);
      const a = i * 2.39996 + (r() - 0.5) * 0.8;
      const root = base.clone().lerp(top, y);
      root.y += (r() - 0.5) * 0.32;
      const length = (width * (1 - t) ** 0.75 + 0.24) * (0.62 + r() * 0.52);
      const tip = root.clone().add(new THREE.Vector3(Math.cos(a) * length, length * (r() * 0.32 - 0.24), Math.sin(a) * length));
      if (!distant && i < count * 0.72) limbs.push(taperedLimb(root, tip, 0.042 * (1 - t) + 0.01, 0.009, 0.18, seed + i));
      const clusters = (distant ? 2 : 3) + (t < 0.55 ? 1 : 0);
      for (let j = 0; j < clusters; j++) {
        const along = 0.47 + (j / (clusters - 1)) * 0.5;
        const tuft = root.clone().lerp(tip, along);
        const side = (j % 2 ? 1 : -1) * length * 0.19;
        tuft.x += Math.sin(a) * side;
        tuft.z -= Math.cos(a) * side;
        const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.6 - r() * 0.57, -a + r() * 1.4, (r() - 0.5) * 0.8, 'YXZ'));
        addCard(tuft, root, (0.65 + length * 0.50) * (0.84 + r() * 0.28), q);
      }
    }
    return { trunks: mergeGeometries(limbs.map(clean)) ?? null, cards, cardKind, cardGeo: cardPlane(cardKind) };
  }

  if (kind === 'cypress') {
    const trunkTop = new THREE.Vector3(0, height * 0.97, 0);
    limbs.push(taperedLimb(new THREE.Vector3(0, 0, 0), trunkTop, 0.14, 0.03, 0.1, seed));
    const tiers = distant ? 12 : 20;
    for (let i = 0; i < tiers; i++) {
      const t = i / (tiers - 1);
      const y = height * (0.1 + t * 0.88);
      const rad = 0.75 * Math.sin(Math.min(1, (1 - t) * 1.4 + 0.15) * Math.PI * 0.55);
      const count = Math.max(7, Math.round(rad * 22));
      const center = new THREE.Vector3(0, y, 0);
      for (let k = 0; k < count; k++) {
        const a = (k / count) * Math.PI * 2 + r() * 0.5 + i;
        const d = rad * (0.45 + r() * 0.55);
        const p = new THREE.Vector3(Math.cos(a) * d, y - d * 0.25 + (r() - 0.5) * 0.25, Math.sin(a) * d);
        // Needle sprays droop outward, facing up-and-out
        const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.9 - r() * 0.4, -a + Math.PI / 2, (r() - 0.5) * 0.4, 'YXZ'));
        addCard(p, center, 0.9 + r() * 0.6, q);
      }
    }
    return { trunks: mergeGeometries(limbs.map(clean)) ?? null, cards, cardKind, cardGeo: cardPlane(cardKind) };
  }

  // Broadleaf family: trunk, a handful of scaffold branches, clumps of leaf cards
  const trunkH = height * (kind === 'acacia' ? 0.62 : kind === 'birch' ? 0.55 : 0.42);
  const trunkTop = new THREE.Vector3((r() - 0.5) * 0.3, trunkH, (r() - 0.5) * 0.3);
  limbs.push(taperedLimb(new THREE.Vector3(0, 0, 0), trunkTop, kind === 'birch' ? 0.13 : 0.2, 0.12, 0.25, seed));
  const crownR = kind === 'acacia' ? height * 0.55 : kind === 'birch' ? height * 0.24 : height * 0.33;
  const crownH = kind === 'acacia' ? height * 0.14 : kind === 'birch' ? height * 0.42 : crownR * 0.85;
  const crownC = new THREE.Vector3(trunkTop.x, trunkH + crownH * (kind === 'acacia' ? 0.9 : 0.75), trunkTop.z);
  const branches = kind === 'acacia' ? 6 : 5;
  const clumps: THREE.Vector3[] = [];
  for (let b = 0; b < branches; b++) {
    const a = (b / branches) * Math.PI * 2 + r() * 0.6;
    const end = new THREE.Vector3(
      crownC.x + Math.cos(a) * crownR * (0.55 + r() * 0.3),
      crownC.y + (r() - 0.3) * crownH * 0.7,
      crownC.z + Math.sin(a) * crownR * (0.55 + r() * 0.3),
    );
    limbs.push(taperedLimb(trunkTop.clone(), end, 0.1, 0.03, 0.4, seed + b * 7));
    clumps.push(end);
  }
  clumps.push(crownC.clone().add(new THREE.Vector3(0, crownH * 0.45, 0)));
  // Fill the crown ellipsoid with cards, denser on the outside where light falls
  const total = Math.round((distant ? 42 : kind === 'acacia' ? 70 : 85) * (height / 5));
  for (let i = 0; i < total; i++) {
    const anchor = clumps[i % clumps.length];
    const u = r() * Math.PI * 2;
    const v = Math.acos(2 * r() - 1);
    const d = 0.55 + Math.sqrt(r()) * 0.45;
    const off = new THREE.Vector3(Math.sin(v) * Math.cos(u) * crownR * 0.6, Math.cos(v) * crownH * 0.55, Math.sin(v) * Math.sin(u) * crownR * 0.6).multiplyScalar(d);
    const p = anchor.clone().lerp(crownC, 0.35).add(off);
    addCard(p, crownC, (kind === 'birch' ? 0.9 : 1.15) + r() * 0.6);
  }
  return { trunks: mergeGeometries(limbs.map(clean)) ?? null, cards, cardKind, cardGeo: cardPlane(cardKind) };
}

function clean(g: THREE.BufferGeometry): THREE.BufferGeometry {
  for (const name of Object.keys(g.attributes)) if (name !== 'position' && name !== 'normal' && name !== 'uv') g.deleteAttribute(name);
  return g.index ? g.toNonIndexed() : g;
}

/* ───────────────────────── Forest (many trees, few draw calls) ───────────────────────── */

export interface TreeSpot {
  position: Vec3;
  /** Height in metres */
  height?: number;
  rotation?: number;
}

const DEFAULT_HEIGHT: Record<TreeKind, number> = {
  broadleaf: 6,
  blossom: 4.8,
  birch: 7.5,
  cypress: 7,
  acacia: 5.5,
  pine: 8,
  palm: 7,
};

const BARK: Record<TreeKind, string> = {
  broadleaf: '#5b4636',
  blossom: '#4a3628',
  birch: '#e8e4dc',
  cypress: '#4e3b2c',
  acacia: '#5a4a3d',
  pine: '#4a3426',
  palm: '#8a7560',
};

/** A group of trees of one kind, built from shared leaf-card and bark geometry */
export function Forest({ kind, spots, leafColor, seed = 1, castShadow = true }: { kind: TreeKind; spots: TreeSpot[]; leafColor: string; seed?: number; castShadow?: boolean }) {
  const built = useMemo(() => {
    const nominal = DEFAULT_HEIGHT[kind];
    const variants = [0, 1, 2].map((v) => buildTree(kind, seed * 13 + v * 101, nominal, !castShadow));
    const trunkParts: THREE.BufferGeometry[] = [];
    const cards: Array<{ m: THREE.Matrix4; center: THREE.Vector3; color: THREE.Color }> = [];
    const r = rng(seed + 5);
    const base = new THREE.Color(leafColor);
    spots.forEach((spot, i) => {
      const h = spot.height ?? DEFAULT_HEIGHT[kind] * (0.85 + r() * 0.3);
      const variant = variants[i % variants.length];
      const rot = spot.rotation ?? r() * Math.PI * 2;
      const tm = new THREE.Matrix4().compose(new THREE.Vector3(...spot.position), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rot), new THREE.Vector3(h / nominal, h / nominal, h / nominal));
      if (variant.trunks) trunkParts.push(variant.trunks.clone().applyMatrix4(tm));
      const tint = base.clone();
      const hsl = { h: 0, s: 0, l: 0 };
      tint.getHSL(hsl);
      tint.setHSL(hsl.h + (r() - 0.5) * 0.03, hsl.s * (0.85 + r() * 0.25), hsl.l * (0.85 + r() * 0.3));
      for (const c of variant.cards) {
        const p = c.position.clone().applyMatrix4(tm);
        const center = c.center.clone().applyMatrix4(tm);
        const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rot).multiply(c.quaternion);
        const s = c.scale * (h / nominal);
        cards.push({ m: new THREE.Matrix4().compose(p, q, new THREE.Vector3(s, s, s)), center, color: tint });
      }
    });
    const trunks = trunkParts.length ? mergeGeometries(trunkParts) : null;
    const cardGeo = variants[0].cardGeo.clone();
    const centers = new Float32Array(cards.length * 3);
    cards.forEach((c, i) => c.center.toArray(centers, i * 3));
    cardGeo.setAttribute('aCenter', new THREE.InstancedBufferAttribute(centers, 3));
    return { trunks, cards, cardGeo, cardKind: variants[0].cardKind };
  }, [kind, spots, leafColor, seed, castShadow]);

  const material = useMemo(() => foliageMaterial(built.cardKind, '#ffffff'), [built.cardKind]);
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    built.cards.forEach((c, i) => {
      mesh.setMatrixAt(i, c.m);
      mesh.setColorAt(i, c.color);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [built]);
  useLayoutEffect(() => () => {
    material.dispose();
    built.cardGeo.dispose();
    built.trunks?.dispose();
  }, [material, built]);

  return (
    <group>
      {built.trunks && <mesh geometry={built.trunks} material={bark(BARK[kind])} castShadow={castShadow} receiveShadow userData={{ noCastShadow: !castShadow }} />}
      <instancedMesh ref={ref} args={[built.cardGeo, material, built.cards.length]} castShadow={castShadow} receiveShadow userData={{ noCastShadow: !castShadow }} />
    </group>
  );
}

/** Ring of distant woodland so outdoor venues meet a real horizon instead of fog */
export function DistantTreeline({ leafColor, kind = 'broadleaf', inner = 35, outer = 90, count = IS_HANDHELD ? 62 : 105, seed = 3, groundHeight }: { leafColor: string; kind?: TreeKind; inner?: number; outer?: number; count?: number; seed?: number; groundHeight?: (x: number, z: number) => number }) {
  const spots = useMemo(() => {
    const r = rng(seed);
    const out: TreeSpot[] = [];
    const groves = Array.from({ length: 9 }, (_, i) => ({
      angle: i * Math.PI * 2 / 9 + r() * 0.45,
      radius: inner + (outer - inner) * (0.27 + r() * 0.50),
    }));
    for (let i = 0; i < count; i++) {
      const grove = groves[i % groves.length];
      const a = grove.angle + (r() - 0.5) * 0.56;
      const d = THREE.MathUtils.clamp(grove.radius + (r() - 0.5) * (outer - inner) * 0.69, inner, outer);
      const x = Math.cos(a) * d;
      const z = Math.sin(a) * d;
      out.push({ position: [x, groundHeight?.(x, z) ?? 0, z], height: DEFAULT_HEIGHT[kind] * (0.74 + r() * 0.83) });
    }
    return out;
  }, [inner, outer, count, seed, kind, groundHeight]);
  return <Forest kind={kind} spots={spots} leafColor={leafColor} seed={seed} castShadow={false} />;
}


/**
 * Southern Vietnamese "cổng lá dừa": two posts and a lintel clad in hanging coconut-leaf
 * fringe, with a red double-happiness banner and clusters of red flowers.
 */
export function CoconutLeafGate({ width = 3.4, height = 2.9, banner = '#b91c1c' }: { width?: number; height?: number; banner?: string }) {
  const built = useMemo(() => {
    const r = rng(77);
    const items: Array<{ m: THREE.Matrix4; center: THREE.Vector3; color: THREE.Color }> = [];
    const leaf = new THREE.Color('#5d8a35');
    const add = (p: THREE.Vector3, center: THREE.Vector3, yaw: number, pitch: number, s: number) => {
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch, yaw, (r() - 0.5) * 0.3, 'YXZ'));
      const tint = leaf.clone().offsetHSL((r() - 0.5) * 0.03, (r() - 0.5) * 0.1, (r() - 0.5) * 0.08);
      items.push({ m: new THREE.Matrix4().compose(p, q, new THREE.Vector3(s, s, s)), center, color: tint });
    };
    // Posts: rings of fronds hanging downward around each post
    for (const x of [-width / 2, width / 2]) {
      for (let y = 0.5; y <= height; y += 0.38) {
        for (let k = 0; k < 7; k++) {
          const a = (k / 7) * Math.PI * 2 + y;
          const c = new THREE.Vector3(x, y, 0);
          add(new THREE.Vector3(x + Math.cos(a) * 0.12, y + 0.35, Math.sin(a) * 0.12), c, -a + Math.PI / 2, Math.PI - 0.15, 0.28 + r() * 0.06);
        }
      }
    }
    // Lintel: fringe hanging from front and back
    for (let x = -width / 2 - 0.2; x <= width / 2 + 0.2; x += 0.22) {
      for (const side of [-1, 1]) {
        const c = new THREE.Vector3(x, height + 0.15, 0);
        add(new THREE.Vector3(x, height + 0.35, side * 0.16), c, side > 0 ? 0 : Math.PI, Math.PI - 0.12, 0.26 + r() * 0.05);
      }
      // Fronds sprouting up along the top
      const c = new THREE.Vector3(x, height + 0.2, 0);
      add(new THREE.Vector3(x, height + 0.2, 0), c, r() * Math.PI, -0.3 - r() * 0.4, 0.3 + r() * 0.1);
    }
    const geo = cardPlane('frond');
    const centers = new Float32Array(items.length * 3);
    items.forEach((it, i) => it.center.toArray(centers, i * 3));
    geo.setAttribute('aCenter', new THREE.InstancedBufferAttribute(centers, 3));
    return { items, geo };
  }, [width, height]);
  const material = useMemo(() => foliageMaterial('frond', '#ffffff'), []);
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    built.items.forEach((it, i) => {
      mesh.setMatrixAt(i, it.m);
      mesh.setColorAt(i, it.color);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [built]);
  useLayoutEffect(() => () => {
    material.dispose();
    built.geo.dispose();
  }, [material, built]);
  return (
    <group>
      {/* Bamboo cores under the leaves */}
      {[-width / 2, width / 2].map((x) => (
        <mesh key={x} position={[x, height / 2 + 0.1, 0]} material={bark('#6b5a3a')}>
          <cylinderGeometry args={[0.1, 0.11, height + 0.2, 12]} />
        </mesh>
      ))}
      <mesh position={[0, height + 0.15, 0]} rotation={[0, 0, Math.PI / 2]} material={bark('#6b5a3a')}>
        <cylinderGeometry args={[0.09, 0.09, width + 0.5, 12]} />
      </mesh>
      <instancedMesh ref={ref} args={[built.geo, material, built.items.length]} castShadow receiveShadow frustumCulled={false} />
      {/* Red silk banner hung under the lintel */}
      <mesh position={[0, height - 0.32, 0.22]}>
        <planeGeometry args={[1.5, 0.48]} />
        <meshPhysicalMaterial color={banner} roughness={0.45} sheen={1} sheenColor="#ffd6d6" side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
