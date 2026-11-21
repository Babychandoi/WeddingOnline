'use client';

import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { IS_HANDHELD } from './deviceTier';
import { GARDEN_ALTAR_Z } from './gardenReference';
import { PhScatter, usePhReady, usePhSurface } from './phAssets';
import { Forest, type TreeSpot } from './realNature';
import { domePoints, leafBlade, roundedSlab, seatCushion } from './realGeometry';
import { carpet, fabric, leaves, wood } from './realMaterials';
import { InstancedSet } from './realProps';

const IVORY = ['#faf9f4', '#eaece5', '#dcdfd3', '#fffdfa'];
const SEAT_WOOD = ['#633a28', '#76503a', '#96634a', '#6d4230'];
const GROVE: TreeSpot[] = [
  { position: [-7.9, 0, -10.7], height: 11 }, { position: [-11.3, 0, -12.2], height: 7.5 },
  { position: [-4.4, 0, -16.1], height: 7.9 }, { position: [-5.2, 0, -10.5], height: 4.1 },
  { position: [3.6, 0, -14.1], height: 8.9 }, { position: [5.1, 0, -16.5], height: 8.6 },
  { position: [7.8, 0, -9.7], height: 9.7 }, { position: [11.4, 0, -8.9], height: 10.6 },
  { position: [8.9, 0, -16.1], height: 8 }, { position: [-10.3, 0, -7.8], height: 8 },
];

type Vec3 = [number, number, number];
type FlowerCloud = { center: Vec3; spread: Vec3; count: number; wrapped?: boolean };

function hydrangeaFloret() {
  const lobes = new THREE.Shape();
  const segments = 28;
  for (let i = 0; i < segments; i++) {
    const angle = i * Math.PI * 2 / segments;
    const radius = 0.047 * (0.84 + 0.16 * Math.cos(angle * 4));
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (i === 0) lobes.moveTo(x, y);
    else lobes.lineTo(x, y);
  }
  lobes.closePath();
  const shape = new THREE.ShapeGeometry(lobes);
  const perimeter = shape.attributes.position;
  const positions = [0, -0.008, 0];
  const indices = [];
  for (let i = 0; i < perimeter.count; i++) {
    positions.push(perimeter.getX(i), 0.001 + Math.hypot(perimeter.getX(i), perimeter.getY(i)) * 0.13, -perimeter.getY(i));
    indices.push(0, i + 1, ((i + 1) % perimeter.count) + 1);
  }
  shape.dispose();
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/** A single batch of four-petal hydrangea florets, individually tilted and shaded. */
function Hydrangeas({ clouds }: { clouds: FlowerCloud[] }) {
  const geometry = useMemo(hydrangeaFloret, []);
  const bloom = useMemo(() => new THREE.MeshLambertMaterial({ side: THREE.DoubleSide, emissive: '#e4e0d3', emissiveIntensity: 0.11 }), []);
  useEffect(() => () => { geometry.dispose(); bloom.dispose(); }, [geometry, bloom]);

  const { petals, foliage } = useMemo(() => {
    const up = new THREE.Vector3(0, 1, 0);
    const petals = clouds.flatMap(({ center, spread, count, wrapped }, bed) => (
      domePoints(IS_HANDHELD ? Math.round(count * 0.72) : count, 1, wrapped ? -0.96 : -0.25).map(({ n }, i) => {
        const phase = (i + 1) * 2.39996 + bed * 1.94;
        const uneven = 0.88 + 0.18 * Math.sin(phase * 1.59);
        const facing = n.clone().add(new THREE.Vector3(0.25 * Math.sin(phase), 0, 0.27 * Math.cos(phase))).normalize();
        return {
          position: center.map((value, axis) => value + n.getComponent(axis) * spread[axis] * uneven) as Vec3,
          quaternion: new THREE.Quaternion().setFromUnitVectors(up, facing).multiply(new THREE.Quaternion().setFromAxisAngle(up, phase)),
          scale: 0.7 + 0.76 * Math.abs(Math.sin(phase * 2.27)),
          color: IVORY[(i + 2 * bed) % IVORY.length],
        };
      })
    ));
    const foliage = clouds.flatMap(({ center, spread }, bed) => Array.from({ length: 5 }, (_, i) => {
      const direction = bed * 1.9 + i * 2.39996;
      const leaf = i % 2 ? '#52694b' : '#687c52';
      return {
        position: [center[0] + Math.cos(direction) * spread[0] * 0.75, center[1] + spread[1] * Math.sin(i * 2.8) * 0.55, center[2] + Math.sin(direction) * spread[2] * 0.75] as Vec3,
        rotation: [Math.sin(direction), direction, 0.35 * i] as Vec3,
        scale: 1.7 + Math.abs(Math.sin(direction)) * 1.4,
        color: leaf,
      };
    }));
    return { petals, foliage };
  }, [clouds]);

  return (
    <>
      <InstancedSet geometry={geometry} material={bloom} items={petals} />
      <InstancedSet geometry={leafBlade()} material={leaves('#e8efdc')} items={foliage} castShadow={false} />
    </>
  );
}

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
      <Hydrangeas clouds={clouds} />
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
    const beds = [-1, 1].flatMap((side) => Array.from({ length: 25 }, (_, i): FlowerCloud => {
      const phase = i * 2.1 + side * 0.8;
      return {
        center: [side * (1.35 + Math.sin(phase) * 0.20), 0.12 + 0.1 * Math.abs(Math.sin(phase)), -6.72 + i * 0.52 + side * 0.13],
        spread: [0.28 + 0.14 * Math.abs(Math.cos(phase)), 0.20 + 0.14 * Math.abs(Math.sin(phase * 1.9)), 0.38 + Math.cos(phase) * 0.075],
        count: 78,
      };
    }));
    beds.push({ center: [0.02, 0.16, -6.91], spread: [0.62, 0.38, 0.48], count: 168 });
    return beds;
  }, []);
  return <Hydrangeas clouds={clouds} />;
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
  const spots = useMemo(() => behindHall ? GROVE.map(({ position: [x, y, z], ...rest }) => ({ ...rest, position: [x * 1.7, y, z - 10] as [number, number, number] })) : GROVE, [behindHall]);
  const trees = useMemo(() => spots.map(({ position, height }, ix) => ({ position, scale: (height ?? 8) / 8, rotationY: ix * 2.39996 })), [spots]);
  const shrubs = useMemo(() => Array.from({ length: IS_HANDHELD ? 17 : 30 }, (_, i) => ({
    position: [Math.sin(i * 2.39996) * 12, 0, (behindHall ? -18.4 : -12.1) - (i % 4) * 1.5] as Vec3,
    scale: 1.45 + 2.1 * Math.abs(Math.cos(i * 3.1)),
    rotationY: i * 1.8,
  })), [behindHall]);
  const understorey = useMemo<TreeSpot[]>(() => Array.from({ length: 21 }, (_, i) => ({
    position: [(i - 10) * 1.38 + Math.sin(i) * 1.2, -0.38, -17.4 - (i % 3) * 2.2] as Vec3,
    height: 2.6 + 3.4 * Math.abs(Math.sin(i * 2.21)),
  })), []);

  return (
    <>
      {ready ? <PhScatter id="tree_small_02" items={trees} height={8} /> : <Forest kind="broadleaf" spots={spots} leafColor="#516747" seed={427} />}
      {!behindHall && <Forest kind="broadleaf" spots={understorey} leafColor="#627947" castShadow={false} seed={834} />}
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
