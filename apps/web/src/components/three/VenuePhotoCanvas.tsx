'use client';

import { lazy, Suspense, useLayoutEffect, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { HA_LONG_PHOTO_REFERENCE } from './HaLongPhotoReference';
import { HOI_AN_PHOTO_CAMERA } from './HoiAnPhotoReference';
import { RendererSetup } from './venueAtmosphere';
import { PhotoLoading, RELIEF_CAMERA, RELIEF_FOV, VenuePhotoRelief } from './venuePhotoRelief';
import type { VenuePhotoReference } from './venuePhotoReferences';

const HaLongPhotoScene = lazy(() => import('./HaLongPhotoScene').then(({ HaLongPhotoScene }) => ({ default: HaLongPhotoScene })));
const HoiAnPhotoScene = lazy(() => import('./HoiAnPhotoScene').then(({ HoiAnPhotoScene }) => ({ default: HoiAnPhotoScene })));

type Vec3 = [number, number, number];
type CameraView = { position: Vec3; target: Vec3 };
type CanvasReference = Exclude<VenuePhotoReference, { kind: 'garden' }>;
type LoadState = 'loading' | 'ready' | 'failed';
type CaptureWindow = Window & { __venueEnvReady?: boolean; __venueFrames?: number; __venueScene?: THREE.Scene };

function ReferenceFraming({ fov, aspect, frameDeck }: { fov: number; aspect?: number; frameDeck: boolean }) {
  const { camera, size } = useThree();
  useLayoutEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;
    const viewport = size.width / Math.max(size.height, 1);
    const portion = Math.tan(THREE.MathUtils.degToRad(fov * 0.5));
    const portrait = 1 - THREE.MathUtils.smoothstep(viewport, 0.43, 1.32);
    camera.fov = aspect
      ? THREE.MathUtils.radToDeg(2 * Math.atan(portion * Math.min(1, aspect / viewport) * 0.9))
      : fov + (frameDeck ? 18 : 12) * portrait;
    if (frameDeck && portrait > 0 && size.width > 0 && size.height > 0) {
      // Keep the life ring and the main limestone island above the preview controls on a phone.
      camera.setViewOffset(size.width, size.height, -size.width * 0.29 * portrait, size.height * 0.15 * portrait, size.width, size.height);
    } else {
      camera.clearViewOffset();
    }
    camera.updateProjectionMatrix();
  }, [camera, size.width, size.height, fov, aspect, frameDeck]);
  return null;
}

function CaptureFrames({ ready }: { ready: boolean }) {
  const scene = useThree((state) => state.scene);
  useEffect(() => {
    const frame = window as CaptureWindow;
    frame.__venueScene = scene;
    frame.__venueEnvReady = ready;
    frame.__venueFrames = 0;
    return () => {
      frame.__venueEnvReady = false;
      frame.__venueScene = undefined;
    };
  }, [scene, ready]);
  useFrame(() => {
    if (!ready) return;
    const frame = window as CaptureWindow;
    frame.__venueFrames = (frame.__venueFrames ?? 0) + 1;
  });
  return null;
}

export function VenuePhotoCanvas({ reference, background, capture, cameraOverride }: { reference: CanvasReference; background: string; capture: boolean; cameraOverride?: CameraView }) {
  const relief = reference.kind === 'relief' ? reference : undefined;
  const [status, setStatus] = useState<LoadState>(relief ? 'loading' : 'ready');
  const halong = reference.kind === 'halong';
  const profile = relief ? { ...RELIEF_CAMERA, fov: RELIEF_FOV } : halong ? HA_LONG_PHOTO_REFERENCE.camera : HOI_AN_PHOTO_CAMERA;
  const view = cameraOverride ?? profile;
  const sweep = relief ? 0.105 : halong ? 0.86 : 0.29;

  return (
    <div className="relative h-full w-full" style={{ backgroundColor: background }}>
      <Canvas
        shadows={relief ? false : 'soft'}
        dpr={[1, 1.55]}
        camera={{ position: view.position, fov: profile.fov, far: 1800 }}
        gl={{ preserveDrawingBuffer: capture, antialias: true }}
        fallback={<div className="grid h-full place-items-center px-5 text-center text-sm text-white">Thiết bị này chưa mở được cảnh WebGL.</div>}
      >
        <color attach="background" args={[background]} />
        <ReferenceFraming fov={profile.fov} aspect={relief ? relief.width / relief.height : undefined} frameDeck={halong} />
        <Suspense fallback={<PhotoLoading />}>
          {relief ? (
            <VenuePhotoRelief image={relief.image} depth={relief.image.replace(/\.webp$/, '.depth.webp')} aspect={relief.width / relief.height} onStatus={setStatus} />
          ) : (
            <>
              <RendererSetup exposure={1} />
              {halong ? <HaLongPhotoScene /> : <HoiAnPhotoScene />}
            </>
          )}
          {capture && <CaptureFrames ready={status === 'ready'} />}
        </Suspense>
        <OrbitControls target={view.target} enablePan={false} enableDamping dampingFactor={0.09}
          minDistance={cameraOverride ? 0.5 : relief ? 7.2 : halong ? 12 : 21}
          maxDistance={cameraOverride ? 700 : relief ? 10 : halong ? 34 : 54}
          minAzimuthAngle={cameraOverride ? -Infinity : -sweep} maxAzimuthAngle={cameraOverride ? Infinity : sweep}
          minPolarAngle={cameraOverride ? 0 : relief ? 1.51 : halong ? 1.0 : 1.43}
          maxPolarAngle={cameraOverride ? Math.PI : relief ? 1.635 : halong ? 1.66 : 1.75} />
      </Canvas>
      {status !== 'ready' && (
        <span className="pointer-events-none absolute inset-0 grid content-center justify-items-center px-5 text-center text-sm">
          <span className="rounded-full bg-stone-950/85 px-4 py-2 text-white">{status === 'failed' ? 'Không tải được ảnh tham chiếu.' : 'Đang dựng góc ảnh 3D…'}</span>
        </span>
      )}
    </div>
  );
}
