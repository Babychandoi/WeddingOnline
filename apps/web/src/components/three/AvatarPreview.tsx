'use client';

/**
 * Full-body, turnable preview of the guest's character in the lobby. Uses the hall's own
 * HumanAvatar, so a real person (with their motion) and the drawn mix-and-match figure look
 * exactly as they will inside.
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { HumanAvatar } from './HumanAvatar';

export type PreviewFocus = 'body' | 'face';

export interface AvatarPreviewProps {
  personId: string;
  outfitId: string;
  hairId: string;
  hairColor: string;
  displayName: string;
  /** idle | wave | clap | cheers | drink */
  anim: string;
  focus: PreviewFocus;
  /** Slow turntable; the page turns it off when the guest drags the view */
  spin: boolean;
  onUserRotate: () => void;
}

const FRAMING: Record<PreviewFocus, { target: THREE.Vector3; distance: number }> = {
  body: { target: new THREE.Vector3(0, 0.9, 0), distance: 4.5 },
  face: { target: new THREE.Vector3(0, 1.56, 0), distance: 1.05 },
};

/** Glides the camera between the full-body and face framings, keeping the current angle */
function FocusRig({ focus, controls }: { focus: PreviewFocus; controls: React.RefObject<OrbitControlsImpl> }) {
  const { camera, size } = useThree();
  const moving = useRef(true);
  const dir = useMemo(() => new THREE.Vector3(), []);
  const goal = useMemo(() => new THREE.Vector3(), []);
  useEffect(() => {
    moving.current = true;
  }, [focus, size.width, size.height]);
  useFrame((_, dt) => {
    const c = controls.current;
    if (!c || !moving.current) return;
    const f = FRAMING[focus];
    // Narrow (phone) views need more room for arms and the controls over the canvas
    const distance = focus === 'body' && size.width < size.height * 1.05 ? 5.4 : f.distance;
    const k = 1 - Math.exp(-dt * 6);
    c.target.lerp(f.target, k);
    dir.copy(camera.position).sub(c.target);
    dir.y = focus === 'face' ? 0.05 : Math.max(dir.y, 0.1);
    dir.normalize();
    goal.copy(c.target).addScaledVector(dir, distance);
    camera.position.lerp(goal, k);
    c.update();
    if (camera.position.distanceTo(goal) < 0.01 && c.target.distanceTo(f.target) < 0.01) moving.current = false;
  });
  return null;
}

export default function AvatarPreview({ personId, outfitId, hairId, hairColor, displayName, anim, focus, spin, onUserRotate }: AvatarPreviewProps) {
  const controls = useRef<OrbitControlsImpl>(null);
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 1.1, 5], fov: 30, near: 0.05, far: 40 }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
      style={{ touchAction: 'none' }}
    >
      <hemisphereLight args={['#fff7ee', '#e9d6c8', 0.9]} />
      <ambientLight intensity={0.25} />
      <directionalLight position={[2.5, 4, 3]} intensity={2.2} castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.0004} />
      <directionalLight position={[-3, 2.5, -2]} intensity={0.9} color="#ffe6d6" />
      <pointLight position={[0, 1.6, 2.2]} intensity={1.4} distance={6} color="#fff1e6" />
      <Environment resolution={128} frames={1} environmentIntensity={0.75}>
        <Lightformer form="rect" intensity={2.2} color="#fff6e8" scale={[6, 4, 1]} position={[0, 4, 3]} target={[0, 1.2, 0]} />
        <Lightformer form="circle" intensity={2.8} color="#ffe4c4" scale={3} position={[3, 2.2, 2]} target={[0, 1.4, 0]} />
        <Lightformer form="rect" intensity={1.2} color="#e8eef8" scale={[5, 4, 1]} position={[-3, 2, -2]} target={[0, 1.2, 0]} />
      </Environment>

      <HumanAvatar
        id={`preview-${personId || outfitId}`}
        displayName={displayName}
        outfitId={outfitId}
        hairId={hairId}
        hairColor={hairColor}
        personId={personId}
        targetX={0}
        targetZ={0}
        targetRotY={0}
        anim={anim}
        showLabel={false}
      />

      {/* A round pale stage under the feet */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.002, 0]} receiveShadow>
        <circleGeometry args={[1.1, 48]} />
        <meshStandardMaterial color="#f6ece4" roughness={0.9} />
      </mesh>
      <ContactShadows position={[0, 0.001, 0]} opacity={0.45} scale={3} blur={2.4} far={2} />

      <OrbitControls
        ref={controls}
        enablePan={false}
        minDistance={0.8}
        maxDistance={7}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 1.9}
        autoRotate={spin}
        autoRotateSpeed={0.7}
        onStart={onUserRotate}
      />
      <FocusRig focus={focus} controls={controls} />
    </Canvas>
  );
}
