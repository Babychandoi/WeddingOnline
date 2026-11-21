'use client';

import { useEffect, useMemo, useState } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

export const RELIEF_FOV = 43;
export const RELIEF_CAMERA = {
  position: [0, 0, 0] as [number, number, number],
  target: [0, 0, -10] as [number, number, number],
};

interface ReliefAssets {
  source: THREE.Texture;
  geometry: THREE.BufferGeometry;
}

/** Put the bounds of a photograph on its original camera rays at the estimated distances. */
function reliefGeometry(depth: HTMLImageElement, aspect: number) {
  const grid = document.createElement('canvas');
  grid.width = 112;
  grid.height = Math.min(146, Math.max(56, Math.round(112 / aspect)));
  const sampler = grid.getContext('2d', { willReadFrequently: true });
  if (!sampler) throw new Error('No canvas for the depth texture');
  sampler.drawImage(depth, 0, 0, grid.width, grid.height);
  const pixels = sampler.getImageData(0, 0, grid.width, grid.height).data;
  const mesh = new THREE.PlaneGeometry(1, 1, grid.width - 1, grid.height - 1);
  const vertices = mesh.getAttribute('position');
  const uv = mesh.getAttribute('uv');
  const focal = Math.tan(THREE.MathUtils.degToRad(RELIEF_FOV * 0.5));
  for (let i = 0; i < vertices.count; i++) {
    const u = uv.getX(i);
    const v = uv.getY(i);
    const x = Math.round(u * (grid.width - 1));
    const y = Math.round((1 - v) * (grid.height - 1));
    const shift = pixels[4 * (y * grid.width + x)] / 255;
    const distance = THREE.MathUtils.lerp(15.6, 7.5, shift);
    vertices.setXYZ(i, (u * 2 - 1) * focal * distance * aspect, (v * 2 - 1) * focal * distance, -distance);
  }
  mesh.computeBoundingSphere();
  return mesh;
}

type LoadState = 'loading' | 'ready' | 'failed';

export function VenuePhotoRelief({ image, depth, aspect, onStatus }: { image: string; depth: string; aspect: number; onStatus: (status: LoadState) => void }) {
  const [assets, setAssets] = useState<ReliefAssets | null>(null);
  useEffect(() => {
    let active = true;
    let colorTexture: THREE.Texture | undefined;
    let geometry: THREE.BufferGeometry | undefined;
    onStatus('loading');

    const loadColor = new THREE.TextureLoader().loadAsync(image).then((texture) => {
      if (!active) texture.dispose();
      else colorTexture = texture;
      return texture;
    });
    const loadDepth = new THREE.ImageLoader().loadAsync(depth);
    Promise.all([loadColor, loadDepth]).then(([source, depthImage]) => {
      if (!active) return;
      source.colorSpace = THREE.SRGBColorSpace;
      source.anisotropy = 4;
      geometry = reliefGeometry(depthImage, aspect);
      setAssets({ source, geometry });
      onStatus('ready');
    }).catch(() => { if (active) onStatus('failed'); });

    return () => {
      active = false;
      colorTexture?.dispose();
      geometry?.dispose();
    };
  }, [image, depth, aspect, onStatus]);

  if (!assets) return null;
  return <ReliefSurface assets={assets} />;
}

function ReliefSurface({ assets }: { assets: ReliefAssets }) {
  const material = useMemo(() => new THREE.MeshBasicMaterial({ map: assets.source, toneMapped: false }), [assets.source]);
  useEffect(() => () => material.dispose(), [material]);
  return <mesh name="venue-reference-relief" geometry={assets.geometry} material={material} dispose={null} />;
}

export function PhotoLoading() {
  return <Html center><span className="whitespace-nowrap rounded-full bg-stone-950/80 px-4 py-2 text-sm text-white">Đang dựng góc ảnh 3D…</span></Html>;
}
