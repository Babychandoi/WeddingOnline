/**
 * Procedural surface detail for floors and grounds — grass, sand, wood planks, flagstone,
 * tiles, marble, snow — drawn once on a canvas, so no image downloads. Textures are
 * greyscale and multiply the venue's own colour, keeping each theme's palette.
 */

import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { VenueTheme } from '@dco/shared';

export type SurfaceKind = 'grass' | 'sand' | 'wood' | 'stone' | 'tile' | 'marble' | 'snow';

const SIZE = 512;
const cache = new Map<SurfaceKind, HTMLCanvasElement>();

/** Deterministic pseudo-random so every visitor sees the same floor */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function grey(v: number, a = 1): string {
  const c = Math.max(0, Math.min(255, Math.round(v)));
  return `rgba(${c},${c},${c},${a})`;
}

function drawSurface(kind: SurfaceKind): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d')!;
  const r = rng(kind.length * 977 + kind.charCodeAt(0));

  const base = { grass: 228, sand: 238, wood: 226, stone: 232, tile: 240, marble: 246, snow: 250 }[kind];
  ctx.fillStyle = grey(base);
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Large soft tonal patches break up repetition on every surface
  for (let i = 0; i < 26; i++) {
    const x = r() * SIZE;
    const y = r() * SIZE;
    const rad = 40 + r() * 120;
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    const tone = base + (r() - 0.5) * (kind === 'marble' || kind === 'snow' ? 10 : 26);
    g.addColorStop(0, grey(tone, 0.5));
    g.addColorStop(1, grey(tone, 0));
    ctx.fillStyle = g;
    ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }

  switch (kind) {
    case 'grass':
      for (let i = 0; i < 9000; i++) {
        const x = r() * SIZE;
        const y = r() * SIZE;
        const len = 3 + r() * 7;
        const ang = -Math.PI / 2 + (r() - 0.5) * 0.9;
        ctx.strokeStyle = grey(r() < 0.55 ? 170 + r() * 40 : 245 + r() * 10, 0.7);
        ctx.lineWidth = 1 + r();
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
        ctx.stroke();
      }
      break;
    case 'sand':
      for (let y = 0; y < SIZE; y += 1) {
        const ripple = Math.sin(y * 0.09 + Math.sin(y * 0.013) * 3) * 6;
        ctx.fillStyle = grey(base + ripple, 0.35);
        ctx.fillRect(0, y, SIZE, 1);
      }
      for (let i = 0; i < 14000; i++) {
        ctx.fillStyle = grey(200 + r() * 55, 0.55);
        ctx.fillRect(r() * SIZE, r() * SIZE, 1 + r() * 1.5, 1 + r() * 1.5);
      }
      break;
    case 'snow':
      for (let i = 0; i < 6000; i++) {
        ctx.fillStyle = grey(232 + r() * 23, 0.5);
        ctx.fillRect(r() * SIZE, r() * SIZE, 2, 2);
      }
      break;
    case 'wood': {
      const rows = 8;
      const h = SIZE / rows;
      for (let row = 0; row < rows; row++) {
        let x = -r() * 200;
        while (x < SIZE) {
          const w = 160 + r() * 200;
          ctx.fillStyle = grey(200 + r() * 45);
          ctx.fillRect(x, row * h, w, h);
          // Grain
          for (let g = 0; g < 9; g++) {
            const gy = row * h + 4 + r() * (h - 8);
            ctx.strokeStyle = grey(165 + r() * 30, 0.45);
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x, gy);
            for (let gx = x; gx < x + w; gx += 16) ctx.lineTo(gx, gy + Math.sin(gx * 0.03 + g) * 1.6);
            ctx.stroke();
          }
          ctx.fillStyle = grey(120, 0.55);
          ctx.fillRect(x, row * h, 2, h);
          x += w;
        }
        ctx.fillStyle = grey(110, 0.6);
        ctx.fillRect(0, row * h, SIZE, 2);
      }
      break;
    }
    case 'stone': {
      // Flagstones: offset rows of irregular slabs with mortar joints
      const rows = 6;
      const h = SIZE / rows;
      for (let row = 0; row < rows; row++) {
        let x = row % 2 ? -h * 0.5 : 0;
        while (x < SIZE) {
          const w = h * (0.8 + r() * 0.7);
          ctx.fillStyle = grey(205 + r() * 40);
          ctx.fillRect(x + 3, row * h + 3, w - 6, h - 6);
          for (let i = 0; i < 120; i++) {
            ctx.fillStyle = grey(180 + r() * 60, 0.35);
            ctx.fillRect(x + 3 + r() * (w - 6), row * h + 3 + r() * (h - 6), 2, 2);
          }
          x += w;
        }
      }
      break;
    }
    case 'tile': {
      const n = 8;
      const s = SIZE / n;
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          ctx.fillStyle = grey(232 + r() * 18);
          ctx.fillRect(i * s + 2, j * s + 2, s - 4, s - 4);
        }
      }
      ctx.fillStyle = grey(190, 0.8);
      for (let i = 0; i <= n; i++) {
        ctx.fillRect(i * s - 1, 0, 2, SIZE);
        ctx.fillRect(0, i * s - 1, SIZE, 2);
      }
      break;
    }
    case 'marble': {
      ctx.lineCap = 'round';
      for (let v = 0; v < 14; v++) {
        let x = r() * SIZE;
        let y = r() * SIZE;
        ctx.strokeStyle = grey(175 + r() * 40, 0.35);
        ctx.lineWidth = 0.6 + r() * 2;
        ctx.shadowColor = grey(170, 0.4);
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.moveTo(x, y);
        for (let k = 0; k < 18; k++) {
          x += (r() - 0.35) * 60;
          y += (r() - 0.5) * 50;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
      // Slab joints
      ctx.fillStyle = grey(210, 0.6);
      ctx.fillRect(0, SIZE / 2 - 1, SIZE, 2);
      ctx.fillRect(SIZE / 2 - 1, 0, 2, SIZE);
      break;
    }
  }
  return canvas;
}

/** A repeating detail texture; `tilesAcross` tiles cover the surface's width */
export function surfaceTexture(kind: SurfaceKind, tilesAcross: number): THREE.Texture | null {
  if (typeof document === 'undefined') return null;
  let canvas = cache.get(kind);
  if (!canvas) {
    canvas = drawSurface(kind);
    cache.set(kind, canvas);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(tilesAcross, tilesAcross);
  tex.anisotropy = 8;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Metres one texture tile covers, so planks, slabs and tiles come out at believable sizes */
const TILE_METRES: Record<SurfaceKind, number> = {
  grass: 2.5,
  sand: 3,
  wood: 2.4,
  stone: 3,
  tile: 4,
  marble: 2.4,
  snow: 4,
};

/** How shiny each surface is under the image-based light */
export const SURFACE_ROUGHNESS: Record<SurfaceKind, number> = {
  grass: 0.95,
  sand: 0.95,
  wood: 0.5,
  stone: 0.85,
  tile: 0.35,
  marble: 0.22,
  snow: 0.75,
};

/** The texture for a surface of `sizeMetres` across, disposed when it is no longer used */
export function useSurfaceTexture(kind: SurfaceKind, sizeMetres: number): THREE.Texture | null {
  const tex = useMemo(() => surfaceTexture(kind, sizeMetres / TILE_METRES[kind]), [kind, sizeMetres]);
  useEffect(() => () => tex?.dispose(), [tex]);
  return tex;
}

function hsl(hex: string) {
  const out = { h: 0, s: 0, l: 0 };
  new THREE.Color(hex).getHSL(out);
  return out;
}

/** Pick a surface from the colour and setting: greens are lawn, warm pale tones sand, … */
export function surfaceFor(hex: string, theme: VenueTheme, role: 'floor' | 'ground'): SurfaceKind {
  const { h, s, l } = hsl(hex);
  const snowy = theme.kits.b.includes('snow-peaks') || theme.kits.c === 'aurora';
  if (snowy && l > 0.85) return 'snow';
  if (h > 0.17 && h < 0.45 && s > 0.12 && l < 0.75) return 'grass';
  if (role === 'floor' && theme.mood === 'indoor') return l > 0.6 ? 'marble' : 'wood';
  if (h > 0.06 && h < 0.17 && s > 0.3 && l > 0.6) return 'sand';
  if (h > 0.03 && h < 0.14 && s > 0.25 && l < 0.55) return 'wood';
  if (role === 'floor' && l > 0.8) return 'tile';
  return 'stone';
}
