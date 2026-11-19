'use client';

/**
 * Real-world wedding furniture and decor: banquet tables dressed with floor-length linen
 * and full place settings, Chiavari chairs with sashes, rose arrangements packed flower by
 * flower, pedestal urns on marble columns, a draped stage, a coupe champagne tower, easels
 * and an aisle runner strewn with petals.
 */

import React, { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {
  chairSash,
  chargerPlate,
  chiavariFrame,
  coupeFill,
  coupeGlass,
  cutlery,
  dinnerPlate,
  domePoints,
  drapedCloth,
  flame,
  flutedColumn,
  foldedNapkin,
  lanternBody,
  leafBlade,
  pictureFrame,
  pillarCandle,
  pleatedCurtain,
  roseHead,
  roundedSlab,
  seatCushion,
  swagValance,
  tassel,
  urn,
  wineFill,
  wineGlass,
} from './realGeometry';
import { IS_HANDHELD } from './deviceTier';
import { carpet, fabric, flameGlow, glass, gold, leaves, liquid, marble, organza, painted, petals, porcelain, silver, wax, wood } from './realMaterials';

type Vec3 = [number, number, number];

function rng(seed: number) {
  let s = (seed * 2654435761) >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Soften a theme colour into something a real flower or fabric could be */
export function naturalTone(hex: string, towardsWhite = 0.2, desaturate = 0.2): string {
  const c = new THREE.Color(hex);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  c.setHSL(hsl.h, hsl.s * (1 - desaturate), hsl.l);
  c.lerp(new THREE.Color('#ffffff'), towardsWhite);
  return `#${c.getHexString()}`;
}

/* ───────────────────────── Instancing helper ───────────────────────── */

interface Xform {
  position: Vec3;
  quaternion?: THREE.Quaternion;
  rotation?: Vec3;
  scale?: number | Vec3;
  color?: string;
}

function InstancedSet({ geometry, material, items, castShadow = true }: { geometry: THREE.BufferGeometry; material: THREE.Material; items: Xform[]; castShadow?: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3();
    const p = new THREE.Vector3();
    const col = new THREE.Color();
    items.forEach((it, i) => {
      p.set(...it.position);
      if (it.quaternion) q.copy(it.quaternion);
      else q.setFromEuler(new THREE.Euler(...(it.rotation ?? [0, 0, 0])));
      if (typeof it.scale === 'number') s.setScalar(it.scale);
      else if (it.scale) s.set(...it.scale);
      else s.setScalar(1);
      m.compose(p, q, s);
      mesh.setMatrixAt(i, m);
      if (it.color) mesh.setColorAt(i, col.set(it.color));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [items]);
  return <instancedMesh ref={ref} args={[geometry, material, items.length]} castShadow={castShadow} receiveShadow frustumCulled={false} />;
}

/* ───────────────────────── Flowers ───────────────────────── */

/**
 * A dome of roses (and a skirt of leaves) like a florist's arrangement. `palette` picks
 * the bloom colours; each rose varies a little in tone, size and how it faces.
 */
export function RoseDome({
  radius,
  palette,
  seed = 1,
  density = 1,
  minY = -0.1,
  leafColor = '#3f5b2c',
}: {
  radius: number;
  palette: string[];
  seed?: number;
  density?: number;
  minY?: number;
  leafColor?: string;
}) {
  const { roses, greens } = useMemo(() => {
    const r = rng(seed);
    // Open garden roses ~9–10 cm across: big enough to read as flowers from across the hall
    // (tiny 7 cm heads packed by the hundred read as a speckled, spiky ball)
    const bloom = radius < 0.15 ? 1.05 : 1.4;
    const roseSize = 0.065 * bloom;
    // Pack roughly edge to edge on the dome
    const count = Math.max(6, Math.round(((4 * Math.PI * radius * radius) / (roseSize * roseSize * 0.85)) * ((1 - minY) / 2) * density * (IS_HANDHELD ? 0.6 : 1)));
    const up = new THREE.Vector3(0, 1, 0);
    const rosesOut: Xform[] = domePoints(count, radius, minY).map(({ p, n }) => {
      const tilt = new THREE.Quaternion().setFromUnitVectors(up, n);
      const spin = new THREE.Quaternion().setFromAxisAngle(up, r() * Math.PI * 2);
      const base = new THREE.Color(palette[Math.floor(r() * palette.length)]);
      const hsl = { h: 0, s: 0, l: 0 };
      base.getHSL(hsl);
      base.setHSL(hsl.h + (r() - 0.5) * 0.02, Math.min(1, hsl.s * (0.85 + r() * 0.3)), Math.min(0.97, hsl.l + (r() - 0.5) * 0.08));
      return {
        position: [p.x, p.y, p.z],
        quaternion: tilt.multiply(spin),
        scale: (0.85 + r() * 0.35) * bloom,
        color: `#${base.getHexString()}`,
      };
    });
    const greensOut: Xform[] = [];
    const leafCount = Math.round(8 + radius * 40);
    for (let i = 0; i < leafCount; i++) {
      const a = (i / leafCount) * Math.PI * 2 + r() * 0.3;
      const y = minY * radius - 0.01 + r() * 0.04;
      const rr = radius * Math.sqrt(1 - Math.min(0.95, minY * minY)) * (0.92 + r() * 0.1);
      greensOut.push({
        position: [Math.cos(a) * rr, y, Math.sin(a) * rr],
        rotation: [0, -a + Math.PI / 2, 0],
        scale: 0.7 + r() * 0.45,
      });
    }
    // Tuck each leaf under the rim, pointing out and down like a florist collar
    greensOut.forEach((g) => {
      const e = new THREE.Euler(0, (g.rotation as Vec3)[1], 0, 'YXZ');
      const q = new THREE.Quaternion().setFromEuler(e).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 1.75 + r() * 0.35));
      g.quaternion = q;
      g.rotation = undefined;
    });
    return { roses: rosesOut, greens: greensOut };
  }, [radius, palette, seed, density, minY]);

  // Gaps between blooms show deeper blooms and a little greenery, not a black hole: the core
  // takes the arrangement's average colour, shaded, so from a distance the dome reads as flowers
  const coreColor = useMemo(() => {
    const avg = new THREE.Color(0, 0, 0);
    palette.forEach((c) => avg.add(new THREE.Color(c)));
    avg.multiplyScalar(1 / Math.max(1, palette.length));
    return `#${avg.lerp(new THREE.Color(leafColor), 0.3).multiplyScalar(0.62).getHexString()}`;
  }, [palette, leafColor]);

  return (
    <group>
      <InstancedSet geometry={roseHead()} material={petals()} items={roses} />
      <InstancedSet geometry={leafBlade()} material={leaves(leafColor)} items={greens} />
      <mesh scale={[1, 1 - Math.max(0, minY) * 0.5, 1]}>
        <sphereGeometry args={[radius * 0.93, 24, 16, 0, Math.PI * 2, 0, Math.PI * (0.5 + Math.max(0, -minY) * 0.5)]} />
        <meshStandardMaterial color={coreColor} roughness={0.85} />
      </mesh>
    </group>
  );
}

/* ───────────────────────── Candles ───────────────────────── */

function Candle({ position, height }: { position: Vec3; height: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const phase = useMemo(() => position[0] * 13.1 + position[2] * 7.7, [position]);
  useFrame((s) => {
    if (!ref.current) return;
    const t = s.clock.elapsedTime * 9 + phase;
    ref.current.scale.set(1, 1 + Math.sin(t) * 0.08 + Math.sin(t * 2.3) * 0.05, 1);
    ref.current.rotation.z = Math.sin(t * 0.7) * 0.06;
  });
  return (
    <group position={position}>
      <mesh geometry={pillarCandle(height)} material={wax()} />
      <mesh ref={ref} geometry={flame()} material={flameGlow('#ffb347', 7)} position={[0, height - 0.002, 0]} />
    </group>
  );
}

/* ───────────────────────── Banquet table ───────────────────────── */

export function BanquetTableDressing({
  radius,
  seatCount,
  linen,
  napkin,
  flowers,
  seed,
}: {
  radius: number;
  seatCount: number;
  linen: string;
  napkin: string;
  flowers: string[];
  seed: number;
}) {
  const height = 0.76;
  const settings = useMemo(() => {
    const plates: Xform[] = [];
    const chargers: Xform[] = [];
    const napkins: Xform[] = [];
    const glasses: Xform[] = [];
    const cutleryItems: Xform[] = [];
    const r = rng(seed);
    for (let i = 0; i < seatCount; i++) {
      const a = (i / seatCount) * Math.PI * 2;
      const d = radius - 0.2;
      const x = Math.sin(a) * d;
      const z = Math.cos(a) * d;
      const y = height + 0.006;
      chargers.push({ position: [x, y, z], rotation: [0, a, 0] });
      plates.push({ position: [x, y + 0.012, z], rotation: [0, a, 0] });
      napkins.push({ position: [x, y + 0.03, z], rotation: [0, a + 0.12, 0] });
      cutleryItems.push({ position: [x, y, z], rotation: [0, a, 0] });
      // Wine glass to the upper right of each place
      const ga = a - 0.32;
      const gd = d - 0.17;
      glasses.push({ position: [Math.sin(ga) * gd, y - 0.002, Math.cos(ga) * gd], rotation: [0, r() * 6, 0] });
    }
    return { plates, chargers, napkins, glasses, cutleryItems };
  }, [radius, seatCount, seed]);

  const linenMat = fabric(linen, 'linen');

  return (
    <group>
      {/* Hidden table frame so the cloth reads as stretched over a real top */}
      <mesh geometry={drapedCloth(radius, height)} material={linenMat} />
      <InstancedSet geometry={chargerPlate()} material={gold('champagne')} items={settings.chargers} />
      <InstancedSet geometry={dinnerPlate()} material={porcelain()} items={settings.plates} />
      <InstancedSet geometry={foldedNapkin()} material={fabric(napkin, 'satin')} items={settings.napkins} />
      <InstancedSet geometry={cutlery()} material={silver()} items={settings.cutleryItems} />
      <InstancedSet geometry={wineGlass()} material={glass()} items={settings.glasses} castShadow={false} />
      <InstancedSet geometry={wineFill()} material={liquid('#5c0f1d')} items={settings.glasses} castShadow={false} />

      {/* Centrepiece: gilded compote of roses ringed by pillar candles */}
      <group position={[0, height, 0]}>
        <mesh geometry={urn()} material={gold('champagne')} scale={[0.55, 0.55, 0.55]} />
        <group position={[0, 0.22, 0]}>
          <RoseDome radius={0.17} palette={flowers} seed={seed} minY={-0.25} />
        </group>
        {[0, 1, 2, 3, 4].map((i) => {
          const a = (i / 5) * Math.PI * 2 + 0.3;
          const h = [0.12, 0.18, 0.1, 0.15, 0.2][i];
          return <Candle key={i} position={[Math.cos(a) * 0.3, 0.002, Math.sin(a) * 0.3]} height={h} />;
        })}
      </group>
    </group>
  );
}

/* ───────────────────────── Chair ───────────────────────── */

export function ChiavariChair({ occupied, cushion, sash, frame = 'gold' }: { occupied: boolean; cushion: string; sash: string; frame?: 'gold' | 'white' | 'wood' }) {
  const frameMat = frame === 'gold' ? gold('champagne') : frame === 'white' ? painted('#f4f1ec', 0.35) : wood('#5a3a22', 0.5);
  return (
    <group>
      <mesh geometry={chiavariFrame()} material={frameMat} />
      <mesh geometry={seatCushion()} material={fabric(occupied ? '#9ca3af' : cushion, 'satin')} />
      <mesh geometry={chairSash()} material={organza(occupied ? '#94a3b8' : sash)} />
    </group>
  );
}

/* ───────────────────────── Floral pillar ───────────────────────── */

export function FloralPedestal({ flowers, seed }: { flowers: string[]; seed: number }) {
  return (
    <group>
      <mesh geometry={flutedColumn(1.0, 0.13)} material={marble('#f3efe7')} />
      <group position={[0, 1.0, 0]}>
        <mesh geometry={urn()} material={gold('yellow')} scale={[0.8, 0.8, 0.8]} />
        <group position={[0, 0.36, 0]}>
          <RoseDome radius={0.3} palette={flowers} seed={seed} minY={-0.35} />
        </group>
      </group>
    </group>
  );
}

/* ───────────────────────── Stage ───────────────────────── */

export function StageDeck({ curtain, carpetColor }: { curtain: string; carpetColor: string }) {
  return (
    <group>
      {/* Deck with a carpeted top and a gold edge */}
      <mesh geometry={roundedSlab(6, 0.4, 4, 0.04)} position={[0, 0.2, 0]} material={painted('#f6f1e8', 0.5)} />
      <mesh geometry={roundedSlab(5.8, 0.02, 3.8, 0.008)} position={[0, 0.41, 0]} material={carpet(carpetColor)} />
      <mesh position={[0, 0.39, 2.0]}>
        <boxGeometry args={[6.02, 0.03, 0.03]} />
        <primitive object={gold('yellow')} attach="material" />
      </mesh>
      {/* Two carpeted steps */}
      <mesh geometry={roundedSlab(2.8, 0.14, 0.4, 0.02)} position={[0, 0.07, 2.18]} material={painted('#f6f1e8', 0.5)} />
      <mesh geometry={roundedSlab(2.8, 0.14, 0.32, 0.02)} position={[0, 0.21, 2.06]} material={painted('#f6f1e8', 0.5)} />
      <mesh geometry={roundedSlab(2.7, 0.012, 0.36, 0.005)} position={[0, 0.146, 2.18]} material={carpet(carpetColor)} />

      {/* Pleated backdrop curtain, swag valance and gilded rod */}
      <mesh geometry={pleatedCurtain(5.6, 3.6, 30)} material={fabric(curtain, 'velvet')} position={[0, 2.2, -1.86]} />
      <mesh geometry={swagValance(5.8, 4)} material={fabric('#f8f3ea', 'satin')} position={[0, 3.72, -1.66]} />
      <mesh position={[0, 4.02, -1.7]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.035, 0.035, 6.1, 16]} />
        <primitive object={gold('yellow')} attach="material" />
      </mesh>
      {[-3.05, 3.05].map((x) => (
        <mesh key={x} position={[x, 4.02, -1.7]}>
          <sphereGeometry args={[0.07, 16, 12]} />
          <primitive object={gold('yellow')} attach="material" />
        </mesh>
      ))}
    </group>
  );
}

/** Pyramid of champagne coupes, every glass filled */
export function ChampagneTower() {
  const items = useMemo(() => {
    const out: Xform[] = [];
    const tiers = [4, 3, 2, 1];
    const spacing = 0.112;
    tiers.forEach((n, level) => {
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          out.push({ position: [(i - (n - 1) / 2) * spacing, level * 0.118, (j - (n - 1) / 2) * spacing] });
        }
      }
    });
    return out;
  }, []);
  return (
    <group>
      <mesh position={[0, -0.02, 0]}>
        <cylinderGeometry args={[0.32, 0.32, 0.03, 40]} />
        <primitive object={silver()} attach="material" />
      </mesh>
      <InstancedSet geometry={coupeGlass()} material={glass()} items={items} castShadow={false} />
      <InstancedSet geometry={coupeFill()} material={liquid('#e9c46a')} items={items} castShadow={false} />
    </group>
  );
}

/* ───────────────────────── Easel with photo ───────────────────────── */

export function EaselFrame({ children }: { children?: React.ReactNode }) {
  const legMat = wood('#4a2f1a', 0.3);
  return (
    <group>
      {/* Tripod: two front legs and a rear prop */}
      {[-0.26, 0.26].map((x) => (
        <mesh key={x} position={[x, 0.78, 0.04]} rotation={[0.08, 0, x > 0 ? 0.1 : -0.1]} material={legMat}>
          <boxGeometry args={[0.035, 1.6, 0.025]} />
        </mesh>
      ))}
      <mesh position={[0, 0.72, -0.28]} rotation={[-0.36, 0, 0]} material={legMat}>
        <boxGeometry args={[0.03, 1.5, 0.022]} />
      </mesh>
      {/* Ledge the frame rests on */}
      <mesh position={[0, 0.4, 0.07]} material={legMat}>
        <boxGeometry args={[0.7, 0.03, 0.08]} />
      </mesh>
      <group position={[0, 0.96, 0.08]} rotation={[-0.08, 0, 0]}>
        <mesh geometry={pictureFrame(0.92, 1.1, 0.09)} material={gold('yellow')} />
        {children}
      </group>
    </group>
  );
}

/* ───────────────────────── Aisle runner ───────────────────────── */

export function AisleRunner({ color, seed }: { color: string; seed: number }) {
  const scattered = useMemo(() => {
    const r = rng(seed);
    const out: Xform[] = [];
    for (let i = 0; i < 26; i++) {
      out.push({
        position: [(r() - 0.5) * 1.7, (r() - 0.5) * 1.95, 0.006],
        rotation: [0, 0, r() * Math.PI * 2],
        scale: 0.8 + r() * 0.6,
      });
    }
    return out;
  }, [seed]);
  const petalGeo = useMemo(() => {
    const g = new THREE.CircleGeometry(0.022, 10);
    g.scale(1, 1.35, 1);
    return g;
  }, []);
  return (
    <group>
      <mesh>
        <planeGeometry args={[1.84, 2.0]} />
        <primitive object={carpet(color)} attach="material" />
      </mesh>
      {[-0.95, 0.95].map((x) => (
        <mesh key={x} position={[x, 0, 0.004]}>
          <planeGeometry args={[0.07, 2.0]} />
          <primitive object={gold('champagne')} attach="material" />
        </mesh>
      ))}
      <InstancedSet geometry={petalGeo} material={fabric('#fbe3e8', 'satin')} items={scattered} castShadow={false} />
    </group>
  );
}

/* ───────────────────────── Guestbook lectern ───────────────────────── */

export function GuestbookLectern() {
  const body = wood('#5b3a1e', 0.6);
  return (
    <group>
      <mesh geometry={roundedSlab(0.6, 0.06, 0.45, 0.015)} position={[0, 0.03, 0]} material={body} />
      <mesh position={[0, 0.52, 0]} material={body}>
        <cylinderGeometry args={[0.06, 0.08, 0.95, 20]} />
      </mesh>
      <group position={[0, 1.02, 0]} rotation={[-0.3, 0, 0]}>
        <mesh geometry={roundedSlab(0.56, 0.04, 0.4, 0.01)} material={body} />
        {/* Open guestbook: two curved page blocks */}
        {[-1, 1].map((sx) => (
          <mesh key={sx} position={[sx * 0.12, 0.035, 0]} rotation={[0, 0, sx * -0.06]}>
            <boxGeometry args={[0.23, 0.025, 0.3]} />
            <primitive object={porcelain('#faf6ee')} attach="material" />
          </mesh>
        ))}
        <mesh position={[0, 0.03, 0]}>
          <boxGeometry args={[0.5, 0.012, 0.32]} />
          <primitive object={fabric('#6b1d2a', 'velvet')} attach="material" />
        </mesh>
        <mesh position={[0.1, 0.055, 0.04]} rotation={[0, 0.6, Math.PI / 2]}>
          <cylinderGeometry args={[0.005, 0.005, 0.14, 8]} />
          <primitive object={gold('yellow')} attach="material" />
        </mesh>
      </group>
    </group>
  );
}

export { hashString };

/* ───────────────────────── Floral arch ───────────────────────── */

/** Roses and greenery packed along a curve, thickest at the shoulders like a florist garland */
export function RoseGarland({ curve, flowers, seed, thickness = 0.22, density = 1 }: { curve: THREE.Curve<THREE.Vector3>; flowers: string[]; seed: number; thickness?: number; density?: number }) {
  const { roses, greens } = useMemo(() => {
    const r = rng(seed);
    const len = curve.getLength();
    const count = Math.round(len * 90 * density);
    const up = new THREE.Vector3(0, 1, 0);
    const rosesOut: Xform[] = [];
    const greensOut: Xform[] = [];
    for (let i = 0; i < count; i++) {
      const t = r();
      const p = curve.getPointAt(t);
      const tan = curve.getTangentAt(t);
      // Random direction around the tangent, biased to the front (+z) where guests look
      const side = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 0, 1)).normalize();
      const ang = (r() - 0.5) * Math.PI * 1.5;
      const n = new THREE.Vector3(0, 0, 1).multiplyScalar(Math.cos(ang)).addScaledVector(side, Math.sin(ang)).normalize();
      const swell = 0.6 + Math.sin(t * Math.PI) * 0.15 + (t < 0.25 || t > 0.75 ? 0.3 : 0);
      const pos = p.clone().addScaledVector(n, thickness * swell * (0.7 + r() * 0.3));
      const q = new THREE.Quaternion().setFromUnitVectors(up, n).multiply(new THREE.Quaternion().setFromAxisAngle(up, r() * 6.28));
      const col = new THREE.Color(flowers[Math.floor(r() * flowers.length)]);
      const hsl = { h: 0, s: 0, l: 0 };
      col.getHSL(hsl);
      col.setHSL(hsl.h, hsl.s, Math.min(0.97, hsl.l + (r() - 0.5) * 0.08));
      if (r() < 0.72) rosesOut.push({ position: [pos.x, pos.y, pos.z], quaternion: q, scale: 0.9 + r() * 0.6, color: `#${col.getHexString()}` });
      else greensOut.push({ position: [pos.x, pos.y, pos.z], quaternion: q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 1.3)), scale: 1.2 + r() * 1.2 });
    }
    return { roses: rosesOut, greens: greensOut };
  }, [curve, flowers, seed, thickness, density]);
  const tube = useMemo(() => new THREE.TubeGeometry(curve, 64, thickness * 0.55, 10, false), [curve, thickness]);
  return (
    <group>
      <mesh geometry={tube}>
        <meshStandardMaterial color="#2f4224" roughness={0.9} />
      </mesh>
      <InstancedSet geometry={roseHead()} material={petals()} items={roses} />
      <InstancedSet geometry={leafBlade()} material={leaves('#3d5a2a')} items={greens} />
    </group>
  );
}

/** Round-topped wedding arch: slim gilded frame, flower garland, sheer draped panels */
export function FloralArch({ width, height, flowers, seed }: { width: number; height: number; flowers: string[]; seed: number }) {
  const { frame, garlandL, garlandR } = useMemo(() => {
    const r = width / 2;
    const legH = height - r;
    const pts: THREE.Vector3[] = [];
    pts.push(new THREE.Vector3(-r, 0, 0), new THREE.Vector3(-r, legH, 0));
    for (let i = 1; i < 24; i++) {
      const a = Math.PI - (i / 24) * Math.PI;
      pts.push(new THREE.Vector3(Math.cos(a) * r, legH + Math.sin(a) * r, 0));
    }
    pts.push(new THREE.Vector3(r, legH, 0), new THREE.Vector3(r, 0, 0));
    const frameCurve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
    // Asymmetric garland: heavy over the left shoulder, a lighter spray at the right
    const gl = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(-r, legH * 0.35, 0.03),
        new THREE.Vector3(-r, legH * 0.85, 0.03),
        new THREE.Vector3(-r * 0.75, legH + r * 0.65, 0.03),
        new THREE.Vector3(-r * 0.2, legH + r * 0.98, 0.03),
      ],
      false,
      'centripetal',
    );
    const gr = new THREE.CatmullRomCurve3(
      [new THREE.Vector3(r * 0.55, legH + r * 0.82, 0.03), new THREE.Vector3(r * 0.95, legH + r * 0.3, 0.03), new THREE.Vector3(r, legH * 0.75, 0.03)],
      false,
      'centripetal',
    );
    return { frame: new THREE.TubeGeometry(frameCurve, 120, 0.035, 10, false), garlandL: gl, garlandR: gr };
  }, [width, height]);
  return (
    <group>
      <mesh geometry={frame} material={gold('champagne')} />
      <RoseGarland curve={garlandL} flowers={flowers} seed={seed} thickness={0.2} />
      <RoseGarland curve={garlandR} flowers={flowers} seed={seed + 3} thickness={0.15} density={0.9} />
      {/* Sheer chiffon panels gathered at each side */}
      {[-1, 1].map((sx) => (
        <mesh key={sx} geometry={pleatedCurtain(0.6, height - 0.3, 6)} material={organza('#fbf8f4')} position={[sx * (width / 2 - 0.05), (height - 0.3) / 2, -0.06]} />
      ))}
    </group>
  );
}

/* ───────────────────────── Crystal chandelier ───────────────────────── */

function crystalMaterial() {
  return glass('#f6fbff');
}

/**
 * Two-tier crystal chandelier: gilded stem and S-curved arms holding candle bulbs, strands
 * of cut crystal drops in swags between the arms, and a warm light that actually lights
 * the room beneath.
 */
export function CrystalChandelier({ scale = 1, castLight = !IS_HANDHELD }: { scale?: number; castLight?: boolean }) {
  const { arms, bulbs, drops, beads } = useMemo(() => {
    const armGeos: THREE.BufferGeometry[] = [];
    const bulbsOut: Xform[] = [];
    const dropsOut: Xform[] = [];
    const beadsOut: Xform[] = [];
    const tiers = [
      { n: 10, r: 1.05, y: 0 },
      { n: 6, r: 0.6, y: 0.55 },
    ];
    for (const tier of tiers) {
      for (let i = 0; i < tier.n; i++) {
        const a = (i / tier.n) * Math.PI * 2;
        const dir = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
        const c = new THREE.CubicBezierCurve3(
          new THREE.Vector3(0, tier.y - 0.2, 0),
          dir.clone().multiplyScalar(tier.r * 0.5).setY(tier.y - 0.45),
          dir.clone().multiplyScalar(tier.r * 0.95).setY(tier.y - 0.35),
          dir.clone().multiplyScalar(tier.r).setY(tier.y),
        );
        armGeos.push(new THREE.TubeGeometry(c, 20, 0.018, 6, false));
        const tip = dir.clone().multiplyScalar(tier.r);
        bulbsOut.push({ position: [tip.x, tier.y + 0.02, tip.z] });
        // Pendant drop under each candle cup
        dropsOut.push({ position: [tip.x, tier.y - 0.12, tip.z], scale: [1, 1.8, 1] });
        // Swag of beads to the next arm
        const b = (((i + 1) % tier.n) / tier.n) * Math.PI * 2;
        const next = new THREE.Vector3(Math.cos(b), 0, Math.sin(b)).multiplyScalar(tier.r);
        for (let k = 1; k < 9; k++) {
          const t = k / 9;
          const p = tip.clone().lerp(next, t);
          beadsOut.push({ position: [p.x * 0.97, tier.y - 0.05 - Math.sin(t * Math.PI) * 0.22, p.z * 0.97], scale: 0.55 });
        }
      }
    }
    // Cascade of drops hanging in the middle
    for (let ring = 0; ring < 3; ring++) {
      const n = 8 + ring * 6;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + ring;
        const rr = 0.18 + ring * 0.2;
        for (let k = 0; k < 5 - ring; k++) {
          beadsOut.push({ position: [Math.cos(a) * rr, -0.45 - k * 0.07 - ring * 0.05, Math.sin(a) * rr], scale: 0.6 });
        }
        dropsOut.push({ position: [Math.cos(a) * rr, -0.45 - (5 - ring) * 0.07 - ring * 0.05, Math.sin(a) * rr], scale: [0.9, 1.6, 0.9] });
      }
    }
    return { arms: armGeos.length ? mergeArms(armGeos) : null, bulbs: bulbsOut, drops: dropsOut, beads: beadsOut };
  }, []);
  const prism = useMemo(() => new THREE.OctahedronGeometry(0.045, 0), []);
  const bead = useMemo(() => new THREE.IcosahedronGeometry(0.022, 0), []);
  const bulb = useMemo(() => {
    const g = new THREE.SphereGeometry(0.035, 12, 10);
    g.scale(1, 1.5, 1);
    return g;
  }, []);
  const cup = useMemo(() => new THREE.CylinderGeometry(0.05, 0.03, 0.06, 14), []);
  return (
    <group scale={scale}>
      {/* Stem, crown and central bowl */}
      <mesh position={[0, 1.2, 0]} material={gold('yellow')}>
        <cylinderGeometry args={[0.03, 0.03, 1.4, 10]} />
      </mesh>
      <mesh position={[0, -0.25, 0]} material={gold('yellow')}>
        <sphereGeometry args={[0.16, 24, 16]} />
      </mesh>
      <mesh position={[0, 0.85, 0]} material={gold('yellow')}>
        <torusGeometry args={[0.25, 0.02, 8, 32]} />
      </mesh>
      {arms && <mesh geometry={arms} material={gold('yellow')} />}
      <InstancedSet geometry={cup} material={gold('yellow')} items={bulbs.map((b) => ({ position: [b.position[0], b.position[1] - 0.04, b.position[2]] }))} />
      <InstancedSet geometry={bulb} material={flameGlow('#ffd9a0', 5)} items={bulbs.map((b) => ({ position: [b.position[0], b.position[1] + 0.03, b.position[2]] }))} castShadow={false} />
      <InstancedSet geometry={prism} material={crystalMaterial()} items={drops} castShadow={false} />
      <InstancedSet geometry={bead} material={crystalMaterial()} items={beads} castShadow={false} />
      {castLight && <pointLight position={[0, -0.3, 0]} color="#ffd8a8" intensity={16} distance={22} decay={1.4} />}
    </group>
  );
}

/** Tube geometries share the same attributes: merge them into one draw call */
function mergeArms(geos: THREE.BufferGeometry[]): THREE.BufferGeometry {
  return mergeGeometries(geos, false) ?? geos[0];
}

/* ───────────────────────── Indoor ballroom shell ───────────────────────── */

interface WallSpec {
  key: string;
  position: Vec3;
  rotationY: number;
  /** Unit vector pointing out of the room */
  outward: THREE.Vector3;
}

/**
 * Walls of an indoor ballroom: wainscot panelling, gilded chair rail and crown moulding,
 * pilasters with draped windows between them and warm wall sconces. A wall hides itself
 * whenever the camera is outside it, so the room stays open to the view like a dollhouse.
 */
export function BallroomWalls({ wallColor, drape, half = 15.4, height = 7.6 }: { wallColor: string; drape: string; half?: number; height?: number }) {
  const walls: WallSpec[] = useMemo(
    () => [
      { key: 'back', position: [0, 0, -half], rotationY: 0, outward: new THREE.Vector3(0, 0, -1) },
      { key: 'front', position: [0, 0, half], rotationY: Math.PI, outward: new THREE.Vector3(0, 0, 1) },
      { key: 'left', position: [-half, 0, 0], rotationY: Math.PI / 2, outward: new THREE.Vector3(-1, 0, 0) },
      { key: 'right', position: [half, 0, 0], rotationY: -Math.PI / 2, outward: new THREE.Vector3(1, 0, 0) },
    ],
    [half],
  );
  const refs = useRef<Array<THREE.Group | null>>([]);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera }) => {
    walls.forEach((w, i) => {
      const g = refs.current[i];
      if (!g) return;
      tmp.set(camera.position.x - w.position[0], 0, camera.position.z - w.position[2]);
      // Hide when the camera is beyond the wall, or high above and looking down over it
      g.visible = tmp.dot(w.outward) < -0.3;
    });
  });

  const len = half * 2;
  const bays = 6;
  const bay = len / bays;
  const plaster = painted(wallColor, 0.8);
  const panel = painted(`#${new THREE.Color(wallColor).multiplyScalar(0.94).getHexString()}`, 0.6);

  return (
    <group>
      {walls.map((w, i) => (
        <group key={w.key} ref={(el) => {
            refs.current[i] = el;
          }} position={w.position} rotation={[0, w.rotationY, 0]} userData={{ noCastShadow: true }}>
          {/* Wall face (faces into the room: +z in wall space) */}
          <mesh position={[0, height / 2, -0.1]} material={plaster} userData={{ noCastShadow: true }}>
            <boxGeometry args={[len + 0.4, height, 0.2]} />
          </mesh>
          {/* Wainscot */}
          <mesh position={[0, 0.55, 0.02]} material={panel} userData={{ noCastShadow: true }}>
            <boxGeometry args={[len, 1.1, 0.06]} />
          </mesh>
          <mesh position={[0, 1.12, 0.06]} material={gold('champagne')} userData={{ noCastShadow: true }}>
            <boxGeometry args={[len, 0.05, 0.06]} />
          </mesh>
          <mesh position={[0, 0.06, 0.06]} material={painted('#3b2f2a', 0.5)} userData={{ noCastShadow: true }}>
            <boxGeometry args={[len, 0.12, 0.05]} />
          </mesh>
          {/* Crown moulding */}
          <mesh position={[0, height - 0.18, 0.08]} material={plaster} userData={{ noCastShadow: true }}>
            <boxGeometry args={[len, 0.36, 0.22]} />
          </mesh>
          <mesh position={[0, height - 0.38, 0.17]} material={gold('champagne')} userData={{ noCastShadow: true }}>
            <boxGeometry args={[len, 0.04, 0.04]} />
          </mesh>
          {Array.from({ length: bays }, (_, b) => {
            const x = -half + bay * (b + 0.5);
            return (
              <group key={b} position={[x, 0, 0]}>
                {/* Raised panel moulding in the wainscot */}
                <mesh position={[0, 0.58, 0.06]} material={gold('champagne')} userData={{ noCastShadow: true }}>
                  <boxGeometry args={[bay * 0.7, 0.62, 0.012]} />
                </mesh>
                <mesh position={[0, 0.58, 0.064]} material={panel} userData={{ noCastShadow: true }}>
                  <boxGeometry args={[bay * 0.7 - 0.05, 0.57, 0.012]} />
                </mesh>
                {/* Tall window glowing with daylight, framed by heavy drapes */}
                <mesh position={[0, 3.9, 0.005]} userData={{ noCastShadow: true }}>
                  <planeGeometry args={[1.6, 4.2]} />
                  <meshBasicMaterial color={new THREE.Color('#fff3df').multiplyScalar(1.02)} toneMapped={false} />
                </mesh>
                {[-1, 1].map((sx) => (
                  <mesh key={sx} geometry={pleatedCurtain(0.9, 5.6, 8)} material={fabric(drape, 'velvet')} position={[sx * 1.05, 4.2, 0.18]} userData={{ noCastShadow: true }} />
                ))}
                {/* Pilaster between bays */}
                <mesh position={[bay / 2, height / 2, 0.08]} material={plaster} userData={{ noCastShadow: true }}>
                  <boxGeometry args={[0.55, height, 0.18]} />
                </mesh>
                {/* Wall sconce on the pilaster */}
                <group position={[bay / 2, 2.6, 0.24]}>
                  <mesh material={gold('yellow')}>
                    <cylinderGeometry args={[0.05, 0.08, 0.2, 12]} />
                  </mesh>
                  {[-0.12, 0.12].map((dx) => (
                    <mesh key={dx} position={[dx, 0.18, 0.06]} material={flameGlow('#ffd9a0', 4)}>
                      <sphereGeometry args={[0.04, 10, 8]} />
                    </mesh>
                  ))}
                </group>
              </group>
            );
          })}
        </group>
      ))}
      {/* Coffered ceiling, only seen from below (close-up views) */}
      <mesh position={[0, height, 0]} rotation={[Math.PI / 2, 0, 0]} userData={{ noCastShadow: true }}>
        <planeGeometry args={[half * 2, half * 2]} />
        {/* Ceiling catches the bounce light of the room */}
        <meshStandardMaterial color="#f3ece0" roughness={0.9} emissive="#6b5a44" emissiveIntensity={0.6} />
      </mesh>
    </group>
  );
}

/* ───────────────────────── Lanterns & string lights ───────────────────────── */

function litSilk(color: string, glow: number): THREE.MeshPhysicalMaterial {
  const m = fabric(color, 'satin').clone();
  m.emissive = new THREE.Color(color);
  m.emissiveIntensity = glow;
  m.toneMapped = true;
  return m;
}

const litCache = new Map<string, THREE.MeshPhysicalMaterial>();
function litSilkCached(color: string, glow: number) {
  const key = `${color}_${glow}`;
  let m = litCache.get(key);
  if (!m) {
    m = litSilk(color, glow);
    litCache.set(key, m);
  }
  return m;
}

/** Silk lantern on bamboo ribs with gilded caps and a tassel, glowing from inside */
export function SilkLantern({ color, glow = 1.2, kind = 'silk' }: { color: string; glow?: number; kind?: 'silk' | 'paper' }) {
  const top = kind === 'silk' ? 0.25 : 0.28;
  return (
    <group>
      <mesh geometry={lanternBody(kind)} material={litSilkCached(color, glow)} />
      {/* Bulb inside, seen through the fabric as a hot core */}
      <mesh material={flameGlow('#ffcf8a', 2.2)}>
        <sphereGeometry args={[0.05, 10, 8]} />
      </mesh>
      {kind === 'silk' && (
        <>
          {[top, -top].map((y) => (
            <mesh key={y} position={[0, y, 0]} material={gold('yellow')}>
              <cylinderGeometry args={[0.085, 0.085, 0.04, 20]} />
            </mesh>
          ))}
          <group position={[0, -top - 0.02, 0]}>
            <mesh geometry={tassel()} material={fabric('#b91c1c', 'satin')} />
          </group>
        </>
      )}
      <mesh position={[0, top + 0.45, 0]} material={painted('#2b2420', 0.6)}>
        <cylinderGeometry args={[0.004, 0.004, 0.9, 4]} />
      </mesh>
    </group>
  );
}

/** Festoon of small warm bulbs hanging in a catenary between two points */
export function StringLights({ from, to, sag, color = '#ffd28a', spacing = 0.35 }: { from: Vec3; to: Vec3; sag: number; color?: string; spacing?: number }) {
  const { wire, bulbs } = useMemo(() => {
    const a = new THREE.Vector3(...from);
    const b = new THREE.Vector3(...to);
    const pts: THREE.Vector3[] = [];
    const n = 40;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const p = a.clone().lerp(b, t);
      p.y -= Math.sin(t * Math.PI) * sag;
      pts.push(p);
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const len = curve.getLength();
    const count = Math.floor(len / spacing);
    const bulbsOut: Xform[] = [];
    for (let i = 1; i < count; i++) {
      const p = curve.getPointAt(i / count);
      bulbsOut.push({ position: [p.x, p.y - 0.06, p.z], scale: [1, 1.35, 1] });
    }
    return { wire: new THREE.TubeGeometry(curve, 80, 0.006, 4, false), bulbs: bulbsOut };
  }, [from, to, sag, spacing]);
  const bulbGeo = useMemo(() => new THREE.SphereGeometry(0.028, 10, 8), []);
  return (
    <group>
      <mesh geometry={wire}>
        <meshStandardMaterial color="#1f1a17" roughness={0.6} />
      </mesh>
      <InstancedSet geometry={bulbGeo} material={flameGlow(color, 4.5)} items={bulbs} castShadow={false} />
    </group>
  );
}

/** Timber post for string lights */
export function LightPost({ height = 5.6 }: { height?: number }) {
  return (
    <group>
      <mesh position={[0, height / 2, 0]} material={wood('#5a4330', 0.1)}>
        <cylinderGeometry args={[0.06, 0.075, height, 12]} />
      </mesh>
      <mesh position={[0, 0.15, 0]} material={painted('#3d3632', 0.7)}>
        <cylinderGeometry args={[0.2, 0.24, 0.3, 16]} />
      </mesh>
    </group>
  );
}

/* ───────────────────────── Gift table ───────────────────────── */

/**
 * Flat glass panels (card box): plain transparency with a glossy coat. Refraction through a
 * closed box produced invalid pixels that the bloom smeared into a glowing haze.
 */
let paneMat: THREE.MeshPhysicalMaterial | null = null;
function glassPane(): THREE.MeshPhysicalMaterial {
  return (paneMat ??= new THREE.MeshPhysicalMaterial({ color: '#f4f8fb', roughness: 0.05, transparent: true, opacity: 0.18, clearcoat: 1, depthWrite: false }));
}

/** Linen-draped side table holding wrapped gifts with satin ribbons and a card box */
export function GiftTable({ accent }: { accent: string }) {
  const boxes: Array<{ p: Vec3; s: Vec3; paper: string; ribbon: string; rot: number }> = [
    { p: [-0.22, 0, -0.05], s: [0.34, 0.26, 0.3], paper: '#f6f1e7', ribbon: accent, rot: 0.2 },
    { p: [0.2, 0, 0.08], s: [0.28, 0.2, 0.28], paper: naturalTone(accent, 0.5, 0.3), ribbon: '#e3c48a', rot: -0.35 },
    { p: [0.02, 0, -0.2], s: [0.22, 0.34, 0.22], paper: '#e9e2d4', ribbon: '#b08d57', rot: 0.6 },
    { p: [-0.05, 0.26, -0.04], s: [0.2, 0.14, 0.2], paper: naturalTone(accent, 0.25, 0.25), ribbon: '#f6f1e7', rot: -0.1 },
  ];
  return (
    <group>
      <mesh geometry={drapedCloth(0.55, 0.78)} material={fabric('#f7f3ec', 'linen')} />
      <group position={[0, 0.785, 0]}>
        {boxes.map((b, i) => (
          <group key={i} position={b.p} rotation={[0, b.rot, 0]}>
            <mesh position={[0, b.s[1] / 2, 0]} material={painted(b.paper, 0.5)}>
              <boxGeometry args={b.s} />
            </mesh>
            {/* Ribbon bands both ways */}
            <mesh position={[0, b.s[1] / 2, 0]} material={fabric(b.ribbon, 'satin')}>
              <boxGeometry args={[b.s[0] + 0.004, b.s[1] + 0.004, 0.03]} />
            </mesh>
            <mesh position={[0, b.s[1] / 2, 0]} material={fabric(b.ribbon, 'satin')}>
              <boxGeometry args={[0.03, b.s[1] + 0.004, b.s[2] + 0.004]} />
            </mesh>
            {/* Bow */}
            {[-1, 1].map((sx) => (
              <mesh key={sx} position={[sx * 0.03, b.s[1] + 0.02, 0]} rotation={[Math.PI / 2, 0, sx * 0.5]} scale={[1, 0.5, 1]} material={fabric(b.ribbon, 'satin')}>
                <torusGeometry args={[0.03, 0.009, 8, 16]} />
              </mesh>
            ))}
          </group>
        ))}
        {/* Card box: glass-sided lantern box with a slot */}
        <group position={[0.36, 0, -0.18]}>
          <mesh position={[0, 0.16, 0]} material={glassPane()}>
            <boxGeometry args={[0.22, 0.3, 0.22]} />
          </mesh>
          <mesh position={[0, 0.315, 0]} material={gold('champagne')}>
            <boxGeometry args={[0.24, 0.02, 0.24]} />
          </mesh>
          <mesh position={[0, 0.005, 0]} material={gold('champagne')}>
            <boxGeometry args={[0.24, 0.01, 0.24]} />
          </mesh>
          {[0, 1, 2].map((i) => (
            <mesh key={i} position={[0, 0.03 + i * 0.012, 0]} rotation={[0, i * 0.4, 0]} material={painted('#fbf7ef', 0.8)}>
              <boxGeometry args={[0.16, 0.008, 0.11]} />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  );
}
