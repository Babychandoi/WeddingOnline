'use client';

import React, { useEffect, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const glbCache = new Map<string, Promise<THREE.Group>>();
const sharedLoader = new GLTFLoader();

function loadGlbCached(url: string): Promise<THREE.Group> {
  let pending = glbCache.get(url);
  if (!pending) {
    pending = new Promise<THREE.Group>((resolve, reject) => {
      sharedLoader.load(
        url,
        (gltf) => resolve(gltf.scene),
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
