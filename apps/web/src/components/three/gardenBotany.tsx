'use client';

import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { IS_HANDHELD } from './deviceTier';
import { domePoints, leafBlade } from './realGeometry';
import { leaves } from './realMaterials';
import { InstancedSet } from './realProps';

type Vec3 = [number, number, number];
export type FlowerCloud = { center: Vec3; spread: Vec3; count: number; wrapped?: boolean };

const UP = new THREE.Vector3(0, 1, 0);
const PETAL_ROOT = new THREE.Color('#cdd1ab');
const PETAL_TIP = new THREE.Color('#fdfdf9');
const PETAL_VEIN = new THREE.Color('#d9dfbe');
const IVORY_TINTS = ['#ffffff', '#fbf9f0', '#f4f9f1', '#f7f4e8', '#fdfcf9'];

/** Four separately curved sepals overlap around the raised centre of one floret. */
function floretGeometry(cupped: boolean): THREE.BufferGeometry {
  const stations = IS_HANDHELD ? [0, 0.22, 0.52, 0.82, 1] : [0, 0.15, 0.36, 0.58, 0.78, 0.94, 1];
  const ribs = [-1, 0, 1];
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const tint = new THREE.Color();

  for (let petal = 0; petal < 4; petal++) {
    const start = positions.length / 3;
    const angle = petal * Math.PI / 2 + [0.04, -0.09, 0.08, -0.05][petal];
    const axisX = Math.cos(angle);
    const axisZ = Math.sin(angle);
    const length = (cupped ? 0.023 : 0.031) * [0.94, 1.05, 0.91, 1.07][petal];
    const curl = (cupped ? 0.013 : 0.0042) * [1.23, 0.61, 0.91, 1.08][petal];

    for (const time of stations) {
      const belly = Math.sin(Math.PI * time);
      const width = (cupped ? 0.0126 : 0.0172) * belly ** 0.55 + 0.00015;
      for (const rib of ribs) {
        const across = width * rib + (petal % 2 ? 1 : -1) * 0.0024 * belly;
        const out = 0.003 + length * time - Math.abs(rib) * belly * 0.0029;
        // The lip curls in, and the raised rib catches light differently from the rim.
        const y = 0.0007 + curl * time ** 1.52 + belly * (0.0028 - 0.0024 * Math.abs(rib))
          + across * time * (petal % 2 ? 0.13 : -0.16);
        positions.push(axisX * out - axisZ * across, y, axisZ * out + axisX * across);
        tint.copy(PETAL_ROOT).lerp(PETAL_TIP, THREE.MathUtils.smoothstep(time, 0.05, 0.62));
        tint.lerp(PETAL_VEIN, rib === 0 ? belly * (1 - time) * 0.17 : 0);
        colors.push(tint.r, tint.g, tint.b);
      }
    }
    for (let row = 0; row < stations.length - 1; row++) {
      for (let rib = 0; rib < ribs.length - 1; rib++) {
        const heel = start + row * ribs.length + rib;
        const tip = heel + ribs.length;
        indices.push(heel, heel + 1, tip, heel + 1, tip + 1, tip);
      }
    }
  }

  const centre = new THREE.IcosahedronGeometry(0.0036, 0);
  const points = centre.attributes.position;
  for (let i = 0; i < points.count; i++) {
    const elevation = points.getY(i);
    tint.set('#c7c58f').lerp(PETAL_TIP, THREE.MathUtils.smoothstep(elevation, -0.0014, 0.0030));
    indices.push(positions.length / 3);
    positions.push(points.getX(i), 0.0027 + elevation * 0.8, points.getZ(i));
    colors.push(tint.r, tint.g, tint.b);
  }
  centre.dispose();

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

type PlantPart = { position: Vec3; quaternion: THREE.Quaternion; scale: number | Vec3; color: string };

function stemBetween(from: THREE.Vector3, to: THREE.Vector3, radius: number, color: string, turn = 0): PlantPart {
  const direction = to.clone().sub(from);
  const length = direction.length();
  return {
    position: from.clone().lerp(to, 0.5).toArray(),
    quaternion: new THREE.Quaternion().setFromUnitVectors(UP, direction.normalize())
      .multiply(new THREE.Quaternion().setFromAxisAngle(UP, turn)),
    scale: [radius, length, radius],
    color,
  };
}

function arrangeClouds(clouds: FlowerCloud[]) {
  const open: PlantPart[] = [];
  const cups: PlantPart[] = [];
  const buds: PlantPart[] = [];
  const stems: PlantPart[] = [];
  const foliage: PlantPart[] = [];
  const spray = domePoints(IS_HANDHELD ? 7 : 9, 1, -0.24);

  clouds.forEach(({ center, spread, count, wrapped }, cloud) => {
    const flowersPerHead = wrapped ? (IS_HANDHELD ? 8 : 6) : (IS_HANDHELD ? 10 : 8);
    const heads = Math.max(6, Math.round(count / flowersPerHead));
    const root = new THREE.Vector3(center[0], wrapped ? center[1] : 0.019, center[2]);
    domePoints(heads, 1, wrapped ? -0.91 : -0.24).forEach(({ n }, head) => {
      const phase = head * 2.39996 + cloud * 1.718;
      const uneven = 0.54 + 0.40 * Math.abs(Math.sin(phase * 1.31));
      const base = new THREE.Vector3(
        center[0] + n.x * spread[0] * uneven,
        center[1] + n.y * spread[1] * uneven,
        center[2] + n.z * spread[2] * uneven,
      );
      const growth = n.clone().add(new THREE.Vector3(0.13 * Math.cos(phase), 0.30, 0.13 * Math.sin(phase))).normalize();
      const orientation = new THREE.Quaternion().setFromUnitVectors(UP, growth)
        .multiply(new THREE.Quaternion().setFromAxisAngle(UP, phase));
      const radius = (0.060 + Math.min(0.37, spread[0]) * 0.100) * (0.79 + 0.38 * Math.abs(Math.cos(phase * 1.35)));
      const fork = base.clone().addScaledVector(growth, -radius * 0.5);
      const stalk = head % 2 ? '#798854' : '#a5af73';
      const foot = root.clone().lerp(fork, wrapped ? 0.18 : 0.42);
      if (!wrapped) foot.y = root.y;
      stems.push(stemBetween(foot, fork, 1.06, stalk, phase));

      // Small sprays overlap at different depths, each centered on an actual stem.
      spray.forEach(({ n: localNormal }, bloom) => {
        const wobble = phase + bloom * 1.53;
        const offset = localNormal.clone().multiplyScalar(radius * (0.64 + 0.38 * Math.abs(Math.sin(wobble))));
        offset.y += Math.sin(wobble * 1.29) * 0.018;
        const tip = offset.applyQuaternion(orientation).add(base);
        const facing = localNormal.clone().setY(localNormal.y + 0.88).normalize().applyQuaternion(orientation);
        const twist = new THREE.Quaternion().setFromUnitVectors(UP, facing)
          .multiply(new THREE.Quaternion().setFromAxisAngle(UP, wobble * 2.3));
        const size = 0.78 + 0.56 * Math.abs(Math.cos(wobble * 1.43));
        const floret = { position: tip.toArray(), quaternion: twist, scale: size, color: IVORY_TINTS[(head + bloom * 3 + cloud) % IVORY_TINTS.length] };
        (bloom % 4 === 2 ? cups : open).push(floret);
        stems.push(stemBetween(fork, tip, 0.38, stalk, wobble));
      });

      const bud = base.clone().addScaledVector(growth, radius * 1.04);
      bud.x += 0.027 * Math.cos(phase * 1.7);
      bud.z += 0.027 * Math.sin(phase * 1.7);
      buds.push({
        position: bud.toArray(),
        quaternion: new THREE.Quaternion().setFromUnitVectors(UP, bud.clone().sub(fork).normalize()),
        scale: 0.78 + 0.44 * Math.abs(Math.sin(phase)),
        color: head % 3 ? '#e9e9cd' : '#c9d4a6',
      });
      stems.push(stemBetween(fork, bud, 0.53, stalk, phase));

      if (head % 3 === 0) {
        const leafPoint = base.clone().lerp(root, 0.46);
        foliage.push({
          position: leafPoint.toArray(),
          quaternion: new THREE.Quaternion().setFromEuler(new THREE.Euler(1.1 + 0.55 * Math.sin(phase), phase, 0.49 * Math.cos(phase), 'YXZ')),
          scale: 0.95 + 0.74 * Math.abs(Math.cos(phase * 1.5)),
          color: head % 2 ? '#81956f' : '#607955',
        });
      }
    });

    if (!wrapped) {
      for (let leaf = 0; leaf < 6; leaf++) {
        const angle = leaf * 2.39996 + cloud * 0.83;
        const delta = 0.052 + 0.044 * Math.abs(Math.sin(angle));
        foliage.push({
          position: [root.x + Math.sin(angle) * delta, root.y + 0.065 + Math.cos(angle) * 0.025, root.z + Math.cos(angle) * delta],
          quaternion: new THREE.Quaternion().setFromEuler(new THREE.Euler(0.97 + Math.sin(angle) * 0.29, angle, 0.29, 'YXZ')),
          scale: 1.24 + 0.44 * Math.abs(Math.cos(angle)),
          color: leaf % 2 ? '#68865a' : '#7b9571',
        });
      }
    }
  });

  return { open, cups, buds, stems, foliage };
}

export function GardenHydrangeas({ clouds }: { clouds: FlowerCloud[] }) {
  const parts = useMemo(() => {
    const petals = new THREE.MeshLambertMaterial({
      side: THREE.DoubleSide,
      vertexColors: true,
      emissive: '#e6e8da',
      emissiveIntensity: 0.22,
    });
    const vegetation = new THREE.MeshLambertMaterial();
    const open = floretGeometry(false);
    const cups = floretGeometry(true);
    const buds = new THREE.IcosahedronGeometry(0.0074, 0).scale(0.8, 1.20, 0.84);
    const stems = new THREE.CylinderGeometry(0.0015, 0.0023, 1, 4, 2, true);
    const stemPoints = stems.attributes.position;
    for (let i = 0; i < stemPoints.count; i++) {
      const y = stemPoints.getY(i);
      stemPoints.setX(i, stemPoints.getX(i) + 0.021 * (1 - 4 * y * y));
    }
    stems.computeVertexNormals();
    return { petals, vegetation, open, cups, buds, stems };
  }, []);

  useEffect(() => () => {
    Object.values(parts).forEach((part) => part.dispose());
  }, [parts]);

  const plants = useMemo(() => arrangeClouds(clouds), [clouds]);
  return (
    <>
      <InstancedSet geometry={parts.open} material={parts.petals} items={plants.open} />
      <InstancedSet geometry={parts.cups} material={parts.petals} items={plants.cups} castShadow={!IS_HANDHELD} />
      <InstancedSet geometry={parts.buds} material={parts.vegetation} items={plants.buds} castShadow={false} />
      <InstancedSet geometry={parts.stems} material={parts.vegetation} items={plants.stems} castShadow={false} />
      <InstancedSet geometry={leafBlade()} material={leaves('#e8ebd8')} items={plants.foliage} castShadow={false} />
    </>
  );
}
