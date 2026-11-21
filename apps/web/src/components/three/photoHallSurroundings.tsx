'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PhotoArchitecture } from './photoArchitecture';
import { PhotoTerrain, samplePhotoTerrainHeight } from './photoTerrain';
import { PhotoVegetation } from './photoVegetation';
import { photoHallSeed, type PhotoHallProfile } from './photoHallProfiles';
import { painted, wood } from './realMaterials';
import { InstancedSet } from './realProps';

type Vessel = 'sampans' | 'houseboats' | 'feluccas' | 'gondolas' | 'outrigger';
type Position = [number, number, number];

const HULL = wood('#463128', 0.52);
const PLANK = wood('#896449', 0.81);
const RATTAN = painted('#8e6b42', 0.91);
const CLOTH = new THREE.MeshStandardMaterial({ color: '#e9dec8', roughness: 0.92, side: THREE.DoubleSide });
const BEAM = new THREE.CylinderGeometry(1, 1, 1, 7);
const THATCH = painted('#8d7756', 0.97);

function buildHull() {
  const vertices: number[] = [];
  const uvs: number[] = [];
  const triangles: number[] = [];
  const section: [number, number][] = [[-1, 0.49], [-0.83, 0.22], [-0.47, -0.13], [0.47, -0.13], [0.83, 0.22], [1, 0.49]];
  const deck = new THREE.Shape();
  for (let i = 0; i <= 32; i++) {
    const fraction = i / 32;
    const width = 0.05 + 0.94 * Math.pow(Math.sin(fraction * Math.PI), 0.73) * (1.1 - fraction * 0.27);
    const rise = 0.26 * (2 * fraction - 1) ** 4;
    const z = fraction * 6.2 - 3.1;
    section.forEach(([x, y], index) => {
      vertices.push(x * width, y + rise - Math.abs(x) * 0.013, z);
      uvs.push(fraction * 3, index / (section.length - 1));
    });
    if (i === 0) deck.moveTo(-width, -z);
    else deck.lineTo(-width, -z);
    if (i === 0) continue;
    for (let j = 0; j < section.length - 1; j++) {
      const current = i * section.length + j;
      const previous = current - section.length;
      triangles.push(current, previous, previous + 1, current, previous + 1, current + 1);
    }
  }
  for (let i = 32; i >= 0; i--) {
    const fraction = i / 32;
    deck.lineTo(vertices[(i * section.length + section.length - 1) * 3], 3.1 - fraction * 6.2);
  }
  const hull = new THREE.BufferGeometry();
  hull.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  hull.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  hull.setIndex(triangles);
  hull.computeVertexNormals();
  return { hull, deck };
}

const BOAT = buildHull();
const DECK = new THREE.ShapeGeometry(BOAT.deck, 8);
const HULL_MAT = HULL.clone();
HULL_MAT.side = THREE.DoubleSide;
const CANOPY = new THREE.CylinderGeometry(1.01, 1.01, 3.65, 24, 1, true, Math.PI / 2, Math.PI);
const RATTAN_MAT = RATTAN.clone();
RATTAN_MAT.side = THREE.DoubleSide;

function reefSail() {
  const sail = new THREE.PlaneGeometry(1, 1, 16, 18);
  const positions = sail.getAttribute('position');
  for (let i = 0; i < positions.count; i++) {
    const u = positions.getX(i) + 0.5;
    const v = positions.getY(i) + 0.5;
    positions.setXYZ(i, 0.54 * u * Math.sin(Math.PI * v) + 0.26 * Math.sin(u * Math.PI) * Math.sin(v * Math.PI), 1.17 + 3.4 * v, 0.38 - 3.4 * u * Math.pow(1 - v, 0.87) + 0.42 * v);
  }
  sail.computeVertexNormals();
  return sail;
}

const SAIL = reefSail();
const HOUSE_FRAME = [-1.65, -0.86, 0, 0.86, 1.65].flatMap((z) => [-0.94, 0.94].map((x) => ({ position: [x, 0.94, z] as Position, scale: [0.043, 1.05, 0.043] as Position })));

function OnTheWater({ kind, position, rotation, size }: { kind: Vessel; position: Position; rotation: number; size: number }) {
  const bob = useRef<THREE.Group>(null);
  const covered = kind === 'houseboats' || kind === 'sampans';
  useFrame(({ clock }) => {
    if (!bob.current) return;
    const sway = clock.elapsedTime * 0.83 + position[0] * 0.19;
    bob.current.rotation.z = Math.sin(sway) * 0.02;
    bob.current.rotation.x = Math.sin(sway * 0.77) * 0.012;
  });
  return (
    <group position={position} rotation-y={rotation} scale={size}>
      <group ref={bob}>
        <mesh geometry={BOAT.hull} material={HULL_MAT} userData={{ noCastShadow: true }} dispose={null} />
        <mesh geometry={DECK} material={PLANK} rotation-x={-Math.PI / 2} position-y={0.30} dispose={null} />
        {covered && (
          <group scale={kind === 'sampans' ? [0.73, 0.72, 0.74] : 1}>
            <InstancedSet geometry={BEAM} material={PLANK} items={HOUSE_FRAME} castShadow={false} />
            <mesh geometry={CANOPY} material={RATTAN_MAT} rotation-x={Math.PI / 2} position-y={1.45} dispose={null} />
            {[-1.72, -1.2, -0.62, 0, 0.62, 1.2, 1.72].map((z) => (
              <mesh key={z} position={[0, 1.45, z]} material={PLANK}>
                <torusGeometry args={[1.005, 0.022, 5, 20, Math.PI]} />
              </mesh>
            ))}
          </group>
        )}
        {kind === 'feluccas' && (
          <>
            <mesh position={[0, 2.17, 0.39]} material={PLANK} geometry={BEAM} scale={[0.043, 3.7, 0.043]} dispose={null} />
            <mesh geometry={SAIL} material={CLOTH} dispose={null} />
          </>
        )}
        {kind === 'gondolas' && (
          <>
            <mesh position={[0, 0.65, -2.92]} rotation-z={0.14}>
              <boxGeometry args={[0.09, 0.8, 0.21]} />
              <meshStandardMaterial color="#a6a6a0" metalness={0.58} roughness={0.44} />
            </mesh>
            <mesh position={[0, 0.47, 0.57]}><boxGeometry args={[0.73, 0.2, 1.1]} /><meshStandardMaterial color="#762c30" roughness={0.63} /></mesh>
          </>
        )}
        {kind === 'outrigger' && <group position-x={1.96}>
          <mesh geometry={BOAT.hull} material={PLANK} scale={[0.14, 0.56, 0.74]} dispose={null} />
          {[-1.16, 1.16].map((z) => <mesh key={z} position={[-0.9, 0.46, z]} rotation-z={Math.PI / 2} scale={[0.045, 1.96, 0.045]} geometry={BEAM} material={PLANK} dispose={null} />)}
        </group>}
      </group>
    </group>
  );
}

function woodShelter(style: 'mountain-hut' | 'coastal-fales') {
  const hut = style === 'mountain-hut';
  const profile = new THREE.Shape().moveTo(-2.7, 0).lineTo(0, 1.9).lineTo(2.7, 0).lineTo(2.63, -0.18).lineTo(0, 1.59).lineTo(-2.63, -0.18).closePath();
  const roof = new THREE.ExtrudeGeometry(profile, { depth: 4.9, bevelEnabled: false, steps: 1 });
  roof.translate(0, 2.5, -2.45);
  const sticks = [];
  for (const side of [-1, 1]) {
    for (let i = 0; i < 54; i++) {
      const w = 0.5 + 0.5 * Math.sin(i * 10.52 + side);
      sticks.push({
        position: [side * (1.35 + w * 0.07), 3.52, (i / 53 - 0.5) * 4.92] as Position,
        rotation: [0, 0, side * 0.98] as Position,
        scale: [0.024 + w * 0.019, 3.35 + w * 0.07, 0.025 + w * 0.03] as Position,
        color: hut ? '#956b4d' : w > 0.5 ? '#ac8b5e' : '#806b4f',
      });
    }
  }
  return { roof, sticks };
}

function Shelter({ style, position }: { style: 'mountain-hut' | 'coastal-fales'; position: Position }) {
  const { roof, sticks } = useMemo(() => woodShelter(style), [style]);
  useEffect(() => () => roof.dispose(), [roof]);
  const hut = style === 'mountain-hut';
  return (
    <group position={position} rotation-y={-0.29}>
      <mesh geometry={roof} material={hut ? PLANK : THATCH} />
      <InstancedSet geometry={BEAM} material={hut ? PLANK : THATCH} items={sticks} castShadow={false} />
      <mesh position-y={0.13} material={PLANK}><boxGeometry args={[4.5, 0.36, 4.45]} /></mesh>
      {[-1, 1].flatMap((x) => [-2, 0, 2].map((z) => <mesh key={`${x}/${z}`} position={[x * 2.02, 1.3, z]} geometry={BEAM} material={PLANK} scale={[0.108, 2.65, 0.1]} dispose={null} />))}
      {hut && (
        <>
          <mesh position={[0, 1.27, 0]} material={PLANK}><boxGeometry args={[3.91, 2.11, 4.04]} /></mesh>
          <mesh position={[-0.58, 1.2, 2.05]} material={HULL}><boxGeometry args={[0.77, 1.7, 0.065]} /></mesh>
          <mesh position={[0.91, 1.51, 2.05]} material={HULL}><boxGeometry args={[0.65, 0.67, 0.075]} /></mesh>
        </>
      )}
    </group>
  );
}

function PhotoLandmarks({ style, ground }: { style: NonNullable<PhotoHallProfile['landmark']>; ground: (x: number, z: number) => number }) {
  const sites = useMemo(() => {
    if (style === 'mountain-hut' || style === 'coastal-fales') {
      const candidates: [number, number][] = style === 'mountain-hut' ? [[-18, -26], [-28, -44]] : [[-18, -7], [19, -12]];
      return candidates.map(([x, z]) => [x, Math.max(-0.005, ground(x, z)), z] as Position);
    }
    const candidates: [number, number][] = [[-17, -21], [8, -24], [21, -28], [-18, -34], [-7, -38], [15, -44], [31, -30], [-33, -18], [33, -38], [7, -51], [-13, -56], [-34, -42], [38, -47]];
    return candidates.filter(([x, z]) => ground(x, z) < -0.45).slice(0, style === 'gondolas' ? 4 : 3).map(([x, z]) => [x, -0.10, z] as Position);
  }, [style, ground]);
  if (style === 'mountain-hut' || style === 'coastal-fales') {
    return <>{sites.map((position) => <Shelter key={position.join()} style={style} position={position} />)}</>;
  }
  return <>{sites.map((position, index) => (
    <OnTheWater key={position.join()} kind={style} position={position} rotation={1.02 + index * 0.39} size={style === 'houseboats' ? 1.7 : 1.0 + index * 0.08} />
  ))}</>;
}

export function PhotoHallSurroundings({ variant, profile }: { variant: string; profile: PhotoHallProfile }) {
  const seed = photoHallSeed(variant);
  const { terrain, architecture, plants, landmark, palette } = profile;
  const groundHeight = useMemo(() => terrain
    ? (x: number, z: number) => samplePhotoTerrainHeight(terrain, seed, variant, x, z)
    : () => -0.035, [terrain, seed, variant]);
  return (
    <group name={`reference-hall-${variant}`}>
      {terrain && <PhotoTerrain style={terrain} seed={seed} variant={variant} palette={palette} />}
      {architecture && <PhotoArchitecture style={architecture} seed={seed} variant={variant} palette={palette} />}
      {plants && <PhotoVegetation style={plants} seed={seed} variant={variant} palette={palette} groundHeight={groundHeight} />}
      {landmark && <PhotoLandmarks style={landmark} ground={groundHeight} />}
    </group>
  );
}
