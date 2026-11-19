'use client';

import React, { useEffect, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const glbCache = new Map<string, Promise<THREE.Group>>();
const sharedLoader = new GLTFLoader();

/**
 * Our generated models have some triangles wound the wrong way round (their vertex normals
 * point out, the winding points in). Those faces get culled, so you see the dark inside of
 * the cake through holes. Flip every triangle whose winding disagrees with its normals.
 */
function repairWinding(root: THREE.Object3D) {
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const n = new THREE.Vector3();
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    const g = mesh.geometry as THREE.BufferGeometry;
    const pos = g.attributes.position;
    const nor = g.attributes.normal;
    if (!pos || !nor) return;
    if (!g.index) g.setIndex(Array.from({ length: pos.count }, (_, i) => i));
    const idx = g.index!;
    for (let t = 0; t < idx.count; t += 3) {
      const i0 = idx.getX(t);
      const i1 = idx.getX(t + 1);
      const i2 = idx.getX(t + 2);
      a.fromBufferAttribute(pos, i0);
      b.fromBufferAttribute(pos, i1).sub(a);
      c.fromBufferAttribute(pos, i2).sub(a);
      n.fromBufferAttribute(nor, i0).add(new THREE.Vector3().fromBufferAttribute(nor, i1)).add(new THREE.Vector3().fromBufferAttribute(nor, i2));
      if (b.cross(c).dot(n) < 0) {
        idx.setX(t + 1, i2);
        idx.setX(t + 2, i1);
      }
    }
    idx.needsUpdate = true;
  });
}

function loadGlbCached(url: string): Promise<THREE.Group> {
  let pending = glbCache.get(url);
  if (!pending) {
    pending = new Promise<THREE.Group>((resolve, reject) => {
      sharedLoader.load(
        url,
        (gltf) => {
          repairWinding(gltf.scene);
          resolve(gltf.scene);
        },
        undefined,
        (err) => {
          glbCache.delete(url);
          reject(err);
        }
      );
    });
    glbCache.set(url, pending);
  }
  return pending;
}

export interface GlbAssetMeshProps {
  url: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
  fallback?: React.ReactNode;
}

export const GlbAssetMesh: React.FC<GlbAssetMeshProps> = ({
  url,
  position,
  rotation,
  scale,
  fallback,
}) => {
  const [sceneClone, setSceneClone] = useState<THREE.Group | null>(null);

  useEffect(() => {
    let active = true;
    loadGlbCached(url)
      .then((original) => {
        if (!active) return;
        setSceneClone(original.clone(true));
      })
      .catch(() => {
        // Fallback procedural mesh stays visible if .glb cannot load
      });
    return () => {
      active = false;
    };
  }, [url]);

  if (sceneClone) {
    return (
      <primitive
        object={sceneClone}
        position={position}
        rotation={rotation}
        scale={scale}
      />
    );
  }

  if (!fallback) return null;

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {fallback}
    </group>
  );
};
