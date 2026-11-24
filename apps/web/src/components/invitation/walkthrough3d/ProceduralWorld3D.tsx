'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { IS_HANDHELD } from '@/components/three/deviceTier';
import type { FrameStyle3D, Walkthrough3DTheme } from './themes3d';

/**
 * High-resolution 2048x1024 seamless procedural panorama skybox for the 90 non-raster 3D themes.
 * Uses deterministic pseudo-random numbers so every render of a theme is crisp and consistent.
 */
export function makeProceduralSkyTexture(theme: Walkthrough3DTheme): THREE.CanvasTexture {
  const w = IS_HANDHELD ? 1024 : 2048;
  const h = IS_HANDHELD ? 512 : 1024;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, theme.skyTop);
  grad.addColorStop(0.46, theme.skyMid);
  grad.addColorStop(0.72, theme.skyHorizon);
  grad.addColorStop(1, theme.fogColor);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  const seedBase = theme.id.split('').reduce((acc, ch) => acc * 31 + ch.charCodeAt(0), 7);
  const rand = (n: number) => {
    const x = Math.sin(seedBase * 0.017 + n * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  };

  const mood = theme.skyMood;

  // Stars for night / aurora / dusk skies
  if (mood === 'starry-aurora' || mood === 'lantern-night' || mood === 'city-bokeh' || mood === 'cinema-noir') {
    const starCount = mood === 'starry-aurora' ? 260 : 120;
    for (let i = 0; i < starCount; i++) {
      const sx = rand(i * 3 + 1) * w;
      const sy = rand(i * 3 + 2) * h * 0.58;
      const sr = 0.8 + rand(i * 3 + 3) * 2.1;
      ctx.fillStyle = `rgba(255, 250, 235, ${0.35 + rand(i * 5) * 0.65})`;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Sweeping Aurora Borealis / Galaxy ribbon
  if (mood === 'starry-aurora') {
    for (let band = 0; band < 3; band++) {
      ctx.save();
      ctx.globalAlpha = 0.22 - band * 0.05;
      const ag = ctx.createLinearGradient(0, h * 0.08, 0, h * 0.48);
      ag.addColorStop(0, 'transparent');
      ag.addColorStop(0.5, band % 2 === 0 ? theme.accentGold : theme.accentColor);
      ag.addColorStop(1, 'transparent');
      ctx.fillStyle = ag;
      ctx.beginPath();
      ctx.moveTo(0, h * (0.22 + band * 0.06));
      for (let x = 0; x <= w; x += 64) {
        const wave = Math.sin((x / w) * Math.PI * 4 + band * 1.4) * h * 0.055;
        ctx.lineTo(x, h * (0.22 + band * 0.06) + wave);
      }
      ctx.lineTo(w, h * 0.52);
      ctx.lineTo(0, h * 0.52);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  // Glowing Sun or Full Moon Halo at center horizon
  if (mood === 'sunset-ocean' || mood === 'sakura-dusk' || mood === 'aegean-day' || mood === 'cloud-heaven' || mood === 'starry-aurora') {
    const sunX = w * 0.5;
    const sunY = mood === 'starry-aurora' ? h * 0.28 : h * 0.56;
    const sunR = mood === 'sunset-ocean' ? h * 0.11 : h * 0.075;
    const halo = ctx.createRadialGradient(sunX, sunY, sunR * 0.2, sunX, sunY, sunR * 3.4);
    halo.addColorStop(0, 'rgba(255, 252, 235, 0.95)');
    halo.addColorStop(0.28, 'rgba(255, 232, 185, 0.55)');
    halo.addColorStop(1, 'rgba(255, 220, 170, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunR * 3.4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Soft Painterly Cloud Banks (tileable sin waves)
  if (mood !== 'cinema-noir') {
    for (let i = 0; i < 28; i++) {
      const cx = rand(i * 11 + 4) * w;
      const cy = h * (0.18 + rand(i * 11 + 5) * 0.36);
      const rw = w * (0.06 + rand(i * 11 + 6) * 0.1);
      const rh = h * (0.018 + rand(i * 11 + 7) * 0.032);
      ctx.fillStyle = `rgba(255, 246, 238, ${mood === 'cloud-heaven' ? 0.34 : 0.14})`;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rw, rh, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Layered Mountain / Karst Ridges for nature & heritage worlds
  if (mood === 'misty-karst' || mood === 'alpine-dawn' || mood === 'emerald-forest' || mood === 'sakura-dusk') {
    for (let layer = 0; layer < 3; layer++) {
      const baseY = h * (0.58 + layer * 0.055);
      const amp = mood === 'misty-karst' ? h * 0.11 : h * 0.075;
      ctx.fillStyle = layer === 0 ? `${theme.skyMid}aa` : layer === 1 ? `${theme.fogColor}cc` : theme.groundColor;
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 16) {
        const u = (x / w) * Math.PI * 2;
        const y =
          baseY -
          Math.abs(Math.sin(u * (3 + layer) + layer)) * amp -
          Math.sin(u * (7 + layer * 2)) * amp * 0.32;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();
    }
  }

  // City Skyline + Warm Golden Bokeh Lights for Rooftop / Urban / Lantern Night
  if (mood === 'city-bokeh' || mood === 'lantern-night') {
    if (mood === 'city-bokeh') {
      ctx.fillStyle = 'rgba(10, 14, 32, 0.72)';
      for (let x = 0; x < w; x += 34) {
        const bh = h * (0.06 + rand(x) * 0.18);
        ctx.fillRect(x, h * 0.68 - bh, 28, bh + h * 0.1);
      }
    }
    for (let i = 0; i < 95; i++) {
      const bx = rand(i * 7 + 20) * w;
      const by = h * (0.48 + rand(i * 7 + 21) * 0.24);
      const br = 3 + rand(i * 7 + 22) * 11;
      ctx.fillStyle = i % 3 === 0 ? 'rgba(255, 200, 110, 0.38)' : i % 3 === 1 ? 'rgba(255, 130, 170, 0.28)' : 'rgba(255, 240, 190, 0.32)';
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Dramatic Stage / Cathedral Light Rays
  if (mood === 'cathedral-warm' || mood === 'cinema-noir') {
    for (let i = 0; i < 6; i++) {
      const rx = w * (0.15 + i * 0.14);
      const rg = ctx.createLinearGradient(rx, 0, rx + 90, h * 0.75);
      rg.addColorStop(0, 'rgba(255, 232, 175, 0.16)');
      rg.addColorStop(1, 'rgba(255, 232, 175, 0)');
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.moveTo(rx - 30, 0);
      ctx.lineTo(rx + 30, 0);
      ctx.lineTo(rx + 180, h * 0.78);
      ctx.lineTo(rx - 120, h * 0.78);
      ctx.closePath();
      ctx.fill();
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.needsUpdate = true;
  return tex;
}

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
 * 10 Real 3D Architectural Entrance Gates for the 90 procedural 3D templates.
 * Clear opening is >= 3.6m wide x 4.3m high so camera & standee sightlines are wide open.
 */
export function ProceduralEntranceGate3D({ theme, zPos }: { theme: Walkthrough3DTheme; zPos: number }) {
  const s = theme.archStyle;
  const gold = theme.accentGold;
  const primary = theme.accentColor;

  if (s === 'crescent-moon') {
    return (
      <group position={[0, 0, zPos]}>
        <mesh position={[0, 2.75, 0]} rotation={[0, 0, 0.35]}>
          <torusGeometry args={[2.55, 0.18, 14, 48, Math.PI * 1.48]} />
          <meshBasicMaterial color={gold} toneMapped={false} />
        </mesh>
        <mesh position={[0, 2.75, -0.04]} rotation={[0, 0, 0.35]}>
          <torusGeometry args={[2.75, 0.04, 10, 48, Math.PI * 1.52]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.65} toneMapped={false} />
        </mesh>
        {[-2.2, 2.2].map((x) => (
          <mesh key={x} position={[x, 0.25, 0]} scale={[1.3, 0.55, 0.9]}>
            <sphereGeometry args={[0.72, 12, 10]} />
            <meshStandardMaterial color="#f5eefc" roughness={0.85} />
          </mesh>
        ))}
      </group>
    );
  }

  if (s === 'modern-halo') {
    return (
      <group position={[0, 0, zPos]}>
        <mesh position={[0, 2.55, 0]}>
          <torusGeometry args={[2.55, 0.065, 12, 56, Math.PI * 1.25]} />
          <meshBasicMaterial color={gold} toneMapped={false} />
        </mesh>
        <mesh position={[0.14, 2.42, -0.18]} rotation={[0, 0, -0.25]}>
          <torusGeometry args={[2.32, 0.045, 12, 56, Math.PI * 1.2]} />
          <meshBasicMaterial color={primary} toneMapped={false} />
        </mesh>
        {[-2.35, 2.35].map((x, idx) => (
          <group key={x} position={[x, 0, 0]}>
            <mesh position={[0, 0.75, 0]}>
              <boxGeometry args={[0.48, 1.5, 0.48]} />
              <meshStandardMaterial color="#f5efe6" roughness={0.5} />
            </mesh>
            <mesh position={[0, 1.65, 0]}>
              <sphereGeometry args={[0.36, 10, 10]} />
              <meshBasicMaterial color={idx === 0 ? primary : gold} toneMapped={false} />
            </mesh>
          </group>
        ))}
      </group>
    );
  }

  if (s === 'traditional-tamquan' || s === 'zen-torii' || s === 'hoian-lanterns') {
    const pillarCol = s === 'hoian-lanterns' ? '#d99b26' : '#8f1119';
    return (
      <group position={[0, 0, zPos]}>
        {[-2.15, 2.15].map((x) => (
          <group key={x} position={[x, 0, 0]}>
            <mesh position={[0, 0.22, 0]}>
              <boxGeometry args={[0.52, 0.44, 0.52]} />
              <meshStandardMaterial color="#57534e" roughness={0.85} />
            </mesh>
            <mesh position={[0, 2.45, 0]}>
              <cylinderGeometry args={[0.16, 0.19, 4.4, 14]} />
              <meshStandardMaterial color={pillarCol} roughness={0.45} />
            </mesh>
          </group>
        ))}
        {/* Upper crossbeams */}
        <mesh position={[0, 4.45, 0]}>
          <boxGeometry args={[5.6, 0.26, 0.36]} />
          <meshStandardMaterial color={pillarCol} roughness={0.45} />
        </mesh>
        <mesh position={[0, 3.95, 0]}>
          <boxGeometry args={[4.7, 0.16, 0.24]} />
          <meshStandardMaterial color={gold} roughness={0.35} metalness={0.4} />
        </mesh>
        {s !== 'zen-torii' && (
          <mesh position={[0, 4.92, 0]} rotation={[0, Math.PI / 4, 0]}>
            <coneGeometry args={[3.9, 0.78, 4]} />
            <meshStandardMaterial color="#450a0a" roughness={0.7} />
          </mesh>
        )}
        {/* Hanging Silk Lanterns */}
        {[-1.55, -0.85, 0.85, 1.55].map((lx, i) => (
          <group key={lx} position={[lx, 3.55, 0]}>
            <mesh>
              <sphereGeometry args={[0.18, 12, 10]} />
              <meshBasicMaterial color={i % 2 === 0 ? '#ef4444' : '#fbbf24'} toneMapped={false} />
            </mesh>
          </group>
        ))}
      </group>
    );
  }

  if (s === 'cinema-marquee') {
    return (
      <group position={[0, 0, zPos]}>
        {[-2.25, 2.25].map((x) => (
          <mesh key={x} position={[x, 2.25, 0]}>
            <boxGeometry args={[0.48, 4.5, 0.42]} />
            <meshStandardMaterial color="#18181b" roughness={0.4} />
          </mesh>
        ))}
        <mesh position={[0, 4.45, 0]}>
          <boxGeometry args={[5.1, 0.62, 0.48]} />
          <meshStandardMaterial color="#18181b" roughness={0.35} />
        </mesh>
        <mesh position={[0, 4.45, 0.25]}>
          <planeGeometry args={[4.7, 0.44]} />
          <meshBasicMaterial color={primary} toneMapped={false} />
        </mesh>
        {[-2.1, -1.5, -0.9, -0.3, 0.3, 0.9, 1.5, 2.1].map((bx) => (
          <mesh key={bx} position={[bx, 4.14, 0.25]}>
            <sphereGeometry args={[0.055, 8, 8]} />
            <meshBasicMaterial color="#fde68a" toneMapped={false} />
          </mesh>
        ))}
      </group>
    );
  }

  // Default / European Colonnade / Royal Gazebo / Tropical Bamboo / Crystal Glasshouse
  const colColor = s === 'tropical-bamboo' ? '#a16207' : '#f5f0e6';
  return (
    <group position={[0, 0, zPos]}>
      {[-2.15, 2.15].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh position={[0, 2.1, 0]}>
            <cylinderGeometry args={[0.17, 0.21, 4.2, 16]} />
            <meshStandardMaterial color={colColor} roughness={0.55} />
          </mesh>
          {/* Draped sheer curtain */}
          <mesh position={[x > 0 ? -0.18 : 0.18, 2.1, 0.08]} rotation={[0, 0, x > 0 ? 0.08 : -0.08]}>
            <planeGeometry args={[0.58, 3.9]} />
            <meshBasicMaterial color="#fffaf5" transparent opacity={0.78} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
      {/* Overhead floral arch ring */}
      <mesh position={[0, 3.85, 0]}>
        <torusGeometry args={[2.18, 0.18, 12, 36, Math.PI]} />
        <meshStandardMaterial color={colColor} roughness={0.5} />
      </mesh>
      {/* Lush 3D floral clusters along the arch */}
      {[-2.05, -1.45, -0.75, 0, 0.75, 1.45, 2.05].map((fx, idx) => {
        const fy = 3.88 + Math.cos((fx / 2.2) * (Math.PI / 2)) * 1.95 * 0.42;
        return (
          <mesh key={idx} position={[fx, fy + 0.62, 0.14]}>
            <sphereGeometry args={[0.26 + (idx % 2) * 0.06, 10, 10]} />
            <meshBasicMaterial color={idx % 2 === 0 ? primary : '#fff5eb'} toneMapped={false} />
          </mesh>
        );
      })}
    </group>
  );
}

/**
 * Real 3D Ceremony Altar Stage at the finale (`stageZ`) for the 90 procedural 3D templates.
 */
export function ProceduralAltarStage3D({
  theme,
  position,
  plaqueTex,
}: {
  theme: Walkthrough3DTheme;
  position: [number, number, number];
  plaqueTex: THREE.Texture;
}) {
  const isLightPlaque = theme.boardSkin === 'ivory-floral' || theme.boardSkin === 'porcelain-blue' || theme.boardSkin === 'sakura-silk';
  const boardBg = isLightPlaque ? '#fffaf2' : '#1b1626';

  return (
    <group position={position}>
      {/* 2-step Raised Ceremony Platform */}
      <mesh position={[0, 0.12, 0.9]}>
        <boxGeometry args={[6.4, 0.24, 4.2]} />
        <meshStandardMaterial color={isLightPlaque ? '#efe8dc' : '#3b2820'} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.28, 0.4]}>
        <boxGeometry args={[5.2, 0.18, 3.1]} />
        <meshStandardMaterial color={theme.accentGold} roughness={0.45} metalness={0.3} />
      </mesh>

      {/* Grand Backdrop Arch */}
      <mesh position={[0, 2.85, -0.35]}>
        <torusGeometry args={[2.45, 0.14, 12, 48, Math.PI]} />
        <meshBasicMaterial color={theme.accentGold} toneMapped={false} />
      </mesh>
      {[-2.45, 2.45].map((x) => (
        <mesh key={x} position={[x, 1.6, -0.35]}>
          <cylinderGeometry args={[0.14, 0.17, 2.8, 14]} />
          <meshStandardMaterial color="#f5efe6" roughness={0.55} />
        </mesh>
      ))}

      {/* Framed Couple Name Plaque */}
      <mesh position={[0, 2.55, -0.16]}>
        <boxGeometry args={[2.95, 1.72, 0.08]} />
        <meshStandardMaterial color={theme.accentGold} roughness={0.35} metalness={0.45} />
      </mesh>
      <mesh position={[0, 2.55, -0.1]}>
        <planeGeometry args={[2.78, 1.56]} />
        <meshBasicMaterial color={boardBg} toneMapped={false} />
      </mesh>
      <mesh position={[0, 2.55, -0.08]}>
        <planeGeometry args={[2.65, 1.45]} />
        <meshBasicMaterial key={plaqueTex.uuid} map={plaqueTex} transparent toneMapped={false} />
      </mesh>

      {/* Floral Urns flanking the Altar */}
      {[-1.95, 1.95].map((ux) => (
        <group key={ux} position={[ux, 0.38, 0.35]}>
          <mesh position={[0, 0.45, 0]}>
            <cylinderGeometry args={[0.18, 0.14, 0.9, 12]} />
            <meshStandardMaterial color="#f5efe6" roughness={0.5} />
          </mesh>
          <mesh position={[0, 1.08, 0]}>
            <sphereGeometry args={[0.38, 12, 12]} />
            <meshBasicMaterial color={theme.accentColor} toneMapped={false} />
          </mesh>
          <mesh position={[0.12, 1.22, 0.12]}>
            <sphereGeometry args={[0.24, 10, 10]} />
            <meshBasicMaterial color="#fff7ed" toneMapped={false} />
          </mesh>
        </group>
      ))}
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
