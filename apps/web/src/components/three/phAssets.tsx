'use client';

/**
 * Photo-scanned, real-world assets from Poly Haven (CC0), served from /assets/ph and built by
 * scripts/fetch-polyhaven.mjs: sky photographs that light and surround each venue, floor and
 * ground textures photographed from real materials, and scanned models (chandeliers, plants,
 * trees, rocks...) placed as-is or scattered by the hundred with instancing.
 *
 * Everything degrades gracefully: until (or unless) a file loads, the procedural version
 * already in the scene stays in place.
 */

import React, { Component, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useLoader, useThree } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { loadGlbCached } from './GlbAssetMesh';
import { IS_HANDHELD } from './deviceTier';

export const PH_BASE = '/assets/ph';

export type PhMood = 'day' | 'sunset' | 'night';
export const PH_SKY: Record<PhMood, string> = {
  day: `${PH_BASE}/hdri/kloofendal_48d_partly_cloudy_puresky_2k.hdr`,
  sunset: `${PH_BASE}/hdri/qwantani_sunset_puresky_2k.hdr`,
  night: `${PH_BASE}/hdri/qwantani_night_puresky_2k.hdr`,
};

export const phModel = (id: string) => `${PH_BASE}/models/${id}.glb`;

/* ───────────────────────── Error boundary ───────────────────────── */

export class PhBoundary extends Component<{ fallback: React.ReactNode; children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    // Missing asset: the procedural fallback stays
    console.warn('[ph] asset unavailable, using procedural fallback', error);
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/* ───────────────────────── Sky photograph ───────────────────────── */

export interface SkyInfo {
  sun: THREE.Vector3 | null;
  horizon: THREE.Color;
}

/**
 * Pre-computed sun directions and horizon haze colours for the three Poly Haven 2K HDRIs,
 * avoiding a 2-million-pixel CPU scan on the main thread when the HDRI finishes downloading.
 */
const PRECOMPUTED_SKY_INFO: Record<PhMood, { sun: [number, number, number] | null; horizonHex: string }> = {
  day: { sun: [0.52, 0.58, 0.63], horizonHex: '#9ab0c2' },
  sunset: { sun: [-0.68, 0.36, -0.63], horizonHex: '#b88b73' },
  night: { sun: null, horizonHex: '#182030' },
};

function SkyPhoto({ mood, intensity, onSky }: { mood: PhMood; intensity: number; onSky?: (info: SkyInfo) => void }) {
  const url = PH_SKY[mood];
  useLoader(RGBELoader, url);
  useEffect(() => {
    const preset = PRECOMPUTED_SKY_INFO[mood];
    onSky?.({
      sun: preset.sun ? new THREE.Vector3(...preset.sun).normalize() : null,
      horizon: new THREE.Color(preset.horizonHex),
    });
  }, [mood, onSky]);
  return (
    <Environment
      files={url}
      background
      backgroundIntensity={mood === 'night' ? 1.4 : 1}
      environmentIntensity={intensity}
    />
  );
}

/**
 * Real photographed sky for outdoor moods. Renders `fallback` until the photo loads or if
 * it is missing; reports the sun's direction so the shadows match the photo.
 */
export function PhSky({ mood, intensity, fallback, onSky }: { mood: PhMood; intensity: number; fallback: React.ReactNode; onSky?: (info: SkyInfo | null) => void }) {
  // Defer downloading the 4-5 MB 2K HDRI slightly so the procedural sky, hall & avatars render immediately
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), 550);
    return () => window.clearTimeout(t);
  }, [mood]);
  if (!ready) return <>{fallback}</>;
  return (
    <PhBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <SkyPhoto mood={mood} intensity={intensity} onSky={onSky} />
      </Suspense>
    </PhBoundary>
  );
}

/* ───────────────────────── Surface textures ───────────────────────── */

export type PhSurfaceKind = 'grass' | 'sand' | 'wood' | 'stone' | 'tile' | 'marble' | 'snow';

const SURFACE_ID: Record<PhSurfaceKind, string> = {
  grass: 'grass_ground',
  sand: 'sand_01',
  wood: 'wood_floor_deck',
  stone: 'stone_tiles',
  tile: 'stone_tiles',
  marble: 'marble_01',
  snow: 'snow_02',
};

/** Real-world size (metres) one texture tile covers */
const SURFACE_METRES: Record<PhSurfaceKind, number> = {
  grass: 3.2,
  sand: 3.5,
  wood: 2.6,
  stone: 3.4,
  tile: 3.4,
  marble: 3.2,
  snow: 3.5,
};

interface SurfaceSet {
  map: THREE.Texture;
  normalMap: THREE.Texture;
  roughnessMap: THREE.Texture;
}

const surfaceCache = new Map<PhSurfaceKind, Promise<SurfaceSet>>();
const surfaceRepeatCache = new Map<string, SurfaceSet>();
const texLoader = new THREE.TextureLoader();

function loadTex(url: string, srgb: boolean): Promise<THREE.Texture> {
  return new Promise((resolve, reject) =>
    texLoader.load(
      url,
      (t) => {
        t.wrapS = THREE.RepeatWrapping;
        t.wrapT = THREE.RepeatWrapping;
        t.anisotropy = 4;
        t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
        resolve(t);
      },
      undefined,
      reject,
    ),
  );
}

function loadSurface(kind: PhSurfaceKind): Promise<SurfaceSet> {
  let p = surfaceCache.get(kind);
  if (!p) {
    const id = SURFACE_ID[kind];
    p = Promise.all([
      loadTex(`${PH_BASE}/textures/${id}_diff.webp`, true),
      loadTex(`${PH_BASE}/textures/${id}_nor.webp`, false),
      loadTex(`${PH_BASE}/textures/${id}_rough.webp`, false),
    ]).then(([map, normalMap, roughnessMap]) => ({ map, normalMap, roughnessMap }));
    p.catch(() => surfaceCache.delete(kind));
    surfaceCache.set(kind, p);
  }
  return p;
}

/**
 * Photographed material maps for a surface `sizeMetres` across, or null while loading /
 * when unavailable. Reuses cached repeat instances so the GPU never uploads duplicate 2K textures.
 */
export function usePhSurface(kind: PhSurfaceKind, sizeMetres: number): SurfaceSet | null {
  const rep = Math.round((sizeMetres / SURFACE_METRES[kind]) * 10) / 10;
  const cacheKey = `${kind}_${rep}`;
  const [set, setSet] = useState<SurfaceSet | null>(() => surfaceRepeatCache.get(cacheKey) ?? null);
  useEffect(() => {
    if (IS_HANDHELD) return;
    const cachedSet = surfaceRepeatCache.get(cacheKey);
    if (cachedSet) {
      setSet(cachedSet);
      return;
    }
    let alive = true;
    loadSurface(kind)
      .then((base) => {
        if (!alive) return;
        let shared = surfaceRepeatCache.get(cacheKey);
        if (!shared) {
          const clone = (t: THREE.Texture) => {
            const c = t.clone();
            c.repeat.set(rep, rep);
            c.needsUpdate = true;
            return c;
          };
          shared = { map: clone(base.map), normalMap: clone(base.normalMap), roughnessMap: clone(base.roughnessMap) };
          surfaceRepeatCache.set(cacheKey, shared);
        }
        setSet(shared);
      })
      .catch((e) => console.warn('[ph] surface', kind, e));
    return () => {
      alive = false;
    };
  }, [kind, rep, cacheKey]);
  return set;
}

/* ───────────────────────── Models ───────────────────────── */

/** Loads a scanned model once; staggers background foliage/scenery slightly after first frame so initial open is instant */
export function usePhModel(id: string, handheld = false): THREE.Group | null {
  const [scene, setScene] = useState<THREE.Group | null>(null);
  useEffect(() => {
    if (IS_HANDHELD && !handheld) return;
    let alive = true;
    const isHeavyFoliage =
      id.startsWith('island_tree') ||
      id.startsWith('jacaranda') ||
      id.startsWith('tree_small') ||
      id.startsWith('boulder') ||
      id.startsWith('rock_moss') ||
      id.startsWith('shrub') ||
      id.startsWith('grass_medium');
    const delayMs = isHeavyFoliage ? 650 : 15;
    const timer = window.setTimeout(() => {
      if (!alive) return;
      loadGlbCached(phModel(id))
        .then((s) => alive && setScene(s))
        .catch(() => undefined);
    }, delayMs);
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [id, handheld]);
  return scene;
}

/** Natural height of a model, for scaling it to a real-world size */
function modelHeight(scene: THREE.Group): number {
  const box = new THREE.Box3().setFromObject(scene);
  return Math.max(0.01, box.max.y - box.min.y);
}

/** One scanned model; `height` rescales it to that many metres tall */
export function PhModel({
  id,
  position,
  rotation,
  scale,
  height,
  fallback = null,
}: {
  id: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  height?: number;
  fallback?: React.ReactNode;
}) {
  const src = usePhModel(id);
  const obj = useMemo(() => (src ? src.clone(true) : null), [src]);
  if (!obj) return <group position={position} rotation={rotation}>{fallback}</group>;
  const s = height ? height / modelHeight(src!) : scale ?? 1;
  return <primitive object={obj} position={position} rotation={rotation} scale={s} />;
}

export interface ScatterItem {
  position: [number, number, number];
  rotationY?: number;
  scale?: number;
}

type Part = { geometry: THREE.BufferGeometry; material: THREE.Material | THREE.Material[]; local: THREE.Matrix4 };

/**
 * Hundreds of copies of a scanned model (grass clumps, shrubs, rocks, trees) drawn with one
 * instanced mesh per part. With `variants`, the model is a pack of separate pieces (as Poly
 * Haven ships grass and shrub sets): each piece is re-centred and every item uses one of them.
 */
export function PhScatter({ id, items, height, variants = false, castShadow = true, handheld = false, leafAlphaCutoff }: { id: string; items: ScatterItem[]; height?: number; variants?: boolean; castShadow?: boolean; handheld?: boolean; leafAlphaCutoff?: number }) {
  const src = usePhModel(id, handheld);
  const { parts, ownedMaterials } = useMemo(() => {
    const ownedMaterials = new Map<THREE.Material, THREE.Material>();
    const asCutout = (material: THREE.Material) => {
      if (leafAlphaCutoff === undefined || !material.transparent) return material;
      const existing = ownedMaterials.get(material);
      if (existing) return existing;
      const cutout = material.clone();
      cutout.alphaTest = leafAlphaCutoff;
      cutout.transparent = false;
      cutout.depthWrite = true;
      ownedMaterials.set(material, cutout);
      return cutout;
    };
    const parts: Part[] = [];
    if (!src) return { parts, ownedMaterials };
    src.updateMatrixWorld(true);
    const rootInv = new THREE.Matrix4().copy(src.matrixWorld).invert();
    src.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      const local = new THREE.Matrix4().multiplyMatrices(rootInv, m.matrixWorld);
      if (variants) {
        m.geometry.computeBoundingBox();
        const box = m.geometry.boundingBox!.clone().applyMatrix4(local);
        const c = box.getCenter(new THREE.Vector3());
        local.premultiply(new THREE.Matrix4().makeTranslation(-c.x, -box.min.y, -c.z));
      }
      const material = Array.isArray(m.material) ? m.material.map(asCutout) : asCutout(m.material);
      parts.push({ geometry: m.geometry, material, local });
    });
    return { parts, ownedMaterials };
  }, [src, variants, leafAlphaCutoff]);
  useEffect(() => () => { ownedMaterials.forEach((material) => material.dispose()); }, [ownedMaterials]);
  const base = useMemo(() => (src && height && !variants ? height / modelHeight(src) : 1), [src, height, variants]);
  const groups = useMemo(() => {
    if (!variants) return parts.map((p) => ({ part: p, items }));
    const buckets: ScatterItem[][] = parts.map(() => []);
    items.forEach((it, i) => buckets[(i * 7 + 3) % parts.length]?.push(it));
    return parts.map((p, i) => ({ part: p, items: buckets[i] })).filter((g) => g.items.length > 0);
  }, [parts, items, variants]);
  if (!src || items.length === 0) return null;
  return (
    <group>
      {groups.map((g, i) => (
        <ScatterPart key={i} part={g.part} items={g.items} base={base} castShadow={castShadow} />
      ))}
    </group>
  );
}

function ScatterPart({ part, items, base, castShadow }: { part: Part; items: ScatterItem[]; base: number; castShadow: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    items.forEach((it, i) => {
      const s = base * (it.scale ?? 1);
      m.compose(new THREE.Vector3(...it.position), q.setFromAxisAngle(up, it.rotationY ?? 0), new THREE.Vector3(s, s, s));
      m.multiply(part.local);
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [items, base, part]);
  return <instancedMesh ref={ref} args={[part.geometry, part.material, items.length]} castShadow={castShadow} receiveShadow userData={{ noCastShadow: !castShadow }} />;
}

/** True once a scanned model has loaded (to swap a procedural stand-in out) */
export function usePhReady(id: string): boolean {
  return usePhModel(id) !== null;
}

/** Deterministic random scatter in a ring around the hall, avoiding a keep-out square */
export function ringScatter(count: number, inner: number, outer: number, seed: number, scale: [number, number] = [0.8, 1.3]): ScatterItem[] {
  let s = (seed * 2654435761) >>> 0;
  const r = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
  const out: ScatterItem[] = [];
  let guard = 0;
  while (out.length < count && guard++ < count * 20) {
    const x = (r() * 2 - 1) * outer;
    const z = (r() * 2 - 1) * outer;
    const d = Math.max(Math.abs(x), Math.abs(z));
    if (d < inner || Math.hypot(x, z) > outer) continue;
    out.push({ position: [x, 0, z], rotationY: r() * Math.PI * 2, scale: scale[0] + r() * (scale[1] - scale[0]) });
  }
  return out;
}

/** The camera, exposed for components that need it */
export function useCam() {
  return useThree((s) => s.camera);
}
