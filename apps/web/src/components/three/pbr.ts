/**
 * Procedural PBR detail maps (normal + roughness), drawn once on a canvas and cached, so
 * every surface gets the micro relief real materials have — woven fabric, carpet pile,
 * wood grain, bark, leaf veins, painted plaster — without downloading image files.
 */

import * as THREE from 'three';

export type DetailKind = 'micro' | 'fabric' | 'satin' | 'carpet' | 'wood' | 'bark' | 'leaf' | 'petal' | 'stone';

const SIZE = 256;

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Tileable value noise on a SIZE grid, `cells` lattice cells across */
function tileNoise(cells: number, seed: number): Float32Array {
  const r = rng(seed);
  const lattice = new Float32Array(cells * cells).map(() => r());
  const out = new Float32Array(SIZE * SIZE);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const fx = (x / SIZE) * cells;
      const fy = (y / SIZE) * cells;
      const x0 = Math.floor(fx);
      const y0 = Math.floor(fy);
      const tx = fx - x0;
      const ty = fy - y0;
      const sx = tx * tx * (3 - 2 * tx);
      const sy = ty * ty * (3 - 2 * ty);
      const a = lattice[(y0 % cells) * cells + (x0 % cells)];
      const b = lattice[(y0 % cells) * cells + ((x0 + 1) % cells)];
      const c = lattice[((y0 + 1) % cells) * cells + (x0 % cells)];
      const d = lattice[((y0 + 1) % cells) * cells + ((x0 + 1) % cells)];
      out[y * SIZE + x] = a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
    }
  }
  return out;
}

function fbm(seed: number, octaves: number, base = 4): Float32Array {
  const out = new Float32Array(SIZE * SIZE);
  let amp = 0.5;
  let cells = base;
  for (let o = 0; o < octaves; o++) {
    const n = tileNoise(cells, seed + o * 101);
    for (let i = 0; i < out.length; i++) out[i] += n[i] * amp;
    amp *= 0.5;
    cells *= 2;
  }
  return out;
}

/** Height field in [0,1] for each kind of surface */
function heightField(kind: DetailKind): Float32Array {
  const h = new Float32Array(SIZE * SIZE);
  const n = fbm(kind.length * 31 + kind.charCodeAt(0), 5, 4);
  switch (kind) {
    case 'micro':
    case 'stone':
      return fbm(7 + (kind === 'stone' ? 3 : 0), 6, kind === 'stone' ? 8 : 16);
    case 'fabric':
    case 'satin': {
      // Plain weave: alternating warp / weft threads
      const threads = kind === 'satin' ? 96 : 128;
      for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
          const u = (x / SIZE) * threads;
          const v = (y / SIZE) * threads;
          const over = (Math.floor(u) + Math.floor(v)) % 2 === 0;
          const warp = Math.sin((u % 1) * Math.PI);
          const weft = Math.sin((v % 1) * Math.PI);
          const t = over ? warp * 0.7 + weft * 0.3 : weft * 0.7 + warp * 0.3;
          h[y * SIZE + x] = (kind === 'satin' ? 0.25 : 1) * t + n[y * SIZE + x] * 0.25;
        }
      }
      return h;
    }
    case 'carpet': {
      const r = rng(42);
      const tufts = fbm(9, 3, 64);
      for (let i = 0; i < h.length; i++) h[i] = tufts[i] * 0.8 + r() * 0.2;
      return h;
    }
    case 'wood': {
      for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
          const i = y * SIZE + x;
          const ring = Math.sin((y / SIZE) * Math.PI * 2 * 22 + n[i] * 9);
          h[i] = 0.5 + ring * 0.35 + n[i] * 0.15;
        }
      }
      return h;
    }
    case 'bark': {
      const cracks = fbm(5, 4, 8);
      for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
          const i = y * SIZE + x;
          // Vertical furrows broken by noise
          const f = Math.abs(Math.sin((x / SIZE) * Math.PI * 2 * 9 + cracks[i] * 6));
          h[i] = Math.pow(f, 0.6) * 0.8 + n[i] * 0.2;
        }
      }
      return h;
    }
    case 'leaf': {
      // Parallel veins diverging from a midrib plus cell-like bumps
      for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
          const i = y * SIZE + x;
          const u = x / SIZE;
          const v = y / SIZE;
          const vein = Math.pow(Math.abs(Math.sin((v * 14 + Math.abs(u - 0.5) * 6) * Math.PI)), 12);
          h[i] = 0.6 - vein * 0.4 + n[i] * 0.3;
        }
      }
      return h;
    }
    case 'petal': {
      for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
          const i = y * SIZE + x;
          const streak = Math.sin((x / SIZE) * Math.PI * 2 * 30 + n[i] * 4) * 0.5 + 0.5;
          h[i] = streak * 0.3 + n[i] * 0.7;
        }
      }
      return h;
    }
  }
  return n;
}

function heightToNormalCanvas(h: Float32Array, strength: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(SIZE, SIZE);
  const at = (x: number, y: number) => h[((y + SIZE) % SIZE) * SIZE + ((x + SIZE) % SIZE)];
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength;
      const dy = (at(x, y + 1) - at(x, y - 1)) * strength;
      const len = Math.hypot(dx, dy, 1);
      const o = (y * SIZE + x) * 4;
      img.data[o] = ((-dx / len) * 0.5 + 0.5) * 255;
      img.data[o + 1] = ((dy / len) * 0.5 + 0.5) * 255;
      img.data[o + 2] = ((1 / len) * 0.5 + 0.5) * 255;
      img.data[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

function heightToRoughnessCanvas(h: Float32Array, base: number, spread: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(SIZE, SIZE);
  for (let i = 0; i < h.length; i++) {
    // Roughness lives in the green channel; scaled by material.roughness at render time
    const v = Math.max(0, Math.min(1, base + (h[i] - 0.5) * spread)) * 255;
    img.data[i * 4] = v;
    img.data[i * 4 + 1] = v;
    img.data[i * 4 + 2] = v;
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

const STRENGTH: Record<DetailKind, number> = {
  micro: 3,
  stone: 10,
  fabric: 2.2,
  satin: 1.2,
  carpet: 9,
  wood: 4,
  bark: 14,
  leaf: 5,
  petal: 2.5,
};

const normalCache = new Map<DetailKind, THREE.CanvasTexture>();
const roughCache = new Map<DetailKind, THREE.CanvasTexture>();
const heightCache = new Map<DetailKind, Float32Array>();

function heights(kind: DetailKind) {
  let h = heightCache.get(kind);
  if (!h) {
    h = heightField(kind);
    heightCache.set(kind, h);
  }
  return h;
}

function prep(tex: THREE.CanvasTexture, repeat: number) {
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  tex.anisotropy = 8;
  tex.colorSpace = THREE.NoColorSpace;
  return tex;
}

/** Shared tileable normal map for a kind of surface (repeat set per kind) */
export function detailNormal(kind: DetailKind): THREE.Texture | null {
  if (typeof document === 'undefined') return null;
  let t = normalCache.get(kind);
  if (!t) {
    t = prep(new THREE.CanvasTexture(heightToNormalCanvas(heights(kind), STRENGTH[kind])), REPEAT[kind]);
    normalCache.set(kind, t);
  }
  return t;
}

/** Shared tileable roughness variation for a kind of surface */
export function detailRoughness(kind: DetailKind): THREE.Texture | null {
  if (typeof document === 'undefined') return null;
  let t = roughCache.get(kind);
  if (!t) {
    t = prep(new THREE.CanvasTexture(heightToRoughnessCanvas(heights(kind), 0.85, kind === 'satin' ? 0.2 : 0.35)), REPEAT[kind]);
    roughCache.set(kind, t);
  }
  return t;
}

/** How many times the detail tiles across a mesh's UV space */
const REPEAT: Record<DetailKind, number> = {
  micro: 3,
  stone: 2,
  fabric: 8,
  satin: 6,
  carpet: 3,
  wood: 1,
  bark: 2,
  leaf: 1,
  petal: 1,
};

/** Normal map from any greyscale canvas (used to give the floors real relief) */
export function normalFromCanvas(src: HTMLCanvasElement, strength: number): HTMLCanvasElement {
  const w = src.width;
  const ctx = src.getContext('2d')!;
  const data = ctx.getImageData(0, 0, w, w).data;
  const h = new Float32Array(w * w);
  for (let i = 0; i < h.length; i++) h[i] = data[i * 4] / 255;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = w;
  const out = canvas.getContext('2d')!;
  const img = out.createImageData(w, w);
  const at = (x: number, y: number) => h[((y + w) % w) * w + ((x + w) % w)];
  for (let y = 0; y < w; y++) {
    for (let x = 0; x < w; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength;
      const dy = (at(x, y + 1) - at(x, y - 1)) * strength;
      const len = Math.hypot(dx, dy, 1);
      const o = (y * w + x) * 4;
      img.data[o] = ((-dx / len) * 0.5 + 0.5) * 255;
      img.data[o + 1] = ((dy / len) * 0.5 + 0.5) * 255;
      img.data[o + 2] = ((1 / len) * 0.5 + 0.5) * 255;
      img.data[o + 3] = 255;
    }
  }
  out.putImageData(img, 0, 0);
  return canvas;
}
