'use client';

import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { IS_HANDHELD } from './deviceTier';
import { GardenHydrangeas, type FlowerCloud } from './gardenBotany';
import { GARDEN_ALTAR_Z } from './gardenReference';
import { PhScatter, usePhReady, usePhSurface } from './phAssets';
import { Forest, type TreeSpot } from './realNature';
import { roundedSlab, seatCushion } from './realGeometry';
import { carpet, fabric, wood } from './realMaterials';
import { InstancedSet } from './realProps';

const SEAT_WOOD = ['#633a28', '#76503a', '#96634a', '#6d4230'];
const GROVE: TreeSpot[] = [
  { position: [-7.9, 0, -10.7], height: 11 }, { position: [-11.3, 0, -12.2], height: 7.5 },
  { position: [-4.4, 0, -16.1], height: 7.9 }, { position: [-5.2, 0, -10.5], height: 4.1 },
  { position: [3.6, 0, -14.1], height: 8.9 }, { position: [5.1, 0, -16.5], height: 8.6 },
  { position: [7.8, 0, -9.7], height: 9.7 }, { position: [11.4, 0, -8.9], height: 10.6 },
  { position: [8.9, 0, -16.1], height: 8 }, { position: [-10.3, 0, -7.8], height: 8 },
];
const AISLE_CANOPY: TreeSpot[] = [
  { position: [-5.9, 0, 2.1], height: 9.3, rotation: 1.1 },
  { position: [7.8, 0, -3.8], height: 9.7, rotation: 2.7 },
];

type Vec3 = [number, number, number];

/** A timber rail of the X-back chair, with a round cross section. */
function rail(from: THREE.Vector3Tuple, to: THREE.Vector3Tuple, radius: number): THREE.BufferGeometry {
  const a = new THREE.Vector3(...from);
  const b = new THREE.Vector3(...to);
  const direction = b.clone().sub(a);
  const geometry = new THREE.CylinderGeometry(radius * 0.94, radius, direction.length(), 9);
  geometry.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize()));
  geometry.translate(...a.lerp(b, 0.5).toArray());
  return geometry;
}

function chairFrame(): THREE.BufferGeometry {
  const parts = [
    new THREE.BoxGeometry(0.43, 0.055, 0.43).translate(0, 0.44, 0),
    rail([-0.21, 0.95, 0.212], [0.21, 0.95, 0.212], 0.026),
    rail([-0.18, 0.52, 0.19], [0.18, 0.90, 0.219], 0.018),
    rail([0.18, 0.52, 0.20], [-0.18, 0.90, 0.229], 0.018),
  ];
  for (const side of [-1, 1]) {
    const x = side * 0.188;
    parts.push(rail([x * 1.12, 0.008, 0.24], [x, 0.95, 0.212], 0.025));
    parts.push(rail([x * 1.12, 0.008, -0.24], [x, 0.455, -0.18], 0.026));
    parts.push(rail([x, 0.19, 0.211], [x, 0.19, -0.211], 0.012));
  }
  const frame = mergeGeometries(parts);
  parts.forEach((part) => part.dispose());
  return frame;
}

function CeremonySeating() {
  const frame = useMemo(chairFrame, []);
  useEffect(() => () => frame.dispose(), [frame]);
  const chairs = useMemo(() => [-1, 1].flatMap((side, wing) =>
    Array.from({ length: 36 }, (_, i) => {
      const row = Math.floor(i / 6);
      const column = i % 6;
      return {
        position: [side * (2.0 + column * 0.73), 0.032, -5.8 + row * 1.33] as [number, number, number],
        rotation: [0, side * (0.065 + Math.sin(i * 1.7) * 0.028), 0] as [number, number, number],
        color: SEAT_WOOD[(i + wing) % SEAT_WOOD.length],
      };
    }),
  ), []);
  const cushions = useMemo(() => chairs.map((chair) => ({ ...chair, color: '#adac9d' })), [chairs]);

  return (
    <>
      <InstancedSet geometry={frame} material={wood('#eee2d9', 0.25)} items={chairs} />
      <InstancedSet geometry={seatCushion()} material={fabric('#f4f0e3')} items={cushions} />
    </>
  );
}

/** Rounded white florals, a linen settee and the low signing table from the reference. */
export function GardenAltar({ children }: { children?: React.ReactNode }) {
  const clouds = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      [-1.68, 0.1, 0.03], [-1.74, 1.12, 0], [-1.64, 2.45, -0.03],
      [-1.1, 3.14, 0.02], [0.08, 3.44, -0.04], [1.16, 3.07, 0],
      [1.69, 2.38, 0.03], [1.74, 1.14, 0.05], [1.68, 0.1, 0],
    ].map(([x, y, z]) => new THREE.Vector3(x, y, z)), false, 'centripetal');
    const clusters: FlowerCloud[] = curve.getSpacedPoints(43).map((point, i) => {
      const fullness = 0.20 + Math.abs(Math.sin(i * 1.66)) * 0.12;
      return {
        center: [point.x + Math.sin(i * 2.7) * 0.10, point.y, point.z + Math.cos(i * 1.7) * 0.12],
        spread: [fullness, fullness * 1.05, 0.24],
        count: 48,
        wrapped: true,
      };
    });
    [-1, 1].forEach((side) => clusters.push({ center: [side * 1.93, 0.19, 0.29], spread: [0.57, 0.31, 0.48], count: 118 }));
    return clusters;
  }, []);
  const linen = fabric('#eeeae1');

  return (
    <>
      <GardenHydrangeas clouds={clouds} />
      <group position={[0, 0.03, -0.42]}>
        <mesh geometry={roundedSlab(2.36, 0.4, 0.81, 0.10)} material={linen} position={[0, 0.29, 0]} />
        <mesh geometry={roundedSlab(2.18, 0.2, 0.71, 0.08)} material={linen} position={[0, 0.51, 0.012]} />
        <mesh geometry={roundedSlab(2.31, 0.53, 0.23, 0.10)} material={linen} position={[0, 0.78, -0.29]} />
        {[-1.06, 1.06].map((x) => (
          <mesh key={x} geometry={roundedSlab(0.29, 0.3, 0.81, 0.11)} material={linen} position={[x, 0.66, 0.015]} />
        ))}
      </group>
      <group position-z={0.86}>
        <mesh geometry={roundedSlab(1.22, 0.065, 0.55, 0.03)} material={wood('#925f42', 0.24)} position-y={0.66} />
        {[-0.52, 0.52].flatMap((x) => [-0.19, 0.19].map((z) => (
          <mesh key={`${x}_${z}`} position={[x, 0.34, z]} material={wood('#382621', 0.2)}>
            <boxGeometry args={[0.045, 0.68, 0.045]} />
          </mesh>
        )))}
      </group>
      {children}
    </>
  );
}

function FlowerBorders() {
  const clouds = useMemo<FlowerCloud[]>(() => {
    const beds = [-1, 1].flatMap((side) => [-6.42, -4.94, -2.85, -0.59, 1.61, 3.68, 5.32].flatMap((z, group) => {
      const volume = 0.82 + 0.34 * Math.abs(Math.sin(group * 2.1 + side));
      return Array.from({ length: 5 }, (_, i): FlowerCloud => {
        const phase = i * 2.39996 + group * 1.7 + side * 0.8;
        return {
          center: [side * (1.35 + Math.sin(phase) * 0.32), volume * (0.12 + 0.28 * Math.abs(Math.sin(phase))), z + (i - 2) * 0.24 + side * 0.14],
          spread: [volume * 0.25, 0.12 + 0.13 * Math.abs(Math.cos(phase)), volume * 0.30],
          count: 50 + Math.round(volume * 15),
        };
      });
    }));
    beds.push({ center: [0.02, 0.16, -6.91], spread: [0.62, 0.38, 0.48], count: 168 });
    return beds;
  }, []);
  return <GardenHydrangeas clouds={clouds} />;
}

function StoneApron() {
  const photo = usePhSurface('stone', 15);
  return (
    <mesh position={[0, 0.018, -1.85]} rotation-x={-Math.PI / 2} receiveShadow>
      <planeGeometry args={[15, 15]} />
      <meshStandardMaterial color={photo ? '#ddcfbc' : '#b6a58f'} map={photo?.map} normalMap={photo?.normalMap} roughnessMap={photo?.roughnessMap} roughness={0.95} />
    </mesh>
  );
}

export function GardenGrove({ behindHall = false }: { behindHall?: boolean }) {
  const ready = usePhReady('tree_small_02');
  const spots = useMemo(() => behindHall ? GROVE.map(({ position: [x, y, z], ...rest }) => ({ ...rest, position: [x * 1.7, y, z - 10] as Vec3 })) : [...GROVE, ...AISLE_CANOPY], [behindHall]);
  const trees = useMemo(() => spots.map(({ position, height, rotation }, ix) => ({ position, scale: (height ?? 8) / 8, rotationY: rotation ?? ix * 2.39996 })), [spots]);
  const shrubs = useMemo(() => Array.from({ length: IS_HANDHELD ? 17 : 30 }, (_, i) => ({
    position: [Math.sin(i * 2.39996) * 12, 0, (behindHall ? -18.4 : -12.1) - (i % 4) * 1.5] as Vec3,
    scale: 1.45 + 2.1 * Math.abs(Math.cos(i * 3.1)),
    rotationY: i * 1.8,
  })), [behindHall]);
  const understorey = useMemo<TreeSpot[]>(() => Array.from({ length: 26 }, (_, i) => {
    const row = i % 2;
    const height = 4.4 + row * 1.4 + 1.8 * Math.abs(Math.sin(i * 2.21));
    return {
      // Lower the crown into the ground so bordering foliage reads as dense thickets.
      position: [(Math.floor(i / 2) - 6) * 3.1 + Math.sin(i) * 1.9, -height * (row ? 0.20 : 0.32), -16.8 - row * 6.3 - Math.abs(Math.cos(i)) * 3.4] as Vec3,
      height,
    };
  }), []);
  const thickets = useMemo(() => {
    const columns = IS_HANDHELD ? 12 : 16;
    return Array.from({ length: columns * 2 }, (_, i) => {
      const row = Math.floor(i / columns);
      const x = (i % columns - (columns - 1) / 2) * 2.2;
      const angle = i * 2.39996;
      return {
        position: [x + Math.cos(angle) * 1.3 + row * 1.2, -0.03, (behindHall ? -19.0 : -12.8) - row * 5.3 - 1.7 * Math.abs(Math.sin(angle))] as Vec3,
        rotationY: angle,
        scale: (row ? 1.48 : 0.94) + Math.abs(Math.cos(i * 2.9)) * (row ? 0.85 : 0.55),
      };
    });
  }, [behindHall]);

  return (
    <>
      {ready ? <PhScatter id="tree_small_02" items={trees} height={8} leafAlphaCutoff={0.42} /> : <Forest kind="broadleaf" spots={spots} leafColor="#5c724c" seed={427} />}
      {!behindHall && <Forest kind="broadleaf" spots={understorey} leafColor="#536e45" castShadow={false} seed={834} />}
      <PhScatter id="shrub_02" items={thickets} variants handheld castShadow={false} />
      <PhScatter id="shrub_03" items={shrubs} variants handheld castShadow={false} />
    </>
  );
}

/** Photograph-matched seating plan, shown as an orbitable composition in the venue preview. */
export function GardenCeremony() {
  const runner = useMemo(() => {
    const material = carpet('#536b59').clone();
    material.normalScale.set(0.18, 0.18);
    material.sheen = 0.22;
    return material;
  }, []);
  useEffect(() => () => runner.dispose(), [runner]);
  return (
    <>
      <StoneApron />
      <mesh position={[0, 0.027, -1.84]} rotation-x={-Math.PI / 2} material={runner} receiveShadow>
        <planeGeometry args={[2.26, 15.1]} />
      </mesh>
      <CeremonySeating />
      <FlowerBorders />
      <group position-z={GARDEN_ALTAR_Z}>
        <GardenAltar />
      </group>
      <GardenGrove />
      {[-4.3, 2.5].map((x, i) => (
        <mesh key={x} position={[x, 2.63, -9.3 - i * 0.45]} material={wood('#988977', 0.2)}>
          <cylinderGeometry args={[0.035, 0.044, 5.26, 8]} />
        </mesh>
      ))}
    </>
  );
}
