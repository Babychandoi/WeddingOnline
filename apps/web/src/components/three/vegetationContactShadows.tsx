'use client';

import { useEffect, useMemo } from 'react';
import * as THREE from 'three';

export interface VegetationFootprint {
  position: [number, number, number];
  radius: number;
  angle: number;
}

const DIVISIONS = 4;

function contactMask() {
  const size = 32;
  const pixels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = (x + 0.5) * 2 / size - 1;
      const v = (y + 0.5) * 2 / size - 1;
      const distance = u * u + v * v;
      const contact = Math.max(0, 1 - distance * 3.8);
      const penumbra = Math.max(0, 1 - distance);
      const index = (y * size + x) * 4;
      pixels.fill(255, index, index + 3);
      pixels[index + 3] = Math.round((contact * contact * 0.68 + penumbra * penumbra * 0.32) * 255);
    }
  }
  const texture = new THREE.DataTexture(pixels, size, size);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

const mask = contactMask();

/** Small static contacts under the trunk bases, even when dynamic shadows are off. */
export function VegetationContactShadows({ footprints, groundHeight, opacity = 0.24 }: {
  footprints: readonly VegetationFootprint[];
  groundHeight: (x: number, z: number) => number;
  opacity?: number;
}) {
  const geometry = useMemo(() => {
    const positions: number[] = [];
    const uv: number[] = [];
    const indices: number[] = [];
    const row = DIVISIONS + 1;

    for (const { position: [cx, , cz], radius, angle } of footprints) {
      const start = positions.length / 3;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      for (let z = 0; z < row; z++) {
        for (let x = 0; x < row; x++) {
          const u = x / DIVISIONS;
          const v = z / DIVISIONS;
          const sx = (2 * u - 1) * radius;
          const sz = (2 * v - 1) * radius * 0.75;
          const px = cx + sx * cos - sz * sin;
          const pz = cz + sz * cos + sx * sin;
          positions.push(px, groundHeight(px, pz) + 0.012, pz);
          uv.push(u, v);
          if (x < DIVISIONS && z < DIVISIONS) {
            const corner = start + z * row + x;
            indices.push(corner, corner + row, corner + 1, corner + row, corner + row + 1, corner + 1);
          }
        }
      }
    }

    return new THREE.BufferGeometry()
      .setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
      .setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
      .setIndex(indices);
  }, [footprints, groundHeight]);

  useEffect(() => () => geometry.dispose(), [geometry]);
  if (!footprints.length) return null;
  return (
    <mesh geometry={geometry} userData={{ noCastShadow: true }}>
      <meshBasicMaterial
        map={mask}
        color="#20221e"
        opacity={opacity}
        transparent
        depthWrite={false}
        polygonOffset
        polygonOffsetFactor={-1}
        polygonOffsetUnits={-1}
      />
    </mesh>
  );
}
