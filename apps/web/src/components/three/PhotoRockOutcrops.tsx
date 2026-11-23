'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { IS_HANDHELD } from './deviceTier';
import { InstancedSet } from './realProps';
import { VegetationContactShadows, type VegetationFootprint } from './vegetationContactShadows';

type Ground = (x: number, z: number) => number;
type Kind = 'basalt' | 'sandstone' | 'granite';
type Site = [x: number, z: number, radius: number];
type RockProfile = {
  kind: Kind;
  color: string;
  density: number;
  shore: boolean;
  sites: Site[];
};
type Rock = {
  position: [number, number, number];
  scale: [number, number, number];
  quaternion: THREE.Quaternion;
  color: string;
};

const profiles: Partial<Record<string, RockProfile>> = {
  is_black_sand: { kind: 'basalt', color: '#575b59', density: 330, shore: true, sites: [[-18.4, -21.4, 0.54], [-19.9, -22.8, 0.36]] },
  cl_atacama: { kind: 'sandstone', color: '#bdb096', density: 120, shore: false, sites: [[-9.45, -21.92, 0.96], [-11.05, -22.44, 0.68], [-13.2, -23.8, 1.13]] },
  jo_wadi_rum: { kind: 'sandstone', color: '#94664d', density: 98, shore: false, sites: [[-17.8, -22.0, 1.08], [-20.1, -23.1, 1.38], [-16.55, -23.35, 0.77]] },
  ar_patagonia: { kind: 'granite', color: '#989a98', density: 155, shore: false, sites: [[20.7, -20.85, 0.94], [22.4, -21.3, 0.62], [23.65, -23.1, 0.52]] },
};

export function hasPhotoRockOutcrops(variant: string) {
  return Object.hasOwn(profiles, variant);
}

function seeded(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function makeRock(kind: Kind, seed: number, standingSlab = false) {
  const rand = seeded(seed);
  const sides = kind === 'sandstone' ? 12 : 10;
  const shape = standingSlab ? [0.92, 1, 0.96, 0.87, 0.71, 0.61] : [0.77, 0.98, 0.99, 0.90, 0.74, 0.43];
  const rings = [0, 0.11, 0.33, 0.61, 0.83, 0.98];
  const vertex: number[] = [];
  const colors: number[] = [];
  const faces: number[] = [];
  const azimuths = shape.map(() => 0.08 * (rand() - 0.5));
  const sections = Array.from({ length: sides }, (_, n) => ({
    a: (n + 0.36 * rand()) * Math.PI * 2 / sides,
    width: 0.76 + rand() * 0.31,
    ridge: (rand() - 0.5) * 0.31,
  }));
  for (const [layer, y] of rings.entries()) {
    const shift = y * (kind === 'basalt' ? 0.23 : 0.15);
    for (const { a, width, ridge } of sections) {
      const angle = a + azimuths[layer];
      const brokenEdge = 0.87 + rand() * (kind === 'basalt' ? 0.24 : 0.15);
      const radius = width * shape[layer] * brokenEdge;
      const fracture = ridge * (Math.sin(y * Math.PI) * shape[layer] + y * y * 0.48);
      vertex.push(Math.cos(angle) * radius - shift, Math.max(0, y + fracture), Math.sin(angle) * radius + shift * 0.46);
      const brightness = (0.74 + rand() * 0.28) * (0.91 + y * 0.13);
      colors.push(brightness, brightness, brightness);
    }
  }
  for (let layer = 0; layer < rings.length - 1; layer++) {
    for (let i = 0; i < sides; i++) {
      const base = layer * sides;
      const a = base + i;
      const b = base + (i + 1) % sides;
      const c = a + sides;
      const d = b + sides;
      if ((layer + i) % 2) faces.push(a, c, d, a, d, b);
      else faces.push(a, c, b, b, c, d);
    }
  }
  const bottom = vertex.length / 3;
  const top = bottom + 1;
  vertex.push(0, 0, 0, -0.15, 1.01, 0.1);
  colors.push(0.74, 0.74, 0.74, 0.97, 0.97, 0.97);
  const upper = (rings.length - 1) * sides;
  for (let i = 0; i < sides; i++) {
    const next = (i + 1) % sides;
    faces.push(bottom, i, next, top, upper + next, upper + i);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertex, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(faces);
  geometry.computeVertexNormals();
  return geometry;
}

function makeMaterial(kind: Kind) {
  const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: kind === 'basalt' ? 0.90 : 0.96 });
  material.customProgramCacheKey = () => `photo-stone-${kind}`;
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = 'varying vec3 vRock;\n' + shader.vertexShader
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvRock = position;');
    shader.fragmentShader = `varying vec3 vRock;
      float textureHash(vec3 p) {
        p = fract(p * 0.1031);
        p += dot(p, p.yxz + 33.33);
        return fract((p.x + p.y) * p.z);
      }
      float rockNoise(vec3 vec) {
        vec3 cell = floor(vec);
        vec3 f = fract(vec);
        vec3 u = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(mix(textureHash(cell), textureHash(cell + vec3(1,0,0)),u.x),mix(textureHash(cell+vec3(0,1,0)),textureHash(cell+vec3(1,1,0)),u.x),u.y),
          mix(mix(textureHash(cell+vec3(0,0,1)),textureHash(cell+vec3(1,0,1)),u.x),mix(textureHash(cell+vec3(0,1,1)),textureHash(cell+vec3(1,1,1)),u.x),u.y),u.z);
      }\n` + shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
        float broad = rockNoise(vRock * 9.0);
        float fine = rockNoise(vRock * 41.0);
        float pits = smoothstep(0.60, 0.84, rockNoise(vRock * 27.0 + vec3(4.0, 6.0, 1.0)));
        float strata = sin(27.0 * vRock.y + vRock.x * 4.2 + 4.3 * broad);
        float detailFade = 1.0 - smoothstep(0.012, 0.055, length(fwidth(vRock)));
        float bands = ${kind === 'sandstone' ? '0.10 * strata + 0.15 * smoothstep(0.55, 0.95, strata)' : kind === 'granite' ? '0.14 * smoothstep(0.55, 0.88, broad + fine * 0.24 * detailFade)' : '-0.12 * pits * detailFade'};
        diffuseColor.rgb *= 0.79 + broad * 0.29 + (fine - 0.5) * 0.13 * detailFade + bands;
        float relief = 0.015 * broad ${kind === 'sandstone' ? '+ 0.003 * strata' : ''};
      `).replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        vec3 rockDx = dFdx(-vViewPosition);
        vec3 rockDy = dFdy(-vViewPosition);
        vec3 rockTangent = cross(rockDy, normal);
        vec3 rockBitangent = cross(normal, rockDx);
        float rockDet = dot(rockDx, rockTangent) * faceDirection;
        vec3 rockGradient = sign(rockDet) * (rockTangent * dFdx(relief) + rockBitangent * dFdy(relief)) / max(0.00000001, abs(rockDet));
        float bump = min(0.48, 0.32 / max(0.001, length(rockGradient))) * detailFade;
        normal = normalize(normal - rockGradient * bump);
      `);
  };
  return material;
}

const library = new Map<Kind, { geometries: THREE.BufferGeometry[]; material: THREE.Material }>();
function sharedRocks(kind: Kind) {
  const existing = library.get(kind);
  if (existing) return existing;
  const batch = { geometries: [31, 212, 579, 945].map((seed) => makeRock(kind, seed)), material: makeMaterial(kind) };
  library.set(kind, batch);
  return batch;
}

const UP = new THREE.Vector3(0, 1, 0);

function scatter(profile: RockProfile, variant: string, seed: number, ground: Ground) {
  const rand = seeded(seed + 771);
  const groups: Rock[][] = [[], [], [], []];
  const footprints: VegetationFootprint[] = [];
  const color = new THREE.Color(profile.color);

  function place([x, z, radius]: Site, feature: boolean) {
    const groundY = ground(x, z);
    if (Math.max(Math.abs(x), Math.abs(z)) < 15.6 || groundY < 0.015) return;
    const step = Math.max(0.33, radius * 0.46);
    const slopeX = (ground(x + step, z) - ground(x - step, z)) / (2 * step);
    const slopeZ = (ground(x, z + step) - ground(x, z - step)) / (2 * step);
    const slope = Math.hypot(slopeX, slopeZ);
    if (slope > (feature ? 0.9 : 0.49)) return;
    const angle = rand() * Math.PI * 2;
    const normal = new THREE.Vector3(-0.7 * slopeX, 1, -0.7 * slopeZ).normalize();
    const tilt = new THREE.Quaternion().setFromUnitVectors(UP, normal)
      .multiply(new THREE.Quaternion().setFromAxisAngle(UP, angle));
    const height = radius * (profile.kind === 'sandstone' ? 0.36 + rand() * 0.48 : 0.54 + rand() * 0.69);
    const position: Rock['position'] = [x, groundY - 0.19 * height - Math.min(0.36, slope * radius * 0.23), z];
    const tint = color.clone().multiplyScalar(0.82 + rand() * 0.31);
    groups[Math.floor(rand() * groups.length)].push({
      position, quaternion: tilt, scale: [radius * (0.9 + rand() * 0.39), height, radius * (0.53 + rand() * 0.43)],
      color: `#${tint.getHexString()}`,
    });
    if (radius >= 0.29 && groundY > 0.12) {
      footprints.push({ position, angle, radius: radius * 1.29 });
    }
  }

  for (const site of profile.sites) {
    place(site, true);
    const [x, z, radius] = site;
    for (let i = 0; i < (IS_HANDHELD ? 6 : 12); i++) {
      const angle = rand() * Math.PI * 2;
      const reach = radius * (1.10 + rand() * 1.6);
      place([x + Math.cos(angle) * reach, z + Math.sin(angle) * reach, radius * (0.07 + rand() * 0.16)], false);
    }
  }
  const count = Math.floor(profile.density * (IS_HANDHELD ? 0.47 : 1));
  for (let i = 0; i < count; i++) {
    const x = (rand() - 0.5) * (profile.shore ? 73 : 92);
    const z = profile.shore ? -16.0 - rand() ** 1.42 * 17.7 : -16.8 - rand() * 37.5;
    const max = variant === 'is_black_sand' ? 0.37 : profile.shore ? 0.66 : 0.84;
    const radius = 0.052 + rand() ** (profile.shore ? 2.55 : 3.4) * max;
    if (!profile.sites.some(([sx, sz, sr]) => Math.hypot(x - sx, z - sz) < (sr + radius) * 0.81)) {
      place([x, z, radius], false);
    }
  }
  return { groups, footprints };
}

export function PhotoRockOutcrops({ variant, seed, ground }: { variant: string; seed: number; ground: Ground }) {
  const profile = profiles[variant];
  const placement = useMemo(() => profile ? scatter(profile, variant, seed, ground) : undefined, [profile, variant, seed, ground]);
  if (!profile || !placement) return null;
  const { groups, footprints } = placement;
  const { geometries, material } = sharedRocks(profile.kind);
  return (
    <group name={`reference-rock-outcrops-${variant}`} dispose={null}>
      <VegetationContactShadows footprints={footprints} groundHeight={ground} opacity={0.43} />
      {groups.map((items, i) => items.length > 0 && (
        <InstancedSet key={i} geometry={geometries[i]} material={material} items={items} castShadow={false} />
      ))}
    </group>
  );
}

let drombegSlabs: THREE.BufferGeometry[] | undefined;

export function DrombegStoneCircle({ seed, ground }: { seed: number; ground: Ground }) {
  const { groups, footprints } = useMemo(() => {
    const random = seeded(seed + 693);
    const groups: Rock[][] = [[], [], [], []];
    const footprints: VegetationFootprint[] = [];
    const grey = new THREE.Color('#a09c8c');
    const moss = new THREE.Color('#74785a');

    function place(x: number, z: number, scale: Rock['scale'], yaw: number, lean: number, index: number) {
      const y = ground(x, z) - Math.min(0.14, scale[1] * 0.24);
      const position: Rock['position'] = [x, y, z];
      const quaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(lean, yaw, (random() - 0.5) * 0.24, 'YXZ'));
      const color = '#' + grey.clone().lerp(moss, random() * 0.45).multiplyScalar(0.86 + random() * 0.24).getHexString();
      groups[index % groups.length].push({ position, scale, quaternion, color });
      footprints.push({ position, angle: yaw, radius: scale[0] * 1.14 });
    }

    const stones = 17;
    for (let i = 0; i < stones; i++) {
      const theta = Math.PI * 2 * (i + (random() - 0.5) * 0.30) / stones;
      const radius = 5.15 + (random() - 0.5) * 0.39;
      const x = -10.7 + Math.cos(theta) * radius;
      const z = -23.4 + Math.sin(theta) * radius;
      const axial = i === 4;
      const entrance = i === 12 || i === 13;
      const height = axial ? 0.72 : entrance ? 2.42 + random() * 0.27 : 1.08 + random() * 1.05;
      const width = axial ? 1.52 : 0.38 + random() * 0.34;
      place(x, z, [width, height, 0.25 + random() * 0.20], Math.PI * 0.5 - theta + (random() - 0.5) * 0.45,
        (random() - 0.5) * 0.23, i);
    }
    return { groups, footprints };
  }, [seed, ground]);
  const { material } = sharedRocks('granite');
  drombegSlabs ??= [15, 83, 147, 311].map(id => makeRock('granite', id, true));
  const slabs = drombegSlabs;
  return <group name="drombeg-stone-circle" dispose={null}>
    <VegetationContactShadows footprints={footprints} groundHeight={ground} opacity={0.46} />
    {groups.map((items, index) => <InstancedSet key={index} geometry={slabs[index]} material={material} items={items} />)}
  </group>;
}
