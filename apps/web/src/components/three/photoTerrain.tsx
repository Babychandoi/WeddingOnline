'use client';

import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { IS_HANDHELD } from './deviceTier';
import { JejuCoast } from './JejuCoast';
import { JejuOffshoreCliffs } from './JejuOffshoreCliffs';
import { detailNormal, detailRoughness } from './pbr';
import { PhScatter, usePhSurface, type PhSurfaceKind, type ScatterItem } from './phAssets';
import { lavenderRowColor, tulipRowColor } from './photoCropPalette';
import { hasPhotoRockOutcrops, PhotoRockOutcrops } from './PhotoRockOutcrops';
import { InstancedSet } from './realProps';

export type TerrainStyle = 'coast' | 'karst' | 'lake' | 'alpine' | 'fjord' | 'volcanic' | 'dune' | 'canyon' | 'terraces' | 'field' | 'meadow' | 'river';

interface TerrainPalette {
  primary: string;
  secondary: string;
  accent: string;
  shadow: string;
}

interface TerrainProps {
  style: TerrainStyle;
  seed: number;
  variant: string;
  palette: TerrainPalette;
}

// Coordinates are in metres around the 30 m ceremony floor. Width and depth are half-extents.
type Relief = [x: number, z: number, width: number, depth: number, height: number];
const BUILDING_SITES: Record<string, [number, number, number, number]> = {
  us_vegas: [0, -23.83, 5.6, 5.4],
  us_barn: [-11.78, -23.73, 6.55, 5.85],
  us_napa: [-11.78, -23.73, 6.55, 5.85],
};
const REFERENCE_RELIEF: Record<string, Relief[]> = {
  vn_phu_quoc_beach: [[62, -63, 52, 31, 15], [115, -94, 50, 37, 23], [9, -108, 49, 26, 13], [178, -134, 59, 49, 24]],
  vn_da_lat: [[-38, -47, 49, 36, 9], [52, -78, 63, 51, 18], [-79, -116, 72, 54, 19]],
  vn_mu_cang_chai: [[-31, -61, 46, 40, 21], [31, -56, 34, 36, 18], [76, -106, 57, 48, 35], [-108, -119, 58, 53, 38]],
  no_fjord: [[-61, -63, 52, 84, 47], [74, -74, 59, 131, 70], [-94, -143, 68, 105, 66], [112, -205, 69, 58, 88], [-36, -222, 68, 46, 51]],
  ch_lake: [[-83, -67, 58, 40, 41], [53, -114, 60, 40, 38], [-28, -169, 96, 52, 51]],
  ca_rockies: [[-67, -129, 48, 49, 46], [-37, -151, 36, 48, 68], [-6, -146, 33, 42, 55], [21, -139, 35, 49, 60], [54, -118, 39, 51, 58], [79, -109, 36, 49, 53], [104, -123, 39, 53, 58]],
  ar_patagonia: [[-85, -140, 45, 39, 45], [-39, -157, 22, 39, 88], [-13, -152, 15, 29, 64], [6, -157, 10, 26, 48], [26, -161, 19, 31, 58], [57, -140, 54, 44, 30]],
  is_black_sand: [[-70, -80, 53, 58, 30], [-99, -106, 64, 62, 34], [-2, -104, 6, 6.9, 12], [8, -110, 4.1, 4.9, 17], [17, -113, 4.6, 5.2, 11]],
  kr_jeju: [], // Offshore cliffs are a separate mesh so the walls don't soften into the ground grid.
  pf_bora_bora: [[-20, -110, 38, 26, 36], [13, -126, 29, 29, 61], [40, -138, 32, 23, 46], [59, -125, 40, 32, 27]],
  br_rio: [[-102, -107, 70, 62, 47], [-59, -94, 55, 50, 37], [67, -147, 24, 29, 27], [94, -152, 22, 23, 20]],
  gt_atitlan: [[-70, -135, 66, 61, 65], [32, -166, 58, 48, 58], [78, -195, 60, 49, 61]],
  et_highlands: [[-65, -67, 47, 35, 35], [45, -97, 55, 48, 44], [88, -143, 54, 48, 56], [-80, -175, 73, 53, 64]],
  ae_desert: [[-62, -48, 68, 29, 12], [19, -70, 50, 30, 9], [71, -107, 74, 42, 17], [-56, -132, 68, 37, 12]],
  cl_atacama: [[-56, -67, 58, 32, 15], [-16, -106, 61, 33, 11], [62, -55, 46, 26, 16], [88, -105, 59, 32, 13]],
  tr_cappadocia: [[-49, -72, 36, 29, 16], [52, -87, 37, 34, 15], [2, -129, 71, 53, 28]],
  jo_wadi_rum: [[-84, -115, 51, 34, 14], [-41, -110, 35, 29, 12], [38, -91, 26, 26, 25], [66, -106, 42, 39, 33], [110, -148, 60, 41, 43]],
  gr_santorini: [[-61, -60, 26, 32, 3], [37, -44, 31, 41, 7], [56, -65, 48, 39, 11], [78, -81, 38, 37, 11]],
  au_outback: [[-51, -95, 47, 24, 30], [-8, -103, 48, 25, 48], [53, -120, 50, 34, 37], [98, -167, 44, 57, 50]],
  fr_provence: [[-55, -104, 64, 44, 8], [82, -139, 89, 52, 13]],
  nl_tulips: [[-61, -162, 84, 40, 2], [66, -147, 53, 46, 2]],
  pe_andes: [[-78, -71, 62, 43, 36], [40, -88, 65, 42, 29], [105, -146, 65, 47, 52]],
  fi_lapland: [[-63, -78, 55, 46, 6], [70, -95, 63, 53, 9]],
  jp_hokkaido_snow: [[-61, -75, 69, 44, 7], [79, -115, 81, 44, 11]],
  jp_sakura: [[-69, -81, 49, 33, 12], [71, -118, 56, 47, 16]],
};

const WATER_LEVEL = -0.035;
const FLOOR_MARGIN = 15.5;
const HORIZON = 860;
const GROUND_NORMAL_SCALE = new THREE.Vector2(0.56, 0.56);
const smooth = THREE.MathUtils.smoothstep;
const clamp = THREE.MathUtils.clamp;
const mix = THREE.MathUtils.lerp;

function random(x: number, z: number, seed: number) {
  const value = Math.imul(x + seed, 1597334677) ^ Math.imul(z - seed, 3812015801);
  return (Math.imul(value ^ (value >>> 16), 0x45d9f3b) >>> 0) / 4294967295;
}

function noise(x: number, z: number, seed: number) {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const u = smooth(x - ix, 0, 1);
  const v = smooth(z - iz, 0, 1);
  return mix(mix(random(ix, iz, seed), random(ix + 1, iz, seed), u), mix(random(ix, iz + 1, seed), random(ix + 1, iz + 1, seed), u), v);
}

function rockNoise(x: number, z: number, seed: number) {
  return (noise(x, z, seed) * 0.60 + noise(x * 2.13, z * 2.13, seed + 7) * 0.30 + noise(x * 4.06, z * 4.06, seed + 17) * 0.10) - 0.5;
}

function isSea(style: TerrainStyle, variant: string) {
  return style === 'coast' || style === 'karst' || variant === 'is_black_sand' || variant === 'kr_jeju';
}

function waterDistance(style: TerrainStyle, variant: string, seed: number, x: number, z: number): number | undefined {
  if (!isSea(style, variant) && style !== 'fjord' && style !== 'river' && style !== 'lake') return undefined;
  const bend = Math.sin(x * 0.037 + seed % 13) * 2.5 + Math.sin(x * 0.095) * 1.1 + rockNoise(x * 0.11, 2.2, seed) * 2.2;
  if (isSea(style, variant)) {
    // The diagonal pale sand at Bãi Sao and its raised cape are visible from the side of the hall.
    const bay = variant === 'vn_phu_quoc_beach' ? 4.6 * Math.tanh(x * 0.035) : 0;
    return z + 25.5 - bend - bay;
  }
  if (style === 'fjord') {
    const channel = Math.abs(x - Math.sin(z * 0.022) * 15.0) - (17.5 + 0.11 * Math.abs(Math.min(0, z)));
    return Math.max(channel, z + 24.2 - bend);
  }
  if (style === 'river') {
    const nearShore = -24.7 + bend;
    const farShore = nearShore - (22.5 + 7.2 * Math.cos(x * 0.028));
    return Math.max(z - nearShore, farShore - z);
  }
  if (style === 'lake') {
    const edge = Math.hypot((x + 12 + bend) * 0.72, (z + 79) * 0.98);
    return edge - 54;
  }
  return undefined;
}

function ambientRelief(style: TerrainStyle, seed: number, x: number, z: number) {
  const small = rockNoise(x * 0.10, z * 0.10, seed);
  const broad = rockNoise(x * 0.018, z * 0.018, seed + 61);
  if (style === 'dune') {
    const warp = z * 0.19 + x * 0.067 + 1.6 * Math.sin(x * 0.033) + broad * 3.1;
    const crest = 0.5 + 0.5 * Math.sin(warp);
    return 2.2 + crest ** 2.7 * (2.9 + broad * 2.1) + small * 0.83;
  }
  if (style === 'volcanic' || style === 'canyon') return 0.65 + broad * 1.82 + small * 0.82;
  if (style === 'field') return 0.27 + broad * 0.88 + small * 0.21;
  if (style === 'meadow') return 0.7 + broad * 2.2 + small * 0.35;
  return 0.47 + broad * 1.39 + small * 0.38;
}

interface TerrainShape {
  readHeight: (x: number, z: number) => number;
  sea: boolean;
  water: boolean;
}

function shapeTerrain(style: TerrainStyle, variant: string, seed: number): TerrainShape {
  const sea = isSea(style, variant);
  const water = sea || style === 'lake' || style === 'river' || style === 'fjord';
  const snowSummits = SNOWY.includes(variant);
  const tropicalBeach = TROPICAL.includes(variant);
  const steep = snowSummits || style === 'alpine' || style === 'fjord' || style === 'volcanic' || style === 'karst';
  const terraces = style === 'terraces';
  const mesas = style === 'canyon';
  const dunes = style === 'dune';
  const reykjanes = variant === 'is_black_sand';
  const jeju = variant === 'kr_jeju';
  const glacial = variant === 'ca_rockies' || variant === 'ar_patagonia';
  const sedimentary = variant === 'cl_atacama' || variant === 'jo_wadi_rum';
  const dalat = variant === 'vn_da_lat';
  const buildingSite = BUILDING_SITES[variant];
  const baseRise = steep ? 35 : terraces ? 19 : mesas ? 17 : dunes ? 7 : water ? 8 : 11;
  const mainRidges = REFERENCE_RELIEF[variant] ?? [-95, -42, 22, 82, 131].map((x, i): Relief => [
    x + (random(i, 12, seed) - 0.5) * 19,
    -(water ? 112 : 82) - random(i, 6, seed) * 45,
    28 + 36 * random(i, 18, seed),
    28 + 36 * random(i, 27, seed),
    baseRise * (0.58 + 0.92 * random(i, 9, seed)),
  ]);
  const sideRise = jeju ? 1.3 : water ? baseRise * 0.19 : baseRise * 0.56;
  const slopes: Relief[] = [
    ...mainRidges,
    ...[-1, 1].flatMap((side): Relief[] => [
      [side * 86, -4, 63, 76, sideRise],
      [side * 121, 64, 76, 90, sideRise * 1.26],
      [side * 58, 107, 83, 60, sideRise * 0.67],
    ]),
  ];
  const hills = slopes.map(([x, z, width, depth, height], i) => ({
    x, z, width, depth, height, phase: random(i, 41, seed) * Math.PI * 2,
  }));

  function readHeight(x: number, z: number) {
    const distance = Math.max(Math.abs(x), Math.abs(z));
    if (distance < FLOOR_MARGIN) return -0.025;
    const shoreRange = water ? waterDistance(style, variant, seed, x, z) : undefined;
    let floor = ambientRelief(style, seed, x, z);
    if (dalat) floor += rockNoise(x * 0.19, z * 0.16, seed + 24) * 0.92;
    if (jeju) floor = floor * 0.66 + rockNoise(x * 0.29, z * 0.30, seed + 125) * 0.86;
    if (shoreRange !== undefined && shoreRange < 6.8) {
      const slope = tropicalBeach && shoreRange < 0 ? 0.046 : 0.23;
      floor = mix(WATER_LEVEL + Math.tanh(shoreRange * slope) * (shoreRange > 0 ? 0.42 : 2.7), floor, smooth(shoreRange, 1.7, 6.8));
      if (jeju && Math.abs(x) < 52) {
        const channels = (0.5 + 0.5 * Math.sin(x * 0.96 + Math.sin(x * 0.27) * 1.2 - shoreRange * 0.38)) ** 3;
        const intertidal = smooth(shoreRange, -0.67, 0.22) * (1 - smooth(shoreRange, 0.72, 2.53));
        floor -= channels * intertidal * 0.25;
      }
    }
    const fold = rockNoise(x * 0.054, z * 0.054, seed + 29);
    let height = 0;
    for (const [index, hill] of hills.entries()) {
      const u = (x - hill.x) / hill.width;
      const v = (z - hill.z) / hill.depth;
      if (Math.abs(u) > 1.25 || Math.abs(v) > 1.25) continue;
      const azimuth = Math.atan2(v, u);
      const petals = 1 + 0.12 * Math.cos(azimuth * 3 + hill.phase) + 0.07 * Math.sin(azimuth * 5 - hill.phase);
      const radius = Math.hypot(u, v) / petals;
      if (radius >= 1) continue;
      const profile = 1 - radius ** 1.6;
      const ridge = Math.abs(Math.sin(azimuth * 3.5 + hill.phase + radius * 2.0));
      let farSurface = steep ? (snowSummits ? (1 - radius) ** 0.94 : profile ** 1.46) * (0.74 + ridge * 0.29 + fold * 0.36)
        : mesas ? profile ** 0.35 * (0.88 + ridge * 0.11 + fold * 0.20)
        : dunes ? profile ** (1.56 + Math.max(0, v) * 1.25)
        : profile ** 1.32 * (0.95 + 0.24 * fold);
      if (index < mainRidges.length) {
        if (reykjanes) farSurface = index < 2 ? (1 - smooth(radius, 0.69, 0.97)) * (0.94 + fold * 0.15)
          : profile ** 0.48 * (0.68 + 0.38 * (1 - radius) + fold * 0.09);
        if (glacial) {
          const gully = Math.abs(Math.sin(azimuth * 4.5 + hill.phase + fold));
          const ribs = rockNoise(u * 8.8 + 5, v * 4.8 + 7, seed + index * 29);
          farSurface = (1 - radius) ** (variant === 'ar_patagonia' ? 0.59 : 0.84) * (0.73 + gully * 0.35 + ribs * 0.37);
        }
        if (sedimentary) {
          const shelf = (1 - smooth(radius + fold * 0.12, 0.45, 1)) ** 0.56;
          const gullies = Math.sin(azimuth * 12 + hill.phase + fold * 5) * 0.08;
          farSurface = shelf * (0.89 + fold * 0.23 + gullies * smooth(radius, 0.18, 0.65));
        }
      }
      height = Math.max(height, farSurface * hill.height);
    }
    height += smooth(height, 2, 11) * (0.65 + height * 0.019) * rockNoise(x * 0.37, z * 0.37, seed + 36);
    if (terraces) {
      const level = (height + floor) * 0.69;
      height = mix(height, (Math.floor(level) + smooth(level % 1, 0.80, 0.97)) / 0.69 - floor, smooth(height, 1.1, 5.1));
    }
    const horizon = shoreRange !== undefined && shoreRange < 0 ? -2.65 : -0.025;
    let outer = mix(floor + height, horizon, smooth(distance, 285, 665));
    if (buildingSite) {
      const [bx, bz, width, depth] = buildingSite;
      const outside = Math.max(Math.abs(x - bx) / width, Math.abs(z - bz) / depth);
      outer = mix(-0.025, outer, smooth(outside, 1, 1.85));
    }
    return mix(-0.025, outer, smooth(distance, FLOOR_MARGIN, 22));
  }

  return { readHeight, sea, water };
}

const terrainShapes = new Map<string, TerrainShape>();

function terrainShape(style: TerrainStyle, seed: number, variant: string) {
  const key = `${style}:${variant}:${seed}`;
  let shape = terrainShapes.get(key);
  if (!shape) {
    shape = shapeTerrain(style, variant, seed);
    if (terrainShapes.size >= 32) terrainShapes.delete(terrainShapes.keys().next().value!);
    terrainShapes.set(key, shape);
  }
  return shape;
}

export function samplePhotoTerrainHeight(style: TerrainStyle, seed: number, variant: string, x: number, z: number) {
  return terrainGridHeight(terrainShape(style, seed, variant), x, z);
}

function gridAxis() {
  const near = IS_HANDHELD ? 2.1 : 1.35;
  const mid = IS_HANDHELD ? 4.9 : 3.1;
  const far = IS_HANDHELD ? 12.7 : 8.1;
  const axis = new Set([FLOOR_MARGIN, 22, 49, 148, 290, 390, 530, 660, HORIZON]);
  for (let v = near; v < 49; v += near) axis.add(v);
  for (let v = 49 + mid; v < 148; v += mid) axis.add(v);
  for (let v = 148 + far; v < 290; v += far) axis.add(v);
  const sorted = Array.from(axis).sort((a, b) => a - b);
  return [...sorted.map((value) => -value).reverse(), 0, ...sorted];
}

const AXIS = gridAxis();

function cellAt(point: number) {
  let low = 0;
  let high = AXIS.length - 1;
  while (high - low > 1) {
    const mid = (high + low) >>> 1;
    if (AXIS[mid] > point) high = mid;
    else low = mid;
  }
  return low;
}

// Sample the same triangles as the mesh so roots and crop beds stay on the actual slope.
function terrainGridHeight(shape: TerrainShape, x: number, z: number) {
  const col = cellAt(x);
  const row = cellAt(z);
  const x0 = AXIS[col], x1 = AXIS[col + 1], z0 = AXIS[row], z1 = AXIS[row + 1];
  const u = clamp((x - x0) / (x1 - x0), 0, 1);
  const v = clamp((z - z0) / (z1 - z0), 0, 1);
  const b = shape.readHeight(x1, z0);
  const c = shape.readHeight(x0, z1);
  if (u + v <= 1) return b * u + c * v + shape.readHeight(x0, z0) * (1 - u - v);
  return b * (1 - v) + c * (1 - u) + shape.readHeight(x1, z1) * (u + v - 1);
}

const ROCK_STYLES: TerrainStyle[] = ['volcanic', 'karst', 'alpine', 'fjord', 'canyon'];
const SNOWY: string[] = ['at_alps', 'ch_lake', 'ca_rockies', 'ar_patagonia', 'np_himalaya'];
const WINTER: string[] = ['jp_hokkaido_snow', 'fi_lapland'];
const TROPICAL: string[] = ['vn_phu_quoc_beach', 'ph_tropical', 'tz_zanzibar', 'mx_tulum', 'us_hawaii', 'fj_island', 'pf_bora_bora', 'ws_fale'];
const BEACH_FLOOR = new Set([...TROPICAL.filter((id) => id !== 'pf_bora_bora'), 'br_rio', 'jm_caribbean', 'is_black_sand']);
const BASALT_COAST = new Set(['is_black_sand', 'kr_jeju']);

function colorTerrain(geometry: THREE.BufferGeometry, style: TerrainStyle, seed: number, variant: string, palette: TerrainPalette) {
  const blackSand = variant === 'is_black_sand';
  const winterGround = WINTER.includes(variant);
  const snowyPeaks = SNOWY.includes(variant);
  const beachFloor = BEACH_FLOOR.has(variant);
  const warmRock = style === 'canyon';
  const stoneSlope = snowyPeaks || ROCK_STYLES.includes(style);
  const exposed = new THREE.Color(palette.secondary);
  const earth = new THREE.Color(palette.shadow).lerp(exposed, 0.53);
  let grass = new THREE.Color('#68774a').lerp(new THREE.Color(palette.primary), 0.47);
  let canopy = new THREE.Color('#394e2f').lerp(new THREE.Color(palette.primary), 0.21);
  let stone = new THREE.Color('#777365').lerp(exposed, 0.43);
  let sand = new THREE.Color('#e5d2a6').lerp(exposed, 0.32);
  if (warmRock) {
    const red = variant === 'au_outback' ? '#b76038' : variant === 'jo_wadi_rum' ? '#a16844' : '#ad825e';
    stone = new THREE.Color(red).lerp(exposed, 0.46);
    grass = new THREE.Color(red).lerp(earth, 0.24);
  }
  if (blackSand) {
    grass = new THREE.Color('#3b4039').lerp(earth, 0.24);
    stone = new THREE.Color('#494850').lerp(earth, 0.28);
    sand = new THREE.Color('#3c3b3c').lerp(earth, 0.18);
  }
  if (TROPICAL.includes(variant)) {
    sand.lerp(new THREE.Color('#eee5cc'), 0.71);
    grass.set('#6a7b42').lerp(new THREE.Color(palette.secondary), 0.31);
    canopy.set('#304629').lerp(new THREE.Color(palette.shadow), 0.28);
  }
  const snow = new THREE.Color('#e7edf0');
  const basalt = new THREE.Color('#343a3b');
  const salt = new THREE.Color('#d5c8a9');
  const shale = new THREE.Color('#575b66');
  const forestSoil = new THREE.Color('#8d8061');
  const headlandGrass = canopy.clone().lerp(grass, 0.59);
  const tint = new THREE.Color();
  const points = geometry.getAttribute('position');
  const normals = geometry.getAttribute('normal');
  const colors = new Float32Array(points.count * 3);
  for (let i = 0; i < points.count; i++) {
    const x = points.getX(i);
    const y = points.getY(i);
    const z = points.getZ(i);
    const slope = 1 - normals.getY(i);
    const broad = rockNoise(x * 0.063, z * 0.063, seed + 251);
    const patches = rockNoise(x * 0.24, z * 0.24, seed + 79);
    const wet = waterDistance(style, variant, seed, x, z);
    const strata = Math.sin(y * (warmRock ? 1.1 : 0.46) + x * 0.031 + broad * 1.8) * 0.086;
    const land = smooth(y, 1.1, 9.5);
    tint.copy(grass).lerp(canopy, land * (0.28 + broad * 0.52));
    if (style === 'field') tint.lerp(earth, 0.34 + broad * 0.24);
    if (style === 'dune') tint.copy(sand).lerp(exposed, clamp(0.41 + broad * 0.61, 0, 1));
    if (stoneSlope) tint.lerp(stone, Math.max(warmRock ? 0.56 : 0, smooth(slope + broad * 0.19, 0.15, 0.58)));
    if (style === 'terraces') {
      const shelf = (1 - smooth(slope, 0.04, 0.25)) * smooth(y, 0.4, 2.6);
      const rim = smooth(0.69 * y % 1, 0.74, 0.97);
      tint.lerp(exposed, shelf * (0.65 + broad * 0.36));
      tint.lerp(earth, Math.max(rim * smooth(y, 0.7, 4.0) * 0.85, smooth(slope, 0.045, 0.37) * 0.88));
    }
    if (wet !== undefined) {
      const isSurf = isSea(style, variant);
      const strip = isSurf ? (variant === 'vn_phu_quoc_beach' ? 14 : 9.5) : 3.5;
      const nearWater = variant === 'vn_phu_quoc_beach' ? (1 - smooth(y + patches * 0.95, 0.75, 2.2))
        : (1 - smooth(wet + patches * 1.9, strip * 0.30, strip)) * (1 - smooth(y, 0.4, 3.8));
      const drySand = beachFloor ? (1 - smooth(y, 0.58, 3.4)) * (1 - smooth(z, 16, 39)) * (1 - smooth(Math.abs(x), 19, 48)) : 0;
      tint.lerp(isSurf ? sand : earth, Math.max(drySand, nearWater)).multiplyScalar(1 - 0.30 * (1 - smooth(wet, -1.9, 1.2)) * nearWater);
    }
    if (snowyPeaks) tint.lerp(snow, smooth(y + broad * 15 - slope * 14, 23, 44) * (1 - smooth(slope, 0.44, 0.81) * 0.75));
    if (winterGround) tint.lerp(snow, 0.86 - slope * 0.30 + broad * 0.07);
    if (BASALT_COAST.has(variant) && wet !== undefined) {
      const headland = smooth(y + patches * 5, 11, 22) * (1 - smooth(slope, 0.08, 0.58));
      const coast = 1 - smooth(wet + broad * 8, -5, variant === 'kr_jeju' ? 29 : 36);
      tint.lerp(basalt, Math.max(coast * (1 - headland), smooth(slope, 0.075, 0.47)) * 0.86);
      if (blackSand) tint.lerp(headlandGrass, headland * 0.91);
      if (variant === 'kr_jeju') {
        const exposedBasalt = (1 - smooth(wet + patches * 5, 2.1, 16.8)) * smooth(Math.max(Math.abs(x), Math.abs(z)), 15.5, 19.0);
        tint.lerp(basalt, exposedBasalt * 0.69);
      }
    }
    if (variant === 'vn_da_lat') {
      const woodland = smooth(Math.max(Math.abs(x), Math.abs(z)), 15.4, 22);
      tint.lerp(forestSoil, woodland * smooth(patches + broad * 0.34, -0.07, 0.27) * 0.67);
      tint.lerp(canopy, woodland * smooth(-broad - patches * 0.28, 0.02, 0.21) * 0.49);
    }
    if (variant === 'ca_rockies' || variant === 'ar_patagonia') {
      const seam = Math.sin(y * 1.85 + x * 0.071 + broad * 3.2);
      tint.lerp(shale, smooth(y, 5, 26) * smooth(slope + seam * 0.12, 0.06, 0.41) * 0.49);
    }
    if (variant === 'cl_atacama' || variant === 'jo_wadi_rum') {
      const seam = Math.sin(y * 2.1 + x * 0.064 + broad * 2.2);
      const rock = smooth(slope + patches * 0.11, 0.03, 0.31);
      if (variant === 'cl_atacama') {
        const deposits = smooth(Math.max(Math.abs(x), Math.abs(z)) + y * 2.30, 15.55, 25.2) * smooth(seam + patches * 1.1, -0.15, 0.62);
        tint.lerp(salt, clamp((0.18 + broad + seam * 0.17) * (0.41 + rock * 0.68) + deposits * 0.48, 0, 0.83));
      }
      tint.lerp(earth, rock * smooth(-seam + broad * 0.6, 0.14, 0.88) * 0.59);
    }
    tint.multiplyScalar(1.01 + broad * 0.34 + patches * 0.23 + (warmRock ? strata : strata * 0.33));
    tint.toArray(colors, i * 3);
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
}

function buildTerrain(shape: TerrainShape, { style, seed, variant, palette }: TerrainProps) {
  const axis = AXIS;
  const groundPoints: number[] = [];
  const groundFaces: number[] = [];
  const textures: number[] = [];
  const waterPoints: number[] = [];
  const waterFaces: number[] = [];
  const depths: number[] = [];
  const jeju = variant === 'kr_jeju';
  const waterReach: number[] = jeju ? [] : depths;
  for (const z of axis) {
    for (const x of axis) {
      const height = shape.readHeight(x, z);
      groundPoints.push(x, height, z);
      textures.push(x * 0.185, -z * 0.185);
      if (shape.water) {
        waterPoints.push(x, WATER_LEVEL, z);
        const depth = WATER_LEVEL - height;
        depths.push(depth);
        if (jeju) {
          const runup = z < -17.3 && z > -35 && Math.abs(x) < 55
            && (waterDistance(style, variant, seed, x, z) ?? 5) < 3.2;
          waterReach.push(depth + (runup ? 0.29 : 0));
        }
      }
    }
  }
  for (let row = 1; row < axis.length; row++) {
    for (let col = 1; col < axis.length; col++) {
      const d = row * axis.length + col;
      const c = d - 1;
      const b = d - axis.length;
      const a = b - 1;
      groundFaces.push(a, c, b, b, c, d);
      if (shape.water && Math.max(waterReach[a], waterReach[b], waterReach[c], waterReach[d]) > 0) waterFaces.push(a, c, b, b, c, d);
    }
  }
  const ground = new THREE.BufferGeometry();
  ground.setAttribute('position', new THREE.Float32BufferAttribute(groundPoints, 3));
  ground.setAttribute('uv', new THREE.Float32BufferAttribute(textures, 2));
  ground.setIndex(groundFaces);
  ground.computeVertexNormals();
  colorTerrain(ground, style, seed, variant, palette);
  const water = shape.water ? new THREE.BufferGeometry() : undefined;
  if (water) {
    water.setAttribute('position', new THREE.Float32BufferAttribute(waterPoints, 3));
    water.setAttribute('dryDepth', new THREE.Float32BufferAttribute(depths, 1));
    water.setIndex(waterFaces);
    // The depth/normal pass needs an upward normal even though the water shader builds its own ripples.
    water.computeVertexNormals();
  }
  return { ground, water };
}

const waterVertex = /* glsl */ `
  #include <fog_pars_vertex>
  attribute float dryDepth;
  uniform float time;
  uniform float chop;
  varying vec3 vWorld;
  varying float vDepth;
  void main() {
    vec3 p = position;
    float wave = (sin(p.x * 1.12 - p.z * 3.5 + time * 2.0) + 0.6 * cos(p.x * 3.9 + p.z * 4.4 - time * 2.7)) * chop;
    p.y += wave;
    vDepth = dryDepth + wave;
    vWorld = (modelMatrix * vec4(p, 1.0)).xyz;
    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;

const waterFragment = /* glsl */ `
  #include <fog_pars_fragment>
  uniform vec3 deep;
  uniform vec3 shallow;
  uniform vec3 skyReflection;
  uniform vec3 foamColor;
  uniform float time;
  uniform float surf;
  uniform float lagoon;
  varying vec3 vWorld;
  varying float vDepth;

  float waveHash(vec2 p) {
    vec3 f = fract(vec3(p.xyx) * 0.1031);
    f += dot(f, f.yzx + 33.33);
    return fract((f.x + f.y) * f.z);
  }
  float waveNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(waveHash(i), waveHash(i + vec2(1, 0)), f.x), mix(waveHash(i + vec2(0, 1)), waveHash(i + 1.0), f.x), f.y);
  }
  void main() {
    if (vDepth <= 0.0) discard;
    vec2 w = vWorld.xz;
    vec3 V = normalize(cameraPosition - vWorld);
    float wind = waveNoise(w * 0.44 + vec2(time * 0.10, -time * 0.22));
    vec2 p = w * vec2(3.95, 9.1) + vec2(wind * 1.72 + time * 0.9, time * 1.81);
    float ripples = (waveNoise(p) - 0.5) * 0.68 + (waveNoise(p.yx * 0.47 + time * 0.77) - 0.5) * 0.57;
    float wave = sin(dot(w, vec2(0.71, 3.0)) - time * 2.2 + wind * 4.1) * 0.16;
    float detail = 1.0 / (1.0 + 3.0 * fwidth(w.x) + 5.4 * fwidth(w.y));
    float angle = clamp(V.y + (ripples + wave) * detail * 0.23, 0.0, 1.0);
    float fresnel = pow(1.0 - angle, 4.0);
    float depth = smoothstep(0.07, 2.75, vDepth);
    vec3 water = mix(shallow, deep, depth * (1.0 - lagoon * 0.16));
    water = mix(water, skyReflection, 0.18 + 0.53 * fresnel * (1.0 - lagoon * 0.34));
    water *= 0.94 + wave * (0.27 + lagoon * 0.16) + ripples * detail * (0.21 + lagoon * 0.23);
    float flash = smoothstep(0.24, 0.62, ripples + wave) * (0.26 + fresnel * 0.38) * detail;
    water = mix(water, foamColor, flash);
    float shallows = 1.0 - smoothstep(0.1, 1.55, vDepth);
    float reflectedRipples = smoothstep(0.14, 0.38, ripples + 0.33 * wind - 0.12);
    water += reflectedRipples * detail * shallows * lagoon * vec3(0.043, 0.077, 0.065);
    // Broken bands of foam follow the depth contours, not a straight repeating horizon.
    float breaker = 0.34 + 0.10 * sin(w.x * 0.34 + wind * 6.0 - time * 1.5);
    float lace = (1.0 - smoothstep(0.018, 0.11, abs(vDepth - breaker))) * smoothstep(0.26, 0.79, wind + ripples);
    float wash = (1.0 - smoothstep(0.013, 0.13, vDepth)) * smoothstep(0.14, 0.77, wind);
    water = mix(water, foamColor, surf * clamp(lace * 0.66 + wash * 0.56, 0.0, 1.0));
    gl_FragColor = vec4(water, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    #include <fog_fragment>
  }
`;

function TerrainWater({ geometry, sea, variant, palette }: { geometry: THREE.BufferGeometry; sea: boolean; variant: string; palette: TerrainPalette }) {
  const uniforms = useMemo(() => {
    const tropical = TROPICAL.includes(variant);
    const ice = variant === 'is_black_sand' || variant === 'no_fjord';
    const dark = ['au_sydney', 'hu_budapest', 'hk_harbour'].includes(variant);
    const glacial = variant === 'ca_rockies';
    const water = new THREE.Color(glacial ? '#247c94' : tropical ? '#399aab' : ice ? '#254c60' : '#365e68');
    const blue = new THREE.Color(glacial ? '#47a9af' : tropical ? '#8bcdbb' : ice ? '#7c9da8' : '#648e87');
    const reflection = new THREE.Color(dark ? '#435776' : '#b4c6d2').lerp(new THREE.Color(palette.primary), dark ? 0.40 : 0.24);
    if (dark) {
      water.multiplyScalar(0.30);
      blue.multiplyScalar(0.44);
      reflection.multiplyScalar(0.49);
    }
    return {
      ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
      time: { value: 0 },
      surf: { value: sea && !dark ? 1 : 0 },
      lagoon: { value: tropical ? 1 : 0 },
      chop: { value: sea ? 0.017 : 0.005 },
      deep: { value: water.lerp(new THREE.Color(palette.shadow), 0.13) },
      shallow: { value: blue },
      skyReflection: { value: reflection },
      foamColor: { value: new THREE.Color(dark ? '#7e9aa7' : '#eeeee8') },
    };
  }, [sea, variant, palette]);
  useFrame(({ clock }) => { uniforms.time.value = clock.elapsedTime; });
  return <mesh geometry={geometry} name="reference-shaped-water" userData={{ noCastShadow: true }}>
    <shaderMaterial uniforms={uniforms} vertexShader={waterVertex} fragmentShader={waterFragment} fog toneMapped={false} />
  </mesh>;
}

type Instance = {
  position: [number, number, number];
  scale: [number, number, number];
  rotation?: [number, number, number];
  color: string;
};

function makeTulipCup() {
  const points = [[0.04, 0], [0.38, 0.11], [0.78, 0.37], [1.04, 0.72], [0.98, 0.94], [0.87, 1.13]];
  const shape = new THREE.LatheGeometry(points.map(([r, y]) => new THREE.Vector2(r, y)), 12);
  const position = shape.getAttribute('position');
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);
    const petal = Math.cos(6 * Math.atan2(z, x));
    const scallop = smooth(y, 0.38, 1.04);
    const width = 1 + petal * scallop * 0.105;
    position.setXYZ(i, x * width, y + petal * 0.13 * scallop, z * width);
  }
  shape.computeVertexNormals();
  return shape;
}

const TULIP_CUP = makeTulipCup();
const FIELD_STEM = new THREE.CylinderGeometry(0.65, 1, 1, 5, 1);
const FIELD_SPRIG = new THREE.IcosahedronGeometry(1, 0);
const FIELD_FLOWERS = new THREE.MeshStandardMaterial({ roughness: 0.85, side: THREE.DoubleSide, emissive: '#241216', emissiveIntensity: 0.12 });
const FIELD_GREEN = new THREE.MeshStandardMaterial({ roughness: 0.87 });

function fieldRows(shape: TerrainShape, seed: number, variant: string, palette: TerrainPalette) {
  const tulip = variant === 'nl_tulips';
  const lavender = variant === 'fr_provence';
  const vineyardColors = [palette.secondary, palette.primary, palette.accent];
  const positions: number[] = [];
  const vertexColors: number[] = [];
  const uv: number[] = [];
  const indices: number[] = [];
  const blooms: Instance[] = [];
  const stems: Instance[] = [];
  const count = tulip ? 25 : 47;
  const underside = new THREE.Color(tulip ? '#526734' : lavender ? '#585841' : '#5d6440');
  const tint = new THREE.Color();
  const along = IS_HANDHELD ? 27 : 42;
  const cross = 5;
  // Tulips run across the view in broad bands. Lavender and vines plant down the hill.
  for (let row = 0; row < count; row++) {
    const dye = new THREE.Color(tulip ? tulipRowColor(row) : lavender ? lavenderRowColor(row) : vineyardColors[row % vineyardColors.length]);
    const rowCenter = tulip ? -21 - row * 2.20 : (row - count / 2 + 0.5) * 2.17;
    const width = tulip ? 0.81 : 0.65 + 0.09 * random(row, 3, seed);
    const height = tulip ? 0.29 : lavender ? 0.49 : 0.59;
    const shoulder = lavender && Math.abs(rowCenter) > 16.2 && Math.abs(rowCenter) < 24;
    const base = positions.length / 3;
    for (let j = 0; j <= along; j++) {
      const t = j / along;
      const stretch = tulip ? mix(-87, 87, t) : mix(shoulder ? 13.8 : -20.5, -108, t);
      const weave = Math.sin(stretch * 0.077 + row * 0.31) * 0.19;
      const crown = Math.min(1, t * 19, (1 - t) * 19);
      for (let k = 0; k <= cross; k++) {
        const normalized = k / cross * 2 - 1;
        const offset = rowCenter + normalized * width + weave;
        const x = tulip ? stretch : offset;
        const z = tulip ? offset : stretch;
        const plant = Math.max(0, 1 - normalized ** 2) * crown;
        const patch = random(row * 23 + j, k, seed);
        const near = shoulder ? smooth(z, -23, -12) : 0;
        const y = terrainGridHeight(shape, x, z) + plant * height * (0.90 + 0.20 * patch) * (1 - near * 0.29);
        positions.push(x, y, z);
        tint.copy(underside).lerp(dye, smooth(plant + patch * 0.14, 0.20, 0.78)).multiplyScalar(0.69 + 0.47 * patch);
        tint.toArray(vertexColors, vertexColors.length);
        uv.push(x * 0.30, -z * 0.30);
        if (j === 0 || k === 0) continue;
        const p = base + j * (cross + 1) + k;
        const last = p - cross - 1;
        indices.push(last - 1, last, p - 1, p - 1, last, p);
      }
    }
    if (row >= (tulip ? 17 : count) || (!tulip && !lavender)) continue;
    const countBlooms = tulip ? (IS_HANDHELD ? 55 : 127) : (IS_HANDHELD ? 13 : 34);
    for (let j = 0; j < countBlooms; j++) {
      const phase = (j + random(row, j + 7, seed)) / countBlooms;
      const path = tulip ? mix(-49, 49, phase) : mix(-21.5, -59, phase);
      const weave = Math.sin(path * 0.077 + row * 0.31) * 0.19;
      const offset = rowCenter + (random(row * 13, j + 71, seed) - 0.5) * width * 1.3 + weave;
      const x = tulip ? path : offset;
      const z = tulip ? offset : path;
      if (z > -38) continue;
      const realHeight = height * (1.0 + random(row - 7, j, seed) * 0.38);
      const y = terrainGridHeight(shape, x, z);
      const flower = tulip ? 0.09 + random(j, row, seed) * 0.022 : 0.061;
      const color = dye.clone().offsetHSL((random(j, row + 29, seed) - 0.5) * 0.04, 0.03, (random(row, j, seed) - 0.5) * 0.12);
      blooms.push({ position: [x, y + realHeight, z], rotation: [Math.sin(phase * 65) * 0.19, phase * 60, Math.cos(phase * 47) * 0.17], scale: [flower, flower * (tulip ? 1.25 : 3.1), flower], color: `#${color.getHexString()}` });
      const green = tulip ? '#627b40' : '#485639';
      stems.push({ position: [x, y + realHeight / 2, z], scale: [0.015, realHeight, 0.015], color: green });
    }
  }
  const mesh = new THREE.BufferGeometry();
  mesh.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  mesh.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  mesh.setAttribute('color', new THREE.Float32BufferAttribute(vertexColors, 3));
  mesh.setIndex(indices);
  mesh.computeVertexNormals();
  return { mesh, blooms, stems, tulip };
}

function CropRows({ shape, seed, variant, palette }: { shape: TerrainShape; seed: number; variant: string; palette: TerrainPalette }) {
  const { mesh, blooms, stems, tulip } = useMemo(() => fieldRows(shape, seed, variant, palette), [shape, seed, variant, palette]);
  useEffect(() => () => mesh.dispose(), [mesh]);
  return <>
    <mesh geometry={mesh} name="reference-crop-rows" receiveShadow userData={{ noCastShadow: true }}>
      <meshStandardMaterial vertexColors roughness={0.92} normalMap={detailNormal('leaf')} />
    </mesh>
    {blooms.length > 0 && <>
      <InstancedSet geometry={tulip ? TULIP_CUP : FIELD_SPRIG} material={FIELD_FLOWERS} items={blooms} castShadow={false} />
      <InstancedSet geometry={FIELD_STEM} material={FIELD_GREEN} items={stems} castShadow={false} />
    </>}
  </>;
}

const STONE_GEOMETRY = new THREE.DodecahedronGeometry(1, 1);
const STONE_MATERIAL = new THREE.MeshStandardMaterial({ roughness: 0.94 });

function LooseStone({ seed, shape, palette }: { seed: number; shape: TerrainShape; palette: TerrainPalette }) {
  const { rocks, scannedBoulders, scannedMossRocks } = useMemo(() => {
    const count = IS_HANDHELD ? 65 : 152;
    const pieces: Instance[] = [];
    const boulders: ScatterItem[] = [];
    const mossRocks: ScatterItem[] = [];
    const stone = new THREE.Color('#807163').lerp(new THREE.Color(palette.secondary), 0.31);
    for (let i = 0; i < count; i++) {
      const side = i % 2 ? -1 : 1;
      const x = i % 4 === 0 ? side * (17 + random(i, 7, seed) * 28) : (random(i, 7, seed) - 0.5) * 105;
      const z = i % 4 === 0 ? (random(i, 9, seed) - 0.62) * 47 : -17.2 - random(i, 9, seed) * 33;
      const height = terrainGridHeight(shape, x, z);
      if (height <= WATER_LEVEL + 0.025) continue;
      const radius = 0.048 + random(i, 14, seed) ** 4 * 1.18;
      const y = height + radius * 0.11;
      const col = stone.clone().multiplyScalar(0.64 + random(i, 46, seed) * 0.71);
      pieces.push({ position: [x, y, z], scale: [radius * 1.28, radius * 0.68, radius * 0.86], rotation: [random(i, 24, seed), random(i, 52, seed) * 6.28, -0.37 + random(i, 6, seed)], color: `#${col.getHexString()}` });
      if (i < 16) {
        boulders.push({ position: [x, height - 0.04, z], rotationY: random(i, 52, seed) * 6.28, scale: 0.65 + random(i, 14, seed) * 1.15 });
      } else if (i < 42) {
        mossRocks.push({ position: [x, height - 0.03, z], rotationY: random(i, 31, seed) * 6.28, scale: 0.7 + random(i, 19, seed) * 0.95 });
      }
    }
    return { rocks: pieces, scannedBoulders: boulders, scannedMossRocks: mossRocks };
  }, [seed, shape, palette]);
  return (
    <group>
      <InstancedSet geometry={STONE_GEOMETRY} material={STONE_MATERIAL} items={rocks} castShadow={false} />
      <PhScatter id="boulder_01" items={scannedBoulders} castShadow={!IS_HANDHELD} />
      <PhScatter id="rock_moss_set_01" items={scannedMossRocks} variants handheld castShadow={!IS_HANDHELD} />
    </group>
  );
}

export function PhotoTerrain({ style, seed, variant, palette }: TerrainProps) {
  const shape = useMemo(() => terrainShape(style, seed, variant), [style, seed, variant]);
  const groundHeight = useMemo(() => (x: number, z: number) => terrainGridHeight(shape, x, z), [shape]);
  const coast = useMemo(() => (x: number, z: number) => waterDistance(style, variant, seed, x, z) ?? 0, [style, variant, seed]);
  const { ground, water } = useMemo(() => buildTerrain(shape, { style, seed, variant, palette }), [shape, style, seed, variant, palette]);
  useEffect(() => () => {
    ground.dispose();
    water?.dispose();
  }, [ground, water]);
  const mineral = ROCK_STYLES.includes(style);
  const normal = mineral || style === 'terraces' ? 'stone' : 'micro';
  const surface: PhSurfaceKind = WINTER.includes(variant) ? 'snow'
    : BEACH_FLOOR.has(variant) || style === 'dune' || style === 'canyon' ? 'sand' : 'grass';
  const photo = usePhSurface(surface, 1 / 0.185);
  const jeju = variant === 'kr_jeju';
  return <group name={`reference-terrain-${style}`}>
    <mesh geometry={ground} name="reference-shaped-ground" receiveShadow userData={{ noCastShadow: true }}>
      <meshStandardMaterial
        vertexColors roughness={0.93} map={photo?.map} onBeforeCompile={terrainPhotoDetail}
        roughnessMap={detailRoughness(normal)} normalMap={mineral ? detailNormal(normal) : photo?.normalMap ?? detailNormal(normal)}
        normalScale={GROUND_NORMAL_SCALE}
      />
    </mesh>
    {water && (jeju
      ? <JejuCoast geometry={water} seed={seed} ground={groundHeight} coast={coast} />
      : <TerrainWater geometry={water} sea={shape.sea} variant={variant} palette={palette} />)}
    {jeju && <JejuOffshoreCliffs />}
    {style === 'field' && <CropRows shape={shape} seed={seed} variant={variant} palette={palette} />}
    {!jeju && (hasPhotoRockOutcrops(variant) ? <PhotoRockOutcrops variant={variant} seed={seed} ground={groundHeight} />
      : mineral && <LooseStone seed={seed} shape={shape} palette={palette} />)}
  </group>;
}

function terrainPhotoDetail(shader: THREE.WebGLProgramParametersWithUniforms) {
  // Preserve hand-graded colours from the reference while bringing out the photographed grains and blades.
  const map = THREE.ShaderChunk.map_fragment.replace('diffuseColor *= sampledDiffuseColor;', `
    float grain = dot(sampledDiffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
    diffuseColor.rgb *= 0.75 + sqrt(max(grain, 0.0)) * 0.56;
  `);
  shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', map);
}
