'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { IS_HANDHELD } from './deviceTier';
import { detailNormal } from './pbr';
import { PhScatter, ringScatter, usePhReady, type ScatterItem } from './phAssets';
import { lavenderRowColor, tulipRowColor } from './photoCropPalette';
import { PhotoDalatPines } from './photoDalatPines';
import { bark, leaves, petals } from './realMaterials';
import { InstancedSet } from './realProps';
import { VegetationContactShadows, type VegetationFootprint } from './vegetationContactShadows';

export type PlantStyle = 'pine' | 'broadleaf' | 'birch' | 'blossom' | 'palm' | 'bamboo' | 'cypress' | 'lavender' | 'tulip'
  | 'wildflower' | 'succulent' | 'cedar' | 'tropical' | 'vineyard' | 'barren' | 'acacia' | 'baobab';

type Vec3 = [number, number, number];
type Palette = { primary: string; secondary: string; accent: string; shadow: string };
type Part = { position: Vec3; rotation?: Vec3; quaternion?: THREE.Quaternion; scale: number | Vec3; color: string };
type Ground = (x: number, z: number) => number;
type Random = () => number;
type Canopy = 'pine' | 'birch' | 'broadleaf' | 'blossom' | 'palm' | 'bamboo' | 'cypress' | 'cedar' | 'tropical' | 'acacia' | 'baobab';
type Bloom = 'cherry' | 'daisy' | 'tulip' | 'lavender' | 'bougainvillea';

const UP = new THREE.Vector3(0, 1, 0);
const BARK = bark('#ffffff');
const LEAF = leaves('#ffffff');
const PETAL = petals(true);
const SAKURA_PETAL = PETAL.clone();
SAKURA_PETAL.emissive.set('#5c273e');
SAKURA_PETAL.emissiveIntensity = 0.24;
const BRANCH = new THREE.CylinderGeometry(0.55, 1, 1, IS_HANDHELD ? 5 : 8);
const SHAFT = new THREE.CylinderGeometry(0.91, 1, 1, IS_HANDHELD ? 7 : 11);
const JOINT = new THREE.CylinderGeometry(1, 1, 1, 7);
const HEART = new THREE.IcosahedronGeometry(1, 0);
const DISTANT_LEAF = new THREE.MeshStandardMaterial({
  color: '#ffffff', roughness: 0.96, vertexColors: true,
  normalMap: detailNormal('leaf'), normalScale: new THREE.Vector2(0.4, 0.4),
});
const TAU = 2 * Math.PI;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const FLAT_GROUND: Ground = () => 0;
const EARTH_LIMIT = -0.035;

const CANOPY_PROFILES: Record<Canopy, {
  count: number; height: [number, number]; width: number; trunk: string; greens: [string, string, string]; inset: number;
}> = {
  pine:      { count: 23, height: [5.8, 12.2], width: 0.25, trunk: '#6a4f3b', greens: ['#2c4837', '#406048', '#687d50'], inset: 2.8 },
  birch:     { count: 19, height: [5.2, 10], width: 0.24, trunk: '#cfcabc', greens: ['#557441', '#839647', '#b6a45c'], inset: 2.0 },
  broadleaf: { count: 14, height: [4.7, 8.6], width: 0.36, trunk: '#6e5640', greens: ['#3c6033', '#56723c', '#81934a'], inset: 3.1 },
  blossom:   { count: 12, height: [3.4, 6.2], width: 0.47, trunk: '#725646', greens: ['#5e7138', '#738744', '#8b9852'], inset: 2.5 },
  palm:      { count: 16, height: [4.9, 9.4], width: 0.36, trunk: '#9e927d', greens: ['#42603b', '#607a40', '#84934d'], inset: 3.1 },
  bamboo:    { count: 12, height: [3.9, 7.2], width: 0.20, trunk: '#778b43', greens: ['#556c36', '#71894b', '#a1aa65'], inset: 1.4 },
  cypress:   { count: 18, height: [3.2, 7.1], width: 0.16, trunk: '#68543d', greens: ['#223d39', '#3d5340', '#557347'], inset: 1.7 },
  cedar:     { count: 10, height: [5, 8.5], width: 0.48, trunk: '#695547', greens: ['#314b39', '#496341', '#65784b'], inset: 3.7 },
  tropical:  { count: 13, height: [3.4, 7.7], width: 0.40, trunk: '#796047', greens: ['#275238', '#426440', '#6a8a4d'], inset: 2.7 },
  acacia:    { count: 8, height: [4.5, 7.3], width: 0.61, trunk: '#6e5540', greens: ['#4e5e36', '#6d773b', '#83884a'], inset: 4.2 },
  baobab:    { count: 9, height: [6.8, 11.7], width: 0.40, trunk: '#918371', greens: ['#525f3a', '#687544', '#858451'], inset: 3.6 },
};

const COASTAL = new Set(['vn_phu_quoc_beach', 'ph_tropical', 'mx_tulum', 'tz_zanzibar', 'jm_caribbean', 'us_hawaii', 'ws_fale', 'fj_island',
  'pf_bora_bora', 'th_sala', 'in_kerala', 'mekong_coconut_tent', 'au_sydney', 'br_rio', 'it_amalfi', 'gr_santorini', 'tn_sidi_bou_said']);
const AUTUMN = new Set(['ca_maple', 'ru_birch', 'jp_ryokan_autumn']);
const GARDEN_BEDS = new Set(['uk_garden', 'vn_da_lat', 'ir_persian_garden', 'mx_hacienda', 'vn_gia_tien', 'it_tuscany',
  'ma_riad', 'il_chuppah', 'fr_chateau', 'jp_sakura', 'pt_lisbon', 'it_amalfi', 'kr_jeju']);
const COURTYARDS = new Set(['ir_persian_garden', 'ma_riad', 'es_andalusia', 'mx_hacienda', 'vn_gia_tien', 'vn_hue_imperial', 'gh_kente', 'ng_yoruba',
  'cn_courtyard', 'kr_hanok', 'in_udaipur', 'jp_ryokan_autumn', 'fr_chateau']);
const ROOFTOPS = new Set(['vn_saigon_rooftop', 'us_nyc_rooftop', 'fr_paris', 'hk_harbour']);

function randomFrom(seed: number): Random {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

/** An actual curved leaf surface with a ridged midrib and a rolled tip. */
function bladeShape(width: number, length: number, lift: number, droop: number) {
  const stations = IS_HANDHELD ? 3 : 5;
  const geometry = new THREE.PlaneGeometry(1, 1, 2, stations);
  const position = geometry.getAttribute('position');
  const uv = geometry.getAttribute('uv');
  for (let i = 0; i < position.count; i++) {
    const u = uv.getX(i) * 2 - 1;
    const t = uv.getY(i);
    const span = (Math.sin(Math.PI * t) ** 0.70 * (1.16 - t * 0.31) + 0.006) * width;
    position.setXYZ(i, u * span, t * length, lift * Math.sin(Math.PI * t) - droop * t ** 2 + Math.abs(u) * span * 0.28);
  }
  geometry.computeVertexNormals();
  return geometry;
}

const BROAD_BLADE = bladeShape(0.23, 1, 0.085, 0.24);
const NARROW_BLADE = bladeShape(0.09, 1, 0.055, 0.31);
const ROSETTE_BLADE = bladeShape(0.14, 1, 0.16, 0.24);

function needleSpray() {
  const positions: number[] = [];
  const uv: number[] = [];
  const count = IS_HANDHELD ? 11 : 18;
  for (let n = 0; n < count; n++) {
    const progress = (n + 0.5) / count;
    const height = 0.12 + progress * 0.79;
    const angle = n * GOLDEN_ANGLE;
    const dx = Math.cos(angle);
    const dz = Math.sin(angle);
    const reach = (0.10 + 0.29 * Math.sin(Math.PI * progress) ** 0.65) * (0.78 + 0.21 * Math.sin(n * 8.1) ** 2);
    const width = reach * 0.044;
    const middle = [dx * reach * 0.42, height + reach * 0.28, dz * reach * 0.42];
    const tip = [dx * reach, height + reach * 0.47, dz * reach];
    positions.push(0, height, 0,
      middle[0] + dz * width, middle[1], middle[2] - dx * width,
      ...tip,
      0, height, 0,
      ...tip,
      middle[0] - dz * width, middle[1] + width * 0.6, middle[2] + dx * width);
    uv.push(0.5, 0, 0, 0.4, 0.5, 1, 0.5, 0, 0.5, 1, 1, 0.4);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geometry.computeVertexNormals();
  return geometry;
}

const CONIFER_SPRAY = needleSpray();

function mapleLeaf() {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(-0.2, 0.25);
  shape.lineTo(-0.34, 0.39);
  shape.lineTo(-0.15, 0.46);
  shape.lineTo(-0.46, 0.73);
  shape.lineTo(-0.17, 0.68);
  shape.lineTo(0.01, 1);
  shape.lineTo(0.14, 0.69);
  shape.lineTo(0.43, 0.76);
  shape.lineTo(0.19, 0.47);
  shape.lineTo(0.34, 0.45);
  shape.lineTo(0.22, 0.27);
  shape.closePath();
  const geometry = new THREE.ShapeGeometry(shape);
  const points = geometry.getAttribute('position');
  for (let index = 0; index < points.count; index++) {
    const x = points.getX(index);
    const y = points.getY(index);
    points.setZ(index, Math.sin(y * Math.PI) * 0.12 - Math.abs(x) * 0.29 - y * y * 0.14);
  }
  geometry.computeVertexNormals();
  return geometry;
}

const MAPLE_LEAF = mapleLeaf();

function crownShape() {
  const geometry = new THREE.SphereGeometry(1, IS_HANDHELD ? 10 : 17, IS_HANDHELD ? 7 : 12);
  const position = geometry.getAttribute('position');
  const colors = new Float32Array(position.count * 3);
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);
    const fine = Math.sin(x * 10.3 + z * 3.5) * Math.cos(y * 8.9 - z);
    const wobble = 1 + fine * 0.09 + Math.sin(z * 6.1 + y * 5) * 0.14;
    position.setXYZ(i, x * wobble + y * 0.075, y * wobble + z * 0.082, z * wobble);
    const tone = 0.83 + y * 0.085 + 0.16 * fine + 0.07 * Math.sin(z * 22.71 + x * 13.6);
    colors.set([tone, tone * 1.03, tone * 0.96], i * 3);
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}

const CROWN = crownShape();

function flowerShape(family: Bloom, coarse = false) {
  const style = {
    cherry: { count: 5, rings: 1, radial: 0.029, height: 0.012, width: 0.014, lift: 0.005, rise: 0 },
    daisy: { count: 10, rings: 1, radial: 0.041, height: 0.004, width: 0.008, lift: 0.005, rise: 0 },
    tulip: { count: 3, rings: 2, radial: 0.036, height: 0.072, width: 0.030, lift: 0.019, rise: 0.0015 },
    lavender: { count: 3, rings: 5, radial: 0.013, height: 0.012, width: 0.007, lift: 0.006, rise: 0.016 },
    bougainvillea: { count: 3, rings: 1, radial: 0.045, height: 0.021, width: 0.018, lift: 0.013, rise: 0 },
  }[family];
  const positions: number[] = [];
  const colors: number[] = [];
  const uv: number[] = [];
  const faces: number[] = [];
  const tulip = family === 'tulip';
  const cherry = family === 'cherry';
  const lavender = family === 'lavender';
  const ribs = tulip && !IS_HANDHELD ? [-1, -0.5, 0, 0.5, 1] : [-1, 0, 1];
  const rows = coarse || lavender ? 3 : cherry ? 4 : 6;
  for (let ring = 0; ring < style.rings; ring++) {
    for (let petal = 0; petal < style.count; petal++) {
      const start = positions.length / 3;
      const angle = petal / style.count * TAU + ring * 1.11 + 0.095 * Math.sin(petal * 9 + ring);
      const length = 0.90 + 0.16 * Math.abs(Math.sin(angle * 3.7));
      const reach = lavender ? 1.12 - 0.125 * ring : 1 - 0.1 * ring;
      for (let row = 0; row <= rows; row++) {
        const t = row / rows;
        const belly = Math.sin(Math.PI * t);
        for (const rib of ribs) {
          const edge = Math.abs(rib);
          const lip = t ** 3;
          const rounded = tulip || cherry;
          const span = rounded ? Math.sin(Math.PI * (0.024 + 0.895 * t)) : belly;
          const width = style.width * (0.024 + span ** (tulip ? 0.62 : cherry ? 0.68 : 0.64)) * (0.86 + 0.34 * t) * reach;
          const side = rib * width + 0.12 * style.width * lip * Math.sin(angle);
          const opening = tulip ? Math.sin(t * (1.49 + 0.25 * ring)) : t;
          const radial = style.radial * (0.13 + opening * length * reach)
            - edge ** 2 * width * (tulip ? 0.61 : 0.32)
            - (cherry ? (1 - edge) * lip * 0.003 : 0);
          const ripple = 0.07 * style.width * lip * Math.sin(angle * 2.2 + rib * 5);
          const elevation = style.rise * ring + style.height * t ** 0.90 * length
            + style.lift * belly * (1 - edge ** 1.6) - 0.13 * side * Math.cos(angle) + ripple;
          positions.push(Math.cos(angle) * radial - Math.sin(angle) * side, elevation, Math.sin(angle) * radial + Math.cos(angle) * side);
          // Pigment is denser at the throat; the edge catches light on both sides.
          const throat = cherry ? 0.65 : tulip ? 0.44 : 0.54;
          const tone = throat + (rounded ? (1 - throat) * 0.91 : 0.4) * t ** 0.53 + 0.07 * lip + 0.022 * Math.sin(angle * 6.1);
          colors.push(tone, tone * (0.9 + 0.1 * t), tone * (0.95 + 0.05 * t));
          uv.push((rib + 1) * 0.5, t);
        }
      }
      for (let row = 0; row < rows; row++) {
        for (let rib = 0; rib < ribs.length - 1; rib++) {
          const k = start + row * ribs.length + rib;
          const next = k + ribs.length;
          faces.push(k, next, k + 1, k + 1, next, next + 1);
        }
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(faces);
  geometry.computeVertexNormals();
  return geometry;
}

const BLOOMS: Record<Bloom, THREE.BufferGeometry> = {
  cherry: flowerShape('cherry'),
  daisy: flowerShape('daisy'),
  tulip: flowerShape('tulip'),
  lavender: flowerShape('lavender'),
  bougainvillea: flowerShape('bougainvillea'),
};

/** A handful of small flowers spread around a cherry twig, shared across the crown. */
function cherrySprayShape() {
  const random = randomFrom(204);
  const center = flowerShape('cherry', true);
  const parts = [center];
  const count = IS_HANDHELD ? 5 : 9;
  for (let i = 0; i < count; i++) {
    const angle = i * GOLDEN_ANGLE;
    const radius = 0.048 + random() * 0.082;
    const flower = center.clone();
    const size = 0.66 + random() * 0.40;
    flower.scale(size, size, size);
    flower.rotateX((random() - 0.5) * Math.PI);
    flower.rotateY(angle);
    flower.translate(radius * Math.cos(angle), -0.028 + random() * 0.048, radius * Math.sin(angle));
    parts.push(flower);
  }
  const geometry = mergeGeometries(parts);
  parts.forEach((part) => part.dispose());
  return geometry;
}

const CHERRY_SPRAY = cherrySprayShape();

class PlantInstances {
  footprints: VegetationFootprint[] = [];
  trunks: Part[] = [];
  wood: Part[] = [];
  nodes: Part[] = [];
  broad: Part[] = [];
  narrow: Part[] = [];
  needles: Part[] = [];
  maple: Part[] = [];
  fleshy: Part[] = [];
  cores: Part[] = [];
  distant: Part[] = [];
  cherrySprays: Part[] = [];
  flowers: Record<Bloom, Part[]> = { cherry: [], daisy: [], tulip: [], lavender: [], bougainvillea: [] };
}

function pick(colors: readonly string[], random: Random) {
  return colors[Math.floor(random() * colors.length)];
}

function direction(dx: number, dy: number, dz: number) {
  return new THREE.Vector3(dx, dy, dz);
}

function link(items: Part[], start: THREE.Vector3, end: THREE.Vector3, width: number, color: string) {
  const axis = end.clone().sub(start);
  const length = axis.length();
  items.push({
    position: start.clone().lerp(end, 0.5).toArray(),
    quaternion: new THREE.Quaternion().setFromUnitVectors(UP, axis.normalize()),
    scale: [width, length * 1.025, width],
    color,
  });
}

function leaf(items: Part[], point: THREE.Vector3, vector: THREE.Vector3, size: number, color: string, spin: number, spread = 1) {
  items.push({
    position: point.toArray(),
    quaternion: new THREE.Quaternion().setFromUnitVectors(UP, vector.normalize()).multiply(new THREE.Quaternion().setFromAxisAngle(UP, spin)),
    scale: [size * spread, size, size],
    color,
  });
}

function bloom(items: PlantInstances, family: Bloom, point: THREE.Vector3, size: number, tint: string, random: Random, lean = 1) {
  const orientation = new THREE.Quaternion().setFromEuler(
    new THREE.Euler((random() - 0.5) * lean, random() * TAU, (random() - 0.5) * lean),
  );
  items.flowers[family].push({
    position: point.toArray(),
    quaternion: orientation,
    scale: size,
    color: tint,
  });
  if (family === 'daisy' || family === 'cherry' || family === 'bougainvillea') {
    const radius = (family === 'daisy' ? 0.011 : family === 'cherry' ? 0.004 : 0.005) * size;
    const center = direction(0, radius * 0.56, 0).applyQuaternion(orientation).add(point);
    items.cores.push({
      position: center.toArray(), quaternion: orientation, scale: [radius, radius * 0.55, radius],
      color: family === 'cherry' ? '#d98990' : family === 'daisy' ? '#d0a450' : '#fae7ad',
    });
  }
}

function canPlant(x: number, z: number, ground: Ground, buffer = 0) {
  return Math.max(Math.abs(x), Math.abs(z)) >= 15.55 + buffer && ground(x, z) >= EARTH_LIMIT;
}

function treeSpots(profile: typeof CANOPY_PROFILES[Canopy], kind: Canopy, variant: string, ground: Ground, random: Random) {
  const spots: THREE.Vector3[] = [];
  const courtyard = COURTYARDS.has(variant);
  const coastal = COASTAL.has(variant);
  let count = Math.round(profile.count * (IS_HANDHELD ? 0.65 : 1));
  if (variant === 'mekong_coconut_tent') count += IS_HANDHELD ? 3 : 8;
  if (courtyard || ROOFTOPS.has(variant)) count = Math.min(count, 8);
  const rear = Math.floor(count * (coastal ? 0.20 : 0.47));
  for (let i = 0; i < count; i++) {
    const side = i % 2 ? -1 : 1;
    const isRear = i < rear;
    const row = isRear ? i / Math.max(1, rear - 1) : Math.floor((i - rear) / 2) / Math.max(1, Math.floor((count - rear - 1) / 2));
    const depth = kind === 'pine' ? 11 : kind === 'baobab' ? 7 : 6;
    const inset = profile.inset + (courtyard ? 1.0 : 0);
    let x = isRear ? -29 + row * 59 + (random() - 0.5) * 5 : side * (17.5 + inset + random() * depth);
    let z = isRear ? -19 - inset - random() * depth : -17 + row * (coastal ? 33 : 45) + (random() - 0.5) * 4.2;
    if (kind === 'baobab') {
      x = side * (20.2 + random() * 2.8);
      z = 15 - Math.floor(i / 2) * 10.7 + (random() - 0.5) * 2.8;
    }
    if (variant === 'lb_cedar' && i === 0) {
      x = -6.8;
      z = -22.5;
    }
    // Coastal terraces usually open towards the water. Cluster the taller plants along the sides.
    if (!canPlant(x, z, ground, inset)) {
      z = -12 + row * 28 + (random() - 0.5) * 5;
      x = side * (17 + inset + 5 * random());
    }
    if (canPlant(x, z, ground, inset) && spots.every((p) => Math.hypot(x - p.x, z - p.z) > (kind === 'bamboo' ? 1.1 : 2.2))) {
      spots.push(direction(x, ground(x, z) - 0.05, z));
    }
  }
  return spots;
}

function sprig(items: PlantInstances, from: THREE.Vector3, to: THREE.Vector3, width: number, size: number, green: string, random: Random, count: number) {
  link(items.wood, from, to, width, green);
  for (let i = 0; i < count; i++) {
    const a = i * GOLDEN_ANGLE + random() * 0.45;
    const p = from.clone().lerp(to, (i + 1) / (count + 1));
    const v = direction(Math.cos(a), 0.14 + random() * 0.55, Math.sin(a));
    leaf(items.narrow, p, v, size * (0.63 + random() * 0.63), green, random() * 0.55);
  }
}

function palm(items: PlantInstances, root: THREE.Vector3, height: number, angle: number, profile: typeof CANOPY_PROFILES.palm, random: Random, variant: string) {
  const date = variant === 'eg_nile' || variant === 'il_chuppah';
  const swale = date ? 0.22 + 0.47 * random() : 0.48 + 1.20 * random();
  const atHeight = (t: number) => root.clone().add(direction(Math.cos(angle) * swale * t ** 1.60, height * t, Math.sin(angle) * swale * t ** 1.60));
  const trunkSize = (t: number) => (date ? 0.30 : 0.21) - 0.084 * t + 0.060 * (1 - t) ** 7;
  let base = root.clone();
  const count = 12 + Math.floor(random() * 5);
  for (let i = 0; i < count; i++) {
    const t = (i + 1) / count;
    const next = atHeight(t);
    link(items.trunks, base, next, trunkSize(t - 0.5 / count), profile.trunk);
    base = next;
  }
  const scars = Math.floor(height * (IS_HANDHELD ? 3.7 : 6.2));
  for (let i = 1; i <= scars; i++) {
    const t = (i + random() * 0.28) / (scars + 0.7);
    const axis = atHeight(t + 0.006).sub(atHeight(t - 0.006)).normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(UP, axis);
    const radius = trunkSize(t) * (date ? 1.041 : 0.990 + random() * 0.054);
    items.nodes.push({ position: atHeight(t).toArray(), quaternion: q, scale: [radius, date ? 0.07 : 0.012 + 0.011 * random(), radius], color: i % 4 ? '#8e8676' : '#756a5a' });
  }
  const fronds = IS_HANDHELD ? 11 : 17;
  for (let f = 0; f < fronds; f++) {
    const a = angle + f * GOLDEN_ANGLE + random() * 0.27;
    const length = (2.09 + random() * 0.83) * (height / 7) ** 0.62;
    const inner = f >= fronds * 0.69;
    const rise = length * (inner ? 0.52 + random() * 0.33 : 0.18 + random() * 0.35);
    const fall = length * (inner ? 0.10 + random() * 0.12 : 0.48 + random() * 0.25);
    const old = f < 2;
    const along = direction(Math.cos(a), 0, Math.sin(a));
    const cross = direction(-Math.sin(a), 0, Math.cos(a));
    const randomSide = random();
    const at = (t: number) => base.clone().addScaledVector(along, length * t)
      .addScaledVector(cross, Math.sin(t * Math.PI * 0.7) * length * (randomSide - 0.5) * 0.31)
      .add(direction(0, rise * Math.sin(t * Math.PI * 0.77) - fall * t * t - (old ? 0.15 : 0), 0));
    let last = at(0);
    for (let i = 1; i <= 5; i++) {
      const next = at(i / 5);
      link(items.wood, last, next, (0.052 - i * 0.006) * (height / 7) ** 0.55, '#768450');
      last = next;
    }
    const pairs = IS_HANDHELD ? 7 : 11;
    for (let i = 0; i < pairs; i++) {
      const t = 0.11 + (i / pairs) * 0.85;
      for (const side of [-1, 1]) {
        const tip = at(t + side * 0.008);
        const spread = Math.sin(t * Math.PI) ** 0.75;
        const form = cross.clone().multiplyScalar(side).addScaledVector(along, 0.38 + t * 0.83).add(direction(0, -0.42 - t * 0.24 + random() * 0.14, 0));
        const tint = old && i > pairs * 0.53 ? '#8d8551' : pick(profile.greens, random);
        leaf(items.narrow, tip, form, length * (0.17 + spread * (0.21 + random() * 0.11)), tint, (random() - 0.5) * 0.9, 0.80);
      }
    }
  }
  for (let i = 0; i < 6; i++) {
    const a = i * GOLDEN_ANGLE + angle;
    items.cores.push({ position: base.clone().add(direction(0.16 * Math.sin(a), -0.11 - i % 3 * 0.12, 0.16 * Math.cos(a))).toArray(),
      rotation: [0.15, a, 0.28], scale: [0.07, 0.11, 0.076], color: '#8a8b4c' });
  }
}

function bamboo(items: PlantInstances, root: THREE.Vector3, height: number, angle: number, profile: typeof CANOPY_PROFILES.bamboo, random: Random) {
  const culms = IS_HANDHELD ? 5 : 8;
  for (let i = 0; i < culms; i++) {
    const a = i * GOLDEN_ANGLE + angle;
    const reach = 0.35 + random() * 0.48;
    const h = height * (0.68 + random() * 0.32);
    const base = root.clone().add(direction(Math.cos(a) * reach, 0, Math.sin(a) * reach));
    for (let segment = 0; segment < 8; segment++) {
      const t = segment / 8;
      const next = (segment + 1) / 8;
      const start = base.clone().add(direction(Math.cos(a) * t ** 2 * 0.7, t * h, Math.sin(a) * t ** 2 * 0.7));
      const end = base.clone().add(direction(Math.cos(a) * next ** 2 * 0.7, next * h, Math.sin(a) * next ** 2 * 0.7));
      const radius = 0.056 - t * 0.025;
      link(items.trunks, start, end, radius, profile.trunk);
      items.nodes.push({ position: start.toArray(), scale: [radius * 1.06, 0.037, radius * 1.06], color: '#788049' });
      if (segment > 2) {
        const out = a + segment * GOLDEN_ANGLE;
        sprig(items, start, start.clone().add(direction(Math.cos(out) * 0.84, 0.19, Math.sin(out) * 0.84)), 0.012, 0.42, pick(profile.greens, random), random, IS_HANDHELD ? 5 : 9);
      }
    }
  }
}

function branchedTree(items: PlantInstances, root: THREE.Vector3, kind: Exclude<Canopy, 'palm' | 'bamboo'>, height: number, angle: number,
  variant: string, profile: typeof CANOPY_PROFILES[Canopy], random: Random, flora: string[]) {
  const narrow = kind === 'pine' || kind === 'cypress' || kind === 'cedar';
  const tiered = narrow || kind === 'birch';
  const umbrella = kind === 'acacia' || kind === 'baobab';
  const autumn = AUTUMN.has(variant);
  const maple = autumn && kind === 'broadleaf';
  const tint = variant === 'jp_ryokan_autumn' ? ['#ba482d', '#bc6234', '#de8a3d', '#933832', '#766841']
    : variant === 'ca_maple' ? ['#a95f36', '#b54b32', '#ca9245', '#9c5248', '#776f3e']
      : autumn ? ['#969244', '#b29140', '#8a643c', '#ae753e'] : profile.greens;
  const trunkHeight = tiered ? 0.99 : umbrella ? 0.81 : 0.88;
  const trunkWidth = (kind === 'baobab' ? 0.119 : kind === 'cedar' ? 0.044 : kind === 'birch' ? 0.023 : 0.030) * height;
  const lean = (kind === 'blossom' || kind === 'acacia' ? 0.16 : 0.069) * height * (0.47 + random() * 0.53);
  const axis = (t: number) => root.clone().add(direction(lean * Math.cos(angle + t) * t ** 1.3, t * height, lean * Math.sin(angle + t) * t ** 1.3));
  const trunkSteps = kind === 'birch' ? 13 : 7;
  for (let i = 0; i < trunkSteps; i++) {
    const t = i / trunkSteps * trunkHeight;
    const next = (i + 1) / trunkSteps * trunkHeight;
    const thickness = trunkWidth * ((1 - t / trunkHeight) ** (kind === 'baobab' ? 0.32 : 0.77) * (kind === 'baobab' ? 0.84 : 1) + 0.05);
    const trunkColor = kind === 'birch' && i % 3 === 2 ? '#928e83' : profile.trunk;
    link(items.trunks, axis(t), axis(next), thickness, trunkColor);
    if (kind === 'birch' && i < trunkSteps - 2) {
      const scar = angle + i * GOLDEN_ANGLE;
      const mark = axis(t + 0.03).add(direction(Math.cos(scar) * thickness * 0.8, 0, Math.sin(scar) * thickness * 0.8));
      items.cores.push({ position: mark.toArray(), rotation: [0, -scar, (random() - 0.5) * 0.21], scale: [thickness * 0.29, 0.018 + random() * 0.04, thickness * 0.68], color: '#54514c' });
    }
  }

  for (let i = 0; i < 5; i++) {
    const a = angle + i * GOLDEN_ANGLE;
    const start = axis(0.048);
    const rootLength = trunkWidth * (1.65 + random() * 1.6);
    link(items.wood, start, root.clone().add(direction(Math.cos(a) * rootLength, 0.04, Math.sin(a) * rootLength)), trunkWidth * 0.20, profile.trunk);
  }

  const count = IS_HANDHELD ? (tiered ? 12 : 7) : (tiered ? 17 : 11);
  for (let b = 0; b < count; b++) {
    const progress = b / Math.max(1, count - 1);
    const branchT = tiered ? 0.25 + progress * 0.67 : 0.38 + progress * (umbrella ? 0.33 : 0.40);
    const taper = kind === 'pine' ? (1 - progress * 0.88) ** 0.88 : kind === 'cypress' ? (1 - progress * 0.91) ** 0.69 : kind === 'birch' ? 0.42 + 0.58 * Math.sin(progress * Math.PI) : 1 - progress * 0.22;
    const reach = height * profile.width * taper * (0.64 + random() * 0.43);
    const a = angle + b * GOLDEN_ANGLE + (random() - 0.5) * 0.56;
    const start = axis(branchT);
    const projected = direction(Math.cos(a), 0, Math.sin(a));
    const rise = umbrella ? height * (0.80 + random() * 0.13 - branchT) : reach * (tiered ? -0.10 + random() * 0.22 : 0.30 + random() * 0.42);
    const elbow = start.clone().addScaledVector(projected, reach * 0.49).add(direction(0, rise * 0.64, 0));
    const end = start.clone().addScaledVector(projected, reach).add(direction(0, rise, 0));
    link(items.wood, start, elbow, trunkWidth * (kind === 'baobab' ? 0.36 : 0.22) * (1 - 0.48 * progress), profile.trunk);
    link(items.wood, elbow, end, trunkWidth * (kind === 'baobab' ? 0.22 : 0.105) * (1 - 0.43 * progress), profile.trunk);

    const offshoots = IS_HANDHELD ? 3 : narrow ? 4 : 5;
    for (let t = 0; t < offshoots; t++) {
      const stem = elbow.clone().lerp(end, (t + 0.40) / offshoots);
      const side = (t % 2 ? -1 : 1) * (0.63 + random() * 0.64);
      const endAngle = a + side;
      const spread = Math.min(reach * 0.75, height * 0.235) * (0.42 + 0.65 * random());
      const twig = stem.clone().add(direction(Math.cos(endAngle) * spread, (umbrella ? 0.12 : 0.36) * spread + random() * 0.23, Math.sin(endAngle) * spread));
      link(items.wood, stem, twig, trunkWidth * (kind === 'baobab' ? 0.047 : 0.021), profile.trunk);

      const sprays = maple ? (IS_HANDHELD ? 10 : 19) : IS_HANDHELD ? 5 : narrow ? 8 : 10;
      const greenness = pick(tint, random);
      for (let k = 0; k < sprays; k++) {
        const phase = k * GOLDEN_ANGLE + a;
        const branch = stem.clone().lerp(twig, 0.21 + 0.79 * k / Math.max(1, sprays - 1));
        const flare = (0.08 + spread * (umbrella ? 0.36 : 0.50)) * (0.35 + 0.67 * random());
        const point = branch.clone().add(direction(Math.cos(phase) * flare, (random() - 0.3) * flare * (umbrella ? 0.52 : 1.35), Math.sin(phase) * flare));
        const orientation = direction(Math.cos(phase), (random() - 0.43) * (narrow ? 0.65 : 1.0), Math.sin(phase));
        const length = (maple ? 0.21 : kind === 'tropical' ? 0.67 : kind === 'birch' ? 0.36 : narrow ? 0.61 : 0.56) * (0.57 + random() * 0.69) * (height / 6) ** 0.52;
        if (variant !== 'jp_hokkaido_snow' && (kind !== 'blossom' || k % 5 === 0)) {
          const foliage = maple ? items.maple : narrow ? items.needles : items.broad;
          const sprayWidth = narrow ? (kind === 'cypress' ? 1.48 : 1.23) : 0.92;
          leaf(foliage, point, orientation, length, k % 3 ? greenness : pick(tint, random), random() * TAU, sprayWidth);
          if (!IS_HANDHELD && kind !== 'baobab' && k % 2 === 0) leaf(foliage, point, orientation.clone().negate().setY(0.36), length * 0.81, greenness, random() * TAU, sprayWidth * 0.86);
        }
        if (kind === 'blossom' || (variant === 'mx_hacienda' && t < 3 && k % 3 !== 1)) {
          const family = kind === 'blossom' ? 'cherry' : 'bougainvillea';
          bloom(items, family, point, 1.16 + random() * 1.45, pick(flora, random), random, TAU);
          if (!IS_HANDHELD && kind === 'blossom' && k % 2 === 0) {
            bloom(items, family, point.clone().addScaledVector(orientation, 0.10), 1.1 + random(), pick(flora, random), random, TAU);
          }
        }
      }
    }
  }
}

function flowerColor(palette: Palette, variant: string, kind: Bloom) {
  if (kind === 'cherry') return ['#e4a3bd', '#efbace', '#f7d1da', '#d784a2', '#f5e4e1'];
  if (kind === 'bougainvillea') return ['#b94687', '#d36b9e', '#aa3673', '#e08aaf'];
  const accent = new THREE.Color(palette.accent);
  const hsl = accent.getHSL({ h: 0, s: 0, l: 0 });
  const flowerTint = hsl.s > 0.24 && (hsl.h > 0.72 || hsl.h < 0.17) ? '#' + accent.lerp(new THREE.Color('#f1d6b7'), 0.50).getHexString() : '#e2ae75';
  return variant === 'kr_jeju' ? ['#eec449', '#eed285', '#e8b040'] : ['#e6c1ad', '#ebdfbd', '#f2edda', flowerTint];
}

/** The source shows a weeping cherry behind the temple wall. Build hanging sprays from wood outwards. */
function weepingCherry(items: PlantInstances, ground: Ground, random: Random) {
  const colors = ['#ffc7df', '#f8c4dc', '#f3b4d1', '#fce2eb', '#e9a9cb'];
  const grove = [
    { x: -6.4, z: -24.8, height: 8.2, width: 5.1 },
    { x: 17.5, z: -27.6, height: 5.4, width: 2.9 },
    { x: 20.7, z: -8.2, height: 4.3, width: 2.1 },
    { x: -21.8, z: 4.2, height: 4.7, width: 2.6 },
  ];
  for (const [index, { x, z, height, width }] of grove.entries()) {
    if ((IS_HANDHELD && index === 3) || !canPlant(x, z, ground)) continue;
    const wood = index ? '#5c4b44' : '#493933';
    const base = direction(x, ground(x, z) - 0.035, z);
    items.footprints.push({ position: base.toArray(), radius: 0.64 + width * 0.16, angle: index * GOLDEN_ANGLE });
    const fork = base.clone().add(direction(width * 0.08, height * 0.46, -width * 0.09));
    const shoulder = fork.clone().add(direction(-width * 0.14, height * 0.20, width * 0.13));
    const leader = shoulder.clone().add(direction(-width * 0.09, height * 0.24, width * 0.13));
    link(items.trunks, base, fork, height * 0.027, wood);
    link(items.trunks, fork, shoulder, height * 0.017, wood);
    link(items.wood, shoulder, leader, height * 0.010, wood);

    const branchCount = IS_HANDHELD ? 7 : index === 0 ? 13 : 10;
    for (let branch = 0; branch < branchCount; branch++) {
      const azimuth = branch * GOLDEN_ANGLE + index * 0.71;
      const radial = direction(Math.cos(azimuth), 0, Math.sin(azimuth));
      const side = direction(-radial.z, 0, radial.x);
      const reach = width * (0.59 + 0.40 * random());
      const start = fork.clone().lerp(leader, 0.16 + 0.73 * branch / branchCount);
      const bend = start.clone().addScaledVector(radial, reach * 0.49);
      bend.y += height * (0.08 + 0.07 * random());
      const outer = bend.clone().addScaledVector(radial, reach * 0.54);
      outer.y += height * (random() - 0.68) * 0.16;
      link(items.wood, start, bend, height * 0.009, wood);
      link(items.wood, bend, outer, height * 0.0043, wood);

      const strands = IS_HANDHELD ? 4 : 7;
      for (let strand = 0; strand < strands; strand++) {
        const span = (strand + 0.35) / strands;
        const origin = span < 0.38
          ? start.clone().lerp(bend, 0.40 + span * 1.5)
          : bend.clone().lerp(outer, (span - 0.38) / 0.62);
        const turn = (strand % 2 ? -1 : 1) * width * (0.15 + random() * 0.19);
        const elbow = origin.clone().addScaledVector(side, turn).addScaledVector(radial, reach * 0.18);
        elbow.y += height * (0.05 + (random() - 0.5) * 0.05);
        const tip = elbow.clone().addScaledVector(radial, width * (0.05 + 0.10 * random()));
        tip.y -= height * (0.16 + span * 0.12 + random() * 0.18);
        link(items.wood, origin, elbow, height * 0.0017, wood);
        link(items.wood, elbow, tip, height * 0.0011, wood);
        const sprays = IS_HANDHELD ? 5 : 8;
        for (let i = 0; i < sprays; i++) {
          const progress = i / (sprays - 1);
          const corner = elbow.clone().lerp(tip, progress);
          corner.addScaledVector(side, (random() - 0.5) * width * (0.30 - 0.11 * progress));
          corner.addScaledVector(radial, (random() - 0.5) * width * 0.18);
          corner.y += (random() - 0.5) * height * 0.075;
          const size = (1.86 + 1.12 * random()) * (1 - 0.29 * progress);
          items.cherrySprays.push({
            position: corner.toArray(),
            rotation: [(random() - 0.5) * 2.0, random() * TAU, (random() - 0.5) * 2.0],
            scale: [size * 1.15, size * 1.47, size],
            color: pick(colors, random),
          });
        }
      }
    }
  }

  // The pink canopy is silhouetted by a tall evergreen grove across the back of the garden.
  const evergreenColors = ['#2a4234', '#34503b', '#3c523b'];
  const backdropTrees = IS_HANDHELD ? 14 : 21;
  for (let i = 0; i < backdropTrees; i++) {
    const band = Math.floor(i / 8);
    const x = -25 + (i % 8) * 7.15 + band * 1.6 + (random() - 0.5) * 4.7;
    const z = -34.5 - band * 7.7 - random() * 6.3;
    const y = ground(x, z);
    const height = 8.0 + random() * 7.4;
    const width = 1.6 + random() * 1.15;
    const base = direction(x, y - 0.05, z);
    const top = base.clone().add(direction((random() - 0.5) * 0.48, height * 0.87, (random() - 0.5) * 0.41));
    link(items.trunks, base, top, height * 0.027, '#4e4b3e');
    for (let tier = 0; tier < 6; tier++) {
      const progress = tier / 5;
      const center = base.clone().lerp(top, 0.46 + progress * 0.63);
      const spread = width * (1 - progress * 0.78);
      center.x += (random() - 0.5) * spread * 0.75;
      center.z += (random() - 0.5) * spread;
      items.distant.push({
        position: center.toArray(), rotation: [0, random() * TAU, (random() - 0.5) * 0.28],
        scale: [spread, height * (0.12 + random() * 0.033), spread * (0.68 + 0.4 * random())],
        color: pick(evergreenColors, random),
      });
    }
  }
}

function stemFlower(items: PlantInstances, x: number, y: number, z: number, size: number, tint: string, family: Bloom, random: Random) {
  const lavender = family === 'lavender';
  const tulip = family === 'tulip';
  const greener = pick(lavender ? ['#6d7958', '#718069', '#687654'] : ['#546838', '#708449', '#8a9650', '#577349'], random);
  const foot = direction(x, y, z);
  const tip = foot.clone().add(direction((random() - 0.5) * size * 0.42, size, (random() - 0.5) * size * 0.46));
  const linkPoint = foot.clone().lerp(tip, 0.61).add(direction((random() - 0.5) * size * 0.11, 0, (random() - 0.5) * size * 0.11));
  link(items.wood, foot, linkPoint, size * 0.013, greener);
  link(items.wood, linkPoint, tip, size * 0.008, greener);
  const leafAxis = random() * TAU;
  for (let i = 0; i < 3; i++) {
    const angle = leafAxis + i * (tulip ? 2.8 : 2.1) + random() * 0.55;
    const leafLength = size * (lavender ? 0.25 + random() * 0.19 : 0.41 + random() * 0.31);
    const leafOrigin = foot.clone().lerp(tip, 0.18 + (tulip ? 0.22 : 0.15) * i);
    leaf(lavender ? items.narrow : items.broad, leafOrigin,
      direction(Math.cos(angle), 0.80 + random() * 0.66, Math.sin(angle)), leafLength, greener, random() * 0.82, tulip ? 1.05 : 0.74);
  }
  bloom(items, family, tip, (lavender ? 1.12 : 0.95) + random() * 0.39, tint, random, tulip ? 0.44 : 0.62);
}

function andalusianPlanters(items: PlantInstances, random: Random) {
  const colors = ['#c74879', '#b73246', '#eadcd6', '#d56794'];
  for (const side of [-1, 1]) {
    for (let planter = 0; planter < 5; planter++) {
      // Match the terracotta planters in the Córdoba courtyard kit.
      const x = side * 18.34;
      const z = -23.57 + planter * 1.65;
      const count = IS_HANDHELD ? 9 : 17;
      const color = colors[(planter + (side > 0 ? 1 : 0)) % colors.length];
      for (let i = 0; i < count; i++) {
        const angle = i * GOLDEN_ANGLE + random() * 0.45;
        const radius = 0.22 * Math.sqrt((i + 0.22) / count);
        const height = 0.19 + 0.31 * (1 - radius / 0.24) + random() * 0.12;
        stemFlower(items, x + Math.cos(angle) * radius, 0.65, z + Math.sin(angle) * radius, height, color, 'bougainvillea', random);
      }
    }
  }
}

function cropDetails(items: PlantInstances, family: 'lavender' | 'tulip', ground: Ground, random: Random) {
  const shade = new THREE.Color();
  const plant = (x: number, z: number, color: string) => {
    const height = family === 'tulip' ? 0.35 + random() * 0.24 : 0.50 + random() * 0.14;
    if (canPlant(x, z, ground)) {
      shade.set(color).offsetHSL((random() - 0.5) * 0.020, 0.03, (random() - 0.5) * 0.13 + 0.040);
      stemFlower(items, x, ground(x, z), z, height, `#${shade.getHexString()}`, family, random);
    }
  };

  if (family === 'tulip') {
    // Continuous red and gold stripes across the horizon, as in Lisse.
    for (let row = 0; row < 8; row++) {
      const z = -21 - row * 2.2;
      for (let x = -34; x < 34; x += IS_HANDHELD ? 0.94 : 0.54) {
        const offsetZ = z + Math.sin(x * 0.077 + row * 0.31) * 0.19 + (random() - 0.5) * 0.98;
        plant(x + (random() - 0.5) * 0.41, offsetZ, tulipRowColor(row));
      }
    }
    // Bring the same planted bands along the sides of the hall into the walkable foreground.
    const bedRows = IS_HANDHELD ? 3 : 5;
    const spacing = IS_HANDHELD ? 0.59 : 0.33;
    for (const side of [-1, 1]) {
      for (let row = 0; row < bedRows; row++) {
        const color = tulipRowColor(row === 2 ? 2 : row % 2);
        for (let z = -18.7 + (row % 2) * spacing * 0.5; z < 11; z += spacing) {
          const x = side * (16.65 + row * 0.54 + Math.sin(z * 0.1 + row * 0.8) * 0.17);
          plant(x + (random() - 0.5) * 0.30, z + (random() - 0.5) * 0.29, color);
        }
      }
    }
    return;
  }

  // Continue the near Provence stalks into the coarse rows higher up the hillside.
  for (let row = 9; row < 38; row++) {
    const x = (row - 23) * 2.17;
    const zStart = Math.abs(x) > 16.2 && Math.abs(x) < 24 ? 13.8 : -20.5;
    const nearHall = zStart > 0;
    for (let z = zStart; z > -38; z -= IS_HANDHELD ? 1.08 : nearHall ? 0.43 : 0.69) {
      const center = x + Math.sin(z * 0.077 + row * 0.31) * 0.19;
      const color = lavenderRowColor(row);
      plant(center + (random() - 0.5) * 0.88, z + (random() - 0.5) * 0.47, color);
      if (!IS_HANDHELD && Math.abs(x) < 24) plant(center + (random() - 0.5) * 0.98, z - 0.21 + (random() - 0.5) * 0.41, color);
    }
  }
}

function flowerBeds(items: PlantInstances, style: 'lavender' | 'tulip' | 'wildflower', variant: string, palette: Palette, ground: Ground, random: Random) {
  if (style !== 'wildflower') {
    cropDetails(items, style, ground, random);
    return;
  }
  const colors = flowerColor(palette, variant, 'daisy');
  const seedBeds = (x: number, z: number, span: number, count: number) => {
    for (let i = 0; i < count; i++) {
      const a = i * GOLDEN_ANGLE + random() * 0.64;
      const radius = Math.sqrt(random()) * span;
      const px = x + radius * Math.cos(a);
      const pz = z + radius * Math.sin(a);
      if (canPlant(px, pz, ground)) {
        stemFlower(items, px, ground(px, pz) - 0.008, pz, 0.25 + 0.31 * random(), pick(colors, random), 'daisy', random);
      }
    }
  };
  if (variant === 'uk_garden') {
    for (const side of [-1, 1]) {
      for (let index = 0; index < 9; index++) {
        seedBeds(side * (17.0 + 0.3 * Math.sin(index * 0.74)), -15 + index * 3.2, 1.12, IS_HANDHELD ? 14 : 22);
      }
    }
  }

  const density = IS_HANDHELD ? 6 : 10;
  for (let i = 0; i < density; i++) {
    const side = i % 2 ? -1 : 1;
    const z = -15 + Math.floor(i / 2) / Math.max(1, Math.floor(density / 2) - 1) * 33;
    seedBeds(side * (17.2 + 0.7 * random()), z + (random() - 0.5) * 3.3, 0.7 + random() * 1.04, IS_HANDHELD ? 10 : 20);
  }
  for (let i = 0; i < 6; i++) seedBeds(-11.0 + i * 4.3, -17.85 - 1.2 * random(), 0.76, IS_HANDHELD ? 7 : 13);
}

function understorey(items: PlantInstances, variant: string, style: PlantStyle, ground: Ground, random: Random) {
  const desert = style === 'succulent' || style === 'barren';
  const sand = COASTAL.has(variant);
  const pair = desert ? ['#77764a', '#8e8553', '#a1a471'] : sand ? ['#596c43', '#748451', '#87904e'] : ['#435b39', '#657749', '#84905a'];
  const count = desert ? (style === 'barren' ? 10 : 22) : IS_HANDHELD ? 38 : 67;
  for (let k = 0; k < count; k++) {
    const side = k % 2 ? -1 : 1;
    const rear = k % 5 === 0 && !sand;
    const x = rear ? -25 + random() * 50 : side * (15.9 + random() * (desert ? 9.9 : 4.7));
    const z = rear ? -17 - random() * 4.0 : -17 + random() * 38;
    if (!canPlant(x, z, ground)) continue;
    const root = direction(x, ground(x, z) - 0.012, z);
    const color = pick(pair, random);
    if (style === 'succulent' && k % 3 !== 0) {
      for (let blade = 0; blade < 12; blade++) {
        const a = blade * GOLDEN_ANGLE;
        const raised = blade > 7;
        leaf(items.fleshy, root, direction(Math.cos(a), raised ? 2.6 : 0.38 + random() * 0.42, Math.sin(a)),
          (0.49 + 0.22 * random()) * (raised ? 0.80 : 1.31), pick(pair, random), (random() - 0.5) * 0.26);
      }
      continue;
    }
    const tuft = (desert ? 0.18 : 0.26) + random() * (sand ? 0.77 : 0.48);
    const density = desert ? 5 : IS_HANDHELD ? 8 : 14;
    for (let l = 0; l < density; l++) {
      const spread = random() * 0.21;
      const a = l * GOLDEN_ANGLE + k;
      const tip = root.clone().add(direction(Math.cos(a) * spread, 0.008, Math.sin(a) * spread));
      leaf(items.narrow, tip, direction(Math.cos(a), 0.68 + random() * 0.90, Math.sin(a)),
        tuft * (0.48 + random() * 0.72), l % 3 ? color : pick(pair, random), random() * TAU, 0.24 + random() * 0.35);
    }
  }
}

function vines(items: PlantInstances, ground: Ground, random: Random) {
  for (let row = 0; row < 7; row++) {
    const side = row % 2 ? -1 : 1;
    const x = side * (17.2 + Math.floor(row / 2) * 2.05);
    let wire: THREE.Vector3 | undefined;
    for (let i = 0; i < 20; i++) {
      const z = 12 - i * 1.69;
      if (!canPlant(x, z, ground)) {
        wire = undefined;
        continue;
      }
      const root = direction(x, ground(x, z) - 0.014, z);
      const height = 0.88 + random() * 0.31;
      const high = root.clone().add(direction(0, height, 0));
      if (i % 3 === 0) link(items.wood, root, high.clone().add(direction(0, 0.13, 0)), 0.052, '#887054');
      link(items.wood, root, high, 0.025, '#625840');
      if (wire) link(items.wood, wire, high, 0.008, '#77736a');
      wire = high;
      const count = IS_HANDHELD ? 12 : 23;
      for (let n = 0; n < count; n++) {
        const p = high.clone().add(direction((random() - 0.5) * 0.54, (random() - 0.4) * 0.37, (random() - 0.5) * 1.25));
        leaf(items.broad, p, direction(random() - 0.5, random() - 0.5, random() - 0.5), 0.21 + random() * 0.18,
          pick(['#486638', '#637b43', '#879350'], random), random() * TAU, 1.2);
      }
    }
  }
}

function woodedHeadland(items: PlantInstances, ground: Ground, random: Random) {
  for (let row = 0; row < 12; row++) {
    for (let column = 0; column < 23; column++) {
      if (IS_HANDHELD && (row + column) % 2 === 1) continue;
      const z = -54 - row * 6.5 + (random() - 0.5) * 5.9;
      const x = 6 + column * 6.4 + (random() - 0.5) * 6.2;
      const y = ground(x, z);
      if (y < 1.5) continue;
      const radius = 1.35 + 1.73 * random();
      const trunkTop = 1.19 + radius * 0.69;
      for (let lobe = 0; lobe < 4; lobe++) {
        const a = lobe * GOLDEN_ANGLE + random() * TAU;
        const span = radius * (0.70 + 0.51 * random());
        items.distant.push({
          position: [x + Math.cos(a) * span * 0.67, y + trunkTop + (random() - 0.5) * span, z + Math.sin(a) * span * 0.67],
          rotation: [0.08 * random(), a, (random() - 0.5) * 0.23],
          scale: [span * 1.08, span * 0.86, span],
          color: pick(['#2e4734', '#364e39', '#3c563e', '#4d6441', '#596f43'], random),
        });
      }
    }
  }
}

function coconutRiverBank(items: PlantInstances, ground: Ground, random: Random) {
  const profile = CANOPY_PROFILES.palm;
  const count = IS_HANDHELD ? 17 : 32;
  for (let i = 0; i < count; i++) {
    const x = (i / (count - 1) - 0.5) * 169 + (random() - 0.5) * 3.1;
    let z = -52 - random() * 12;
    while (z > -80 && ground(x, z) < 0.35) z -= 2;
    if (ground(x, z) < 0.2) continue;
    palm(items, direction(x, ground(x, z), z), 6 + random() * 5.5, random() * TAU, profile, random, 'mekong_coconut_tent');
    for (let cluster = 0; cluster < 7; cluster++) {
      const offsetX = x + (random() - 0.5) * 8.8;
      const offsetZ = z + (random() - 0.66) * 7.5;
      const y = ground(offsetX, offsetZ);
      if (y < 0.12) continue;
      const crown = 1.55 + random() * 1.95;
      items.distant.push({
        position: [offsetX, y + crown * (0.68 + random() * 0.64), offsetZ],
        rotation: [random() * 0.13, random() * TAU, (random() - 0.5) * 0.29],
        scale: [crown, crown * 0.69, crown * 0.88],
        color: pick(['#33462c', '#455737', '#536142', '#67754a', '#626946'], random),
      });
    }
  }
}

export function PhotoVegetation({ style, seed, variant, palette, groundHeight = FLAT_GROUND }: {
  style: PlantStyle; seed: number; variant: string; palette: Palette; groundHeight?: Ground;
}) {
  const dalatPines = variant === 'vn_da_lat' && style === 'pine';
  const sakura = variant === 'jp_sakura' && style === 'blossom';
  // The broad-leaf scans suit these canopies. Other styles have their own branch and leaf forms.
  const canUseScannedTrees = (style === 'broadleaf' && !AUTUMN.has(variant)) || style === 'tropical';
  const scannedIds = useMemo(
    () =>
      style === 'tropical'
        ? ['island_tree_01', 'island_tree_02', 'island_tree_03']
        : ['island_tree_01', 'island_tree_02', 'tree_small_02'],
    [style],
  );
  const phTreesReady = usePhReady(canUseScannedTrees ? scannedIds[0] : null);

  const { instances, scannedTreeBuckets, scannedGroundSets } = useMemo(() => {
    const random = randomFrom(seed + 1247);
    const result = new PlantInstances();
    const hasTrees = style !== 'lavender' && style !== 'tulip' && style !== 'wildflower' && style !== 'succulent' && style !== 'vineyard' && style !== 'barren';
    const treeBuckets: ScatterItem[][] = scannedIds.map(() => []);
    if (sakura) weepingCherry(result, groundHeight, random);
    else if (hasTrees && !dalatPines) {
      const profile = CANOPY_PROFILES[style];
      const flora = flowerColor(palette, variant, style === 'blossom' ? 'cherry' : 'bougainvillea');
      const spots = treeSpots(profile, style, variant, groundHeight, random);
      for (let i = 0; i < spots.length; i++) {
        const space = spots[i];
        const h = variant === 'lb_cedar' && i === 0 ? 11.3 : THREE.MathUtils.lerp(...profile.height, random());
        const angle = i * GOLDEN_ANGLE + random() * 0.88;
        const radius = THREE.MathUtils.clamp(h * profile.width * 0.43, 0.48, 1.65);
        result.footprints.push({ position: space.toArray(), radius, angle });
        if (canUseScannedTrees) {
          treeBuckets[i % scannedIds.length].push({
            position: [space.x, space.y, space.z],
            rotationY: angle,
            scale: h / 7.5,
          });
        }
        if (style === 'palm') palm(result, space, h, angle, profile, random, variant);
        else if (style === 'bamboo') bamboo(result, space, h, angle, profile, random);
        else if (!canUseScannedTrees || !phTreesReady) branchedTree(result, space, style, h, angle, variant, profile, random, flora);
      }
    }
    if (variant === 'es_andalusia') andalusianPlanters(result, random);
    else if (style === 'lavender' || style === 'tulip' || style === 'wildflower') flowerBeds(result, style, variant, palette, groundHeight, random);
    else if (GARDEN_BEDS.has(variant)) flowerBeds(result, 'wildflower', variant, palette, groundHeight, random);
    if (style === 'vineyard') vines(result, groundHeight, random);
    if (variant === 'vn_phu_quoc_beach') woodedHeadland(result, groundHeight, random);
    if (variant === 'mekong_coconut_tent') coconutRiverBank(result, groundHeight, random);
    const flowerField = style === 'lavender' || style === 'tulip';
    if (!ROOFTOPS.has(variant) && !flowerField) understorey(result, variant, style, groundHeight, random);

    // Real photo-scanned Poly Haven ground cover (grass, ferns, gazania flowers, shrubs, mossy rocks)
    const groundOut: Array<{ id: string; items: ScatterItem[]; handheld?: boolean }> = [];
    if (!ROOFTOPS.has(variant) && style !== 'barren' && !flowerField) {
      const placeOnTerrain = (raw: ScatterItem[]) =>
        raw
          .filter(({ position: [x, , z] }) => canPlant(x, z, groundHeight, 0.35))
          .map(({ position: [x, , z], ...rest }) => ({
            ...rest,
            position: [x, groundHeight(x, z) - 0.025, z] as Vec3,
          }));
      groundOut.push({
        id: 'grass_medium_02',
        handheld: true,
        items: placeOnTerrain(ringScatter(IS_HANDHELD ? 70 : 160, 15.6, 26, seed + 11, [0.75, 1.45])),
      });
      if (style !== 'succulent') {
        groundOut.push({
          id: 'grass_medium_01',
          items: placeOnTerrain(ringScatter(85, 16.4, 32, seed + 12, [0.75, 1.4])),
        });
        groundOut.push({
          id: 'fern_02',
          handheld: true,
          items: placeOnTerrain(dalatPines
            ? ringScatter(IS_HANDHELD ? 43 : 102, 16.8, 44, seed + 13, [0.75, 1.7])
            : ringScatter(IS_HANDHELD ? 18 : 42, 16.2, 28, seed + 13, [0.8, 1.5])),
        });
        groundOut.push({
          id: 'flower_gazania',
          items: placeOnTerrain(ringScatter(48, 15.6, 25, seed + 14, [0.8, 1.35])),
        });
        groundOut.push({
          id: 'shrub_03',
          handheld: true,
          items: placeOnTerrain(dalatPines
            ? ringScatter(IS_HANDHELD ? 24 : 56, 17.0, 48, seed + 15, [0.55, 1.24])
            : ringScatter(IS_HANDHELD ? 10 : 22, 16.8, 32, seed + 15, [0.85, 1.45])),
        });
        groundOut.push({
          id: 'shrub_04',
          items: placeOnTerrain(ringScatter(18, 17.5, 34, seed + 16, [0.9, 1.6])),
        });
      }
      if (variant !== 'kr_jeju') {
        groundOut.push({
          id: 'rock_moss_set_01',
          items: placeOnTerrain(ringScatter(12, 18.5, 36, seed + 17, [0.65, 1.15])),
        });
      }
    }

    return { instances: result, scannedTreeBuckets: treeBuckets, scannedGroundSets: groundOut };
  }, [style, seed, variant, palette, groundHeight, canUseScannedTrees, phTreesReady, scannedIds, dalatPines, sakura]);

  return (
    <group name={`photo-vegetation-${style}`}>
      {dalatPines && <PhotoDalatPines seed={seed} ground={groundHeight} />}
      <VegetationContactShadows footprints={instances.footprints} groundHeight={groundHeight} />
      {canUseScannedTrees &&
        phTreesReady &&
        scannedIds.map((id, idx) =>
          scannedTreeBuckets[idx].length > 0 ? (
            <PhScatter key={id} id={id} items={scannedTreeBuckets[idx]} height={7.5} leafAlphaCutoff={0.42} />
          ) : null,
        )}
      {scannedGroundSets.map((s) =>
        s.items.length > 0 ? (
          <PhScatter
            key={s.id}
            id={s.id}
            items={s.items}
            variants
            handheld={s.handheld}
            castShadow={!IS_HANDHELD && (s.id.startsWith('shrub') || s.id.startsWith('rock'))}
          />
        ) : null,
      )}
      {instances.trunks.length > 0 && <InstancedSet geometry={SHAFT} material={BARK} items={instances.trunks} castShadow={!IS_HANDHELD} />}
      {instances.wood.length > 0 && <InstancedSet geometry={BRANCH} material={BARK} items={instances.wood} castShadow={!IS_HANDHELD} />}
      {instances.nodes.length > 0 && <InstancedSet geometry={JOINT} material={BARK} items={instances.nodes} castShadow={false} />}
      {instances.broad.length > 0 && <InstancedSet geometry={BROAD_BLADE} material={LEAF} items={instances.broad} castShadow={false} />}
      {instances.narrow.length > 0 && <InstancedSet geometry={NARROW_BLADE} material={LEAF} items={instances.narrow} castShadow={false} />}
      {instances.needles.length > 0 && <InstancedSet geometry={CONIFER_SPRAY} material={LEAF} items={instances.needles} castShadow={false} />}
      {instances.maple.length > 0 && <InstancedSet geometry={MAPLE_LEAF} material={LEAF} items={instances.maple} castShadow={false} />}
      {instances.fleshy.length > 0 && <InstancedSet geometry={ROSETTE_BLADE} material={LEAF} items={instances.fleshy} castShadow={false} />}
      {instances.distant.length > 0 && <InstancedSet geometry={CROWN} material={DISTANT_LEAF} items={instances.distant} castShadow={false} />}
      {instances.cores.length > 0 && <InstancedSet geometry={HEART} material={LEAF} items={instances.cores} castShadow={false} />}
      {instances.cherrySprays.length > 0 && <InstancedSet geometry={CHERRY_SPRAY} material={SAKURA_PETAL} items={instances.cherrySprays} castShadow={false} />}
      {(Object.keys(BLOOMS) as Bloom[]).map((family) => instances.flowers[family].length > 0 &&
        <InstancedSet key={family} geometry={BLOOMS[family]} material={PETAL} items={instances.flowers[family]} castShadow={false} />)}
    </group>
  );
}
