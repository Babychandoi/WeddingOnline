'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { FrameStyle3D, Walkthrough3DTheme } from './themes3d';

/**
 * 8 Distinct 3D Easel & Photo Frame Architectures!
 * All frames center their canvas/photo at local (0, 1.44, 0.1) with supports at z <= -0.07
 * so nothing ever blocks the artwork from the front or oblique angles.
 */
export function ThemedEaselFrame3D({
  position,
  rotationY,
  texture,
  matBoard = false,
  frameStyle = 'imperial-gold',
  accentGold = '#d4ad63',
  accentColor = '#9e1928',
  onSelect,
}: {
  position: [number, number, number];
  rotationY: number;
  texture: THREE.Texture | null;
  matBoard?: boolean;
  frameStyle?: FrameStyle3D;
  accentGold?: string;
  accentColor?: string;
  onSelect?: () => void;
}) {
  const floatRef = useRef<THREE.Group>(null);
  const isFloating = frameStyle === 'floating-crystal';

  useFrame(({ clock }) => {
    if (!isFloating || !floatRef.current) return;
    floatRef.current.position.y = 1.46 + Math.sin(clock.elapsedTime * 1.6 + position[2]) * 0.045;
  });

  const woodColor =
    frameStyle === 'lacquer-sonmai'
      ? '#4a0b10'
      : frameStyle === 'arch-cathedral' || frameStyle === 'pearl-rococo'
        ? '#efe8dc'
        : frameStyle === 'cinema-lightbox'
          ? '#18181b'
          : frameStyle === 'bamboo-scroll'
            ? '#8b5e34'
            : frameStyle === 'botanical-wreath'
              ? '#8c6b48'
              : '#734b2f';

  const borderColor =
    frameStyle === 'lacquer-sonmai'
      ? '#9e141b'
      : frameStyle === 'pearl-rococo'
        ? '#f5d6e0'
        : frameStyle === 'cinema-lightbox'
          ? '#27272a'
          : frameStyle === 'bamboo-scroll'
            ? '#d9c39e'
            : accentGold;

  return (
    <group
      position={position}
      rotation={[0, rotationY, 0]}
      onClick={(e) => {
        if (!onSelect) return;
        e.stopPropagation();
        onSelect();
      }}
    >
      {/* Support structure (omitted for levitating crystal frames, scroll-rack for bamboo-scroll) */}
      {isFloating ? (
        <group>
          {/* Glowing holographic floor ring beneath levitating crystal frame */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0.06]}>
            <ringGeometry args={[0.38, 0.48, 28]} />
            <meshBasicMaterial color={accentGold} transparent opacity={0.75} side={THREE.DoubleSide} toneMapped={false} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0.06]}>
            <circleGeometry args={[0.36, 24]} />
            <meshBasicMaterial color={accentColor} transparent opacity={0.22} toneMapped={false} />
          </mesh>
        </group>
      ) : frameStyle === 'bamboo-scroll' ? (
        <group>
          {/* Traditional hanging silk scroll stand */}
          <mesh position={[-0.58, 1.18, 0.04]}>
            <cylinderGeometry args={[0.032, 0.038, 2.36, 10]} />
            <meshStandardMaterial color={woodColor} roughness={0.65} />
          </mesh>
          <mesh position={[0.58, 1.18, 0.04]}>
            <cylinderGeometry args={[0.032, 0.038, 2.36, 10]} />
            <meshStandardMaterial color={woodColor} roughness={0.65} />
          </mesh>
          <mesh position={[0, 2.28, 0.04]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.036, 0.036, 1.42, 10]} />
            <meshStandardMaterial color={woodColor} roughness={0.6} />
          </mesh>
          <mesh position={[-0.58, 0.05, 0.04]}>
            <boxGeometry args={[0.16, 0.08, 0.42]} />
            <meshStandardMaterial color="#5c3d22" roughness={0.8} />
          </mesh>
          <mesh position={[0.58, 0.05, 0.04]}>
            <boxGeometry args={[0.16, 0.08, 0.42]} />
            <meshStandardMaterial color="#5c3d22" roughness={0.8} />
          </mesh>
        </group>
      ) : (
        <group>
          {/* Backward-leaning tripod legs safely behind artwork */}
          <mesh position={[-0.31, 1.08, -0.08]} rotation={[-0.06, 0, -0.14]}>
            <boxGeometry args={[0.052, 2.26, 0.052]} />
            <meshStandardMaterial color={woodColor} roughness={0.72} />
          </mesh>
          <mesh position={[0.31, 1.08, -0.08]} rotation={[-0.06, 0, 0.14]}>
            <boxGeometry args={[0.052, 2.26, 0.052]} />
            <meshStandardMaterial color={woodColor} roughness={0.72} />
          </mesh>
          <mesh position={[0, 1.02, -0.4]} rotation={[-0.26, 0, 0]}>
            <boxGeometry args={[0.05, 2.18, 0.05]} />
            <meshStandardMaterial color={woodColor} roughness={0.82} />
          </mesh>
          <mesh position={[0, 1.2, -0.07]} rotation={[-0.06, 0, 0]}>
            <boxGeometry args={[0.058, 2.18, 0.045]} />
            <meshStandardMaterial color={woodColor} roughness={0.75} />
          </mesh>
          <mesh position={[0, 0.42, -0.02]}>
            <boxGeometry args={[0.74, 0.045, 0.045]} />
            <meshStandardMaterial color={woodColor} roughness={0.75} />
          </mesh>
          <mesh position={[0, 0.78, 0.09]}>
            <boxGeometry args={[1.08, 0.055, 0.1]} />
            <meshStandardMaterial color={frameStyle === 'lacquer-sonmai' ? accentGold : woodColor} roughness={0.55} />
          </mesh>
        </group>
      )}

      {/* Artwork + Frame Assembly */}
      <group
        ref={floatRef}
        position={[0, 1.44, frameStyle === 'bamboo-scroll' ? 0.07 : 0.1]}
        rotation={[isFloating || frameStyle === 'bamboo-scroll' ? 0 : -0.06, 0, 0]}
      >
        {/* Backing frame box */}
        <mesh position={[0, 0, -0.02]}>
          <boxGeometry args={[1.04, 1.28, 0.042]} />
          <meshStandardMaterial
            color={borderColor}
            roughness={isFloating ? 0.15 : 0.38}
            metalness={isFloating || frameStyle === 'imperial-gold' ? 0.48 : 0.2}
          />
        </mesh>

        {/* Style-specific sculptural frame ornaments (always outside the inner photo rect!) */}
        {frameStyle === 'arch-cathedral' && (
          <mesh position={[0, 0.64, -0.018]} rotation={[Math.PI / 2, 0, -Math.PI / 2]}>
            <cylinderGeometry args={[0.52, 0.52, 0.042, 24, 1, false, 0, Math.PI]} />
            <meshStandardMaterial color={accentGold} roughness={0.35} metalness={0.45} />
          </mesh>
        )}

        {frameStyle === 'lacquer-sonmai' && (
          <group>
            <mesh position={[0, 0.68, -0.01]}>
              <boxGeometry args={[0.42, 0.09, 0.05]} />
              <meshStandardMaterial color={accentGold} metalness={0.5} roughness={0.3} />
            </mesh>
            {[
              [-0.49, 0.61],
              [0.49, 0.61],
              [-0.49, -0.61],
              [0.49, -0.61],
            ].map(([cx, cy], idx) => (
              <mesh key={idx} position={[cx, cy, 0.004]}>
                <boxGeometry args={[0.09, 0.09, 0.02]} />
                <meshBasicMaterial color={accentGold} toneMapped={false} />
              </mesh>
            ))}
          </group>
        )}

        {frameStyle === 'bamboo-scroll' && (
          <group>
            <mesh position={[0, 0.66, 0.01]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.028, 0.028, 1.16, 10]} />
              <meshStandardMaterial color="#5c3a1e" roughness={0.6} />
            </mesh>
            <mesh position={[0, -0.66, 0.01]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.032, 0.032, 1.18, 10]} />
              <meshStandardMaterial color="#5c3a1e" roughness={0.6} />
            </mesh>
            {/* Hanging crimson silk tassel below bottom scroll roller */}
            <mesh position={[0, -0.82, 0.01]}>
              <cylinderGeometry args={[0.012, 0.038, 0.24, 8]} />
              <meshBasicMaterial color={accentColor} toneMapped={false} />
            </mesh>
          </group>
        )}

        {frameStyle === 'botanical-wreath' && (
          <group>
            {[
              [-0.48, 0.6, accentColor],
              [-0.36, 0.65, '#fff5eb'],
              [-0.52, 0.48, '#4d7c59'],
              [0.48, -0.6, accentColor],
              [0.36, -0.65, '#fff5eb'],
              [0.52, -0.48, '#4d7c59'],
            ].map(([fx, fy, col], idx) => (
              <mesh key={idx} position={[fx as number, fy as number, 0.02]}>
                <sphereGeometry args={[0.075, 8, 8]} />
                <meshBasicMaterial color={col as string} toneMapped={false} />
              </mesh>
            ))}
          </group>
        )}

        {frameStyle === 'cinema-lightbox' && (
          <group>
            {[-0.42, -0.14, 0.14, 0.42].map((bx, i) => (
              <React.Fragment key={i}>
                <mesh position={[bx, 0.61, 0.012]}>
                  <sphereGeometry args={[0.022, 8, 8]} />
                  <meshBasicMaterial color="#ffe599" toneMapped={false} />
                </mesh>
                <mesh position={[bx, -0.61, 0.012]}>
                  <sphereGeometry args={[0.022, 8, 8]} />
                  <meshBasicMaterial color="#ffe599" toneMapped={false} />
                </mesh>
              </React.Fragment>
            ))}
          </group>
        )}

        {(frameStyle === 'floating-crystal' || frameStyle === 'pearl-rococo') && (
          <mesh position={[0, 0, -0.026]}>
            <boxGeometry args={[1.09, 1.33, 0.016]} />
            <meshBasicMaterial color={accentGold} transparent opacity={0.8} toneMapped={false} />
          </mesh>
        )}

        {matBoard && (
          <mesh position={[0, 0, 0.004]}>
            <planeGeometry args={[0.92, 1.16]} />
            <meshBasicMaterial color={frameStyle === 'cinema-lightbox' ? '#1f1f23' : '#f6efe2'} toneMapped={false} />
          </mesh>
        )}

        <mesh position={[0, 0, matBoard ? 0.012 : 0.009]}>
          <planeGeometry args={matBoard ? [0.82, 1.06] : [0.95, 1.19]} />
          <meshBasicMaterial
            key={texture?.uuid ?? 'easel-empty'}
            map={texture ?? undefined}
            color={texture ? '#ffffff' : '#f3e7d8'}
            toneMapped={false}
          />
        </mesh>
      </group>
    </group>
  );
}

/**
 * Spatial Set-Pieces matching the 6 Gallery Layouts (Central Rotunda Fountain/Tree,
 * Ascending Terrace Steps, Overhead Floral Alcove Arches, or Floating Archipelago Islands).
 */
export function LayoutArchitectureExtras({
  theme,
  islandPositions,
  alcoveZList,
  rotundaCenterZ,
}: {
  theme: Walkthrough3DTheme;
  islandPositions: Array<[number, number, number]>;
  alcoveZList: number[];
  rotundaCenterZ: number;
}) {
  const layout = theme.galleryLayout;

  return (
    <group>
      {/* Circular Rotunda Centerpiece + Plaza Ring */}
      {layout === 'rotunda-circle' && (
        <group position={[0, 0, rotundaCenterZ]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
            <circleGeometry args={[5.8, 40]} />
            <meshStandardMaterial color="#efeae0" roughness={0.85} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
            <ringGeometry args={[5.55, 5.75, 40]} />
            <meshBasicMaterial color={theme.accentGold} side={THREE.DoubleSide} toneMapped={false} />
          </mesh>
          {/* Sculptural Fountain / Glowing Centerpiece */}
          <mesh position={[0, 0.24, 0]}>
            <cylinderGeometry args={[1.05, 1.18, 0.44, 24]} />
            <meshStandardMaterial color="#f8f5ef" roughness={0.45} />
          </mesh>
          <mesh position={[0, 0.85, 0]}>
            <cylinderGeometry args={[0.22, 0.3, 1.1, 16]} />
            <meshStandardMaterial color={theme.accentGold} roughness={0.35} metalness={0.4} />
          </mesh>
          <mesh position={[0, 1.55, 0]}>
            <sphereGeometry args={[0.42, 16, 16]} />
            <meshBasicMaterial color={theme.accentGold} toneMapped={false} />
          </mesh>
        </group>
      )}

      {/* Paired Alcoves Overhead Arches */}
      {layout === 'paired-alcoves' &&
        alcoveZList.map((az) => (
          <mesh key={az} position={[0, 2.65, az]}>
            <torusGeometry args={[2.85, 0.055, 10, 32, Math.PI]} />
            <meshBasicMaterial color={theme.accentGold} toneMapped={false} />
          </mesh>
        ))}

      {/* Floating Archipelago Cloud/Crystal Plinths beneath each station */}
      {layout === 'floating-archipelago' &&
        islandPositions.map(([ix, iy, iz], idx) => (
          <group key={idx} position={[ix, iy - 0.16, iz]}>
            <mesh scale={[1.35, 0.32, 1.35]}>
              <dodecahedronGeometry args={[1.15, 1]} />
              <meshStandardMaterial color="#f5ecf8" roughness={0.75} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.19, 0]}>
              <ringGeometry args={[1.12, 1.22, 24]} />
              <meshBasicMaterial color={theme.accentGold} side={THREE.DoubleSide} toneMapped={false} />
            </mesh>
          </group>
        ))}
    </group>
  );
}

/**
 * Interactive 3D Celebration Firework & Golden Sparkle Fountain above the Ceremony Stage!
 */
export function CelebrationFireworks3D({
  burstCount,
  stagePos,
  accentGold,
  accentColor,
}: {
  burstCount: number;
  stagePos: [number, number, number];
  accentGold: string;
  accentColor: string;
}) {
  const count = 96;
  const ptsRef = useRef<THREE.Points>(null);
  const ageRef = useRef(99);

  const { geo, dirs } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const velocities: Array<[number, number, number]> = [];
    for (let i = 0; i < count; i++) {
      const theta = (i / count) * Math.PI * 2 * 5;
      const phi = Math.acos(1 - 2 * ((i + 0.5) / count));
      const speed = 2.2 + (i % 7) * 0.45;
      velocities.push([
        Math.sin(phi) * Math.cos(theta) * speed,
        Math.abs(Math.cos(phi)) * speed * 1.25 + 1.4,
        Math.sin(phi) * Math.sin(theta) * speed * 0.6,
      ]);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return { geo: g, dirs: velocities };
  }, []);

  useEffect(() => () => geo.dispose(), [geo]);

  useEffect(() => {
    if (burstCount <= 0) return;
    ageRef.current = 0;
    const attr = geo.getAttribute('position') as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    for (let i = 0; i < count; i++) {
      const originX = (i % 3 - 1) * 1.65;
      arr[i * 3] = stagePos[0] + originX;
      arr[i * 3 + 1] = stagePos[1] + 2.4;
      arr[i * 3 + 2] = stagePos[2] + 0.5;
    }
    attr.needsUpdate = true;
  }, [burstCount, geo, stagePos]);

  useFrame((_, delta) => {
    if (ageRef.current > 3.2 || !ptsRef.current) return;
    const dt = Math.min(0.05, delta);
    ageRef.current += dt;
    const attr = ptsRef.current.geometry.getAttribute('position') as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    for (let i = 0; i < count; i++) {
      const [vx, vy, vz] = dirs[i];
      arr[i * 3] += vx * dt;
      arr[i * 3 + 1] += (vy - ageRef.current * 2.6) * dt;
      arr[i * 3 + 2] += vz * dt;
    }
    attr.needsUpdate = true;
    const mat = ptsRef.current.material as THREE.PointsMaterial;
    mat.opacity = Math.max(0, 1 - ageRef.current / 3.0);
  });

  if (burstCount <= 0) return null;

  return (
    <points ref={ptsRef} geometry={geo}>
      <pointsMaterial
        color={burstCount % 2 === 0 ? accentColor : accentGold}
        size={0.22}
        transparent
        opacity={1}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}
