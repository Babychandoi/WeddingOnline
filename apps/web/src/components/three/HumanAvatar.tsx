'use client';

/**
 * Guests, couple and NPCs as stylised people: adult proportions (~1.7 m, head ≈ 1/6.5 of the
 * height), jointed hips, knees, shoulders and elbows, a face, hairstyles and outfits.
 *
 * Movement: the local player is drawn exactly where the input loop puts it each frame; other
 * people replay their motion track (see @dco/shared motionTrack.ts). The walk cycle advances with the
 * distance actually covered, so feet do not skate and stop when the body stops.
 */

import React, { useMemo, useRef } from 'react';
import { useFrame, type RootState } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { MotionStore } from '@dco/shared';
import { RealPerson, type PersonMotion } from './RealPerson';
import { wineFill, wineGlass } from './realGeometry';
import { glass, liquid } from './realMaterials';

export interface AvatarRenderProps {
  id: string;
  displayName: string;
  side?: string;
  role?: string;
  outfitId: string;
  hairId: string;
  hairColor: string;
  targetX: number;
  targetZ: number;
  targetRotY: number;
  anim: string;
  hasBouquetCrown?: boolean;
  isSpeaking?: boolean;
  bubbleText?: string;
  showLabel?: boolean;
  isLocal?: boolean;
  isNpc?: boolean;
  liveLocalRef?: React.MutableRefObject<{
    x: number;
    z: number;
    rotY: number;
    isMoving: boolean;
  }>;
  /** Smoothed network motion; when absent the avatar eases towards target* props */
  motion?: MotionStore;
  motionKey?: string;
  /** On a chair (the server may still play a gesture such as a table toast) */
  isSeated?: boolean;
  /** Realistic person (PEOPLE id); '' draws the stylised figure */
  personId?: string;
  onClick?: () => void;
}

/* ───────────────────────────── Outfits & looks ───────────────────────────── */

type Style = 'ao_dai' | 'gown' | 'suit' | 'dress' | 'casual';

interface Outfit {
  top: string;
  accent: string;
  bottom: string;
  shoes: string;
  style: Style;
  feminine: boolean;
  tie?: string;
}

const OUTFITS: Record<string, Outfit> = {
  ao_dai_guest: { top: '#ec6f9c', accent: '#fbe3ec', bottom: '#fdf6f8', shoes: '#d9b48a', style: 'ao_dai', feminine: true },
  ao_dai_cuoi_do: { top: '#b91c1c', accent: '#e8b53a', bottom: '#fff6e0', shoes: '#c9a227', style: 'ao_dai', feminine: true },
  vay_cuoi_trang: { top: '#fbfaf6', accent: '#ecd3a0', bottom: '#fbfaf6', shoes: '#f3eee4', style: 'gown', feminine: true },
  vest_suit: { top: '#3b475a', accent: '#f6f7f9', bottom: '#2d3646', shoes: '#191919', style: 'suit', feminine: false, tie: '#7f1d1d' },
  vest_chu_re: { top: '#222b40', accent: '#f8f9fb', bottom: '#1d2436', shoes: '#0e0e0e', style: 'suit', feminine: false, tie: '#b91c1c' },
  evening_dress: { top: '#7e3ac4', accent: '#f0cf7d', bottom: '#7e3ac4', shoes: '#2a1a3a', style: 'dress', feminine: true },
  smart_casual: { top: '#5b9fd8', accent: '#f6f7f9', bottom: '#384760', shoes: '#ededed', style: 'casual', feminine: false },
};

const SKIN_TONES = ['#f2d0b4', '#e8bf9c', '#dcae86', '#c99470'];

const SIDE_LABELS: Record<string, string> = {
  GROOM_SIDE: 'Nhà Trai',
  BRIDE_SIDE: 'Nhà Gái',
  FRIEND: 'Bạn Bè',
  COLLEAGUE: 'Đồng Nghiệp',
};

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function shade(hex: string, amount: number): string {
  const c = new THREE.Color(hex);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  c.setHSL(hsl.h, hsl.s, Math.max(0, Math.min(1, hsl.l + amount)));
  return `#${c.getHexString()}`;
}

/* ───────────────────────────── Shared geometry & materials ───────────────────────────── */

const HIP_Y = 0.88;
const THIGH = 0.43;
const SHIN_TO_SOLE = 0.415;
const SHOULDER_Y = 0.45;
const HEAD_Y = 0.7;
/** Radians of walk cycle per metre walked (one full cycle ≈ 2.4 m at this game's brisk pace) */
const STRIDE_RAD_PER_M = (Math.PI * 2) / 2.4;

type Pts = Array<[number, number]>;

function lathe(points: Pts, segments = 22): THREE.LatheGeometry {
  // Profiles must run bottom → top so faces point outward: the ambient-occlusion pre-pass only
  // draws front faces, and an inward-facing skirt would let it see the legs through the gown
  const ordered = points[0][1] > points[points.length - 1][1] ? [...points].reverse() : points;
  return new THREE.LatheGeometry(ordered.map(([r, y]) => new THREE.Vector2(r, y)), segments);
}

function buildGeometries() {
  return {
    sphere: new THREE.SphereGeometry(1, 20, 14),
    sphereLow: new THREE.SphereGeometry(1, 10, 8),
    box: new THREE.BoxGeometry(1, 1, 1),
    cylinder: new THREE.CylinderGeometry(1, 1, 1, 22),
    // Torso profiles (radius, height above the hip joint); flattened front-to-back when drawn
    torsoM: lathe([[0.001, -0.02], [0.13, -0.015], [0.142, 0.06], [0.136, 0.18], [0.15, 0.3], [0.163, 0.38], [0.178, 0.43], [0.15, 0.49], [0.075, 0.53], [0.001, 0.54]]),
    torsoF: lathe([[0.001, -0.02], [0.138, -0.015], [0.15, 0.05], [0.126, 0.13], [0.11, 0.2], [0.132, 0.3], [0.14, 0.36], [0.148, 0.42], [0.128, 0.48], [0.065, 0.52], [0.001, 0.53]]),
    jacketHem: lathe([[0.146, 0.08], [0.15, 0.0], [0.158, -0.12]], 22),
    // Ball-gown: fitted at the waist, then a full bell that pools on the floor
    skirtGown: lathe([[0.115, 0.12], [0.15, 0.03], [0.22, -0.08], [0.3, -0.24], [0.37, -0.45], [0.43, -0.68], [0.5, -0.83], [0.53, -0.87], [0.001, -0.875]], 32),
    skirtDress: lathe([[0.113, 0.12], [0.14, 0.02], [0.18, -0.16], [0.24, -0.36], [0.3, -0.5]], 24),
    // Limbs: tapered cylinders (wider at the top) overlapping a ball joint, so knees and
    // elbows bend without gaps or the dark seams of capsule ends
    thighM: new THREE.CylinderGeometry(0.084, 0.07, 0.44, 12),
    thighF: new THREE.CylinderGeometry(0.076, 0.056, 0.44, 12),
    thighWide: new THREE.CylinderGeometry(0.092, 0.082, 0.44, 12),
    shinM: new THREE.CylinderGeometry(0.068, 0.06, 0.4, 12),
    shinF: new THREE.CylinderGeometry(0.054, 0.04, 0.4, 12),
    shinWide: new THREE.CylinderGeometry(0.082, 0.088, 0.4, 12),
    upperArmM: new THREE.CylinderGeometry(0.054, 0.046, 0.28, 10),
    upperArmF: new THREE.CylinderGeometry(0.043, 0.036, 0.28, 10),
    foreArmM: new THREE.CylinderGeometry(0.046, 0.036, 0.25, 10),
    foreArmF: new THREE.CylinderGeometry(0.036, 0.028, 0.25, 10),
    // One smooth egg-shaped head with a tapered jaw (no seams between separate jaw/skull parts)
    head: lathe([[0.001, -0.13], [0.035, -0.127], [0.064, -0.11], [0.085, -0.08], [0.1, -0.04], [0.108, 0.0], [0.111, 0.04], [0.106, 0.08], [0.088, 0.112], [0.055, 0.132], [0.001, 0.138]], 24),
    neck: new THREE.CylinderGeometry(0.045, 0.052, 0.13, 12),
    collar: new THREE.CylinderGeometry(0.053, 0.056, 0.055, 14, 1, true),
    // A shallow arc: corners up, a gentle smile
    mouth: new THREE.TorusGeometry(0.02, 0.0055, 6, 14, Math.PI * 0.8),
    hairCap: new THREE.SphereGeometry(1, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.5),
    hairLong: new THREE.CylinderGeometry(0.121, 0.132, 0.38, 18, 1, true, Math.PI / 2, Math.PI),
    hairBob: new THREE.CylinderGeometry(0.124, 0.138, 0.17, 18, 1, true, Math.PI / 2 - 0.6, Math.PI + 1.2),
    headband: new THREE.TorusGeometry(0.116, 0.024, 8, 26),
    tiara: new THREE.TorusGeometry(0.07, 0.008, 6, 16, Math.PI),
    crown: new THREE.TorusGeometry(0.105, 0.02, 8, 22),
    // Back arc only, so the edges stay behind the shoulders
    veil: new THREE.CylinderGeometry(0.06, 0.24, 0.85, 18, 1, true, Math.PI * 0.62, Math.PI * 0.76),
    blob: new THREE.CircleGeometry(0.34, 20),
    ring: new THREE.RingGeometry(0.42, 0.52, 28),
  };
}

let GEO: ReturnType<typeof buildGeometries> | null = null;
function geo() {
  return (GEO ??= buildGeometries());
}

const MATS = new Map<string, THREE.Material>();
/** Shared materials: every avatar wearing the same colour reuses one material */
function mat(color: string, roughness = 0.65, metalness = 0, double = false): THREE.MeshStandardMaterial {
  const key = `${color}|${roughness}|${metalness}|${double}`;
  let m = MATS.get(key) as THREE.MeshStandardMaterial | undefined;
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, roughness, metalness, side: double ? THREE.DoubleSide : THREE.FrontSide });
    MATS.set(key, m);
  }
  return m;
}

/** Hair wins depth ties against the scalp, so the hairline never flickers into skin */
function hairMat(color: string, double = false): THREE.Material {
  const key = `hair|${color}|${double}`;
  let m = MATS.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.55,
      side: double ? THREE.DoubleSide : THREE.FrontSide,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
    MATS.set(key, m);
  }
  return m;
}

function veilMat(): THREE.Material {
  let m = MATS.get('veil');
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.5, transparent: true, opacity: 0.3, side: THREE.DoubleSide, depthWrite: false });
    MATS.set('veil', m);
  }
  return m;
}

function blobMat(color: string, opacity: number): THREE.Material {
  const key = `blob|${color}|${opacity}`;
  let m = MATS.get(key);
  if (!m) {
    m = new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false });
    MATS.set(key, m);
  }
  return m;
}

/* ───────────────────────────── Parts ───────────────────────────── */

function Hair({ hairId, color, bridal }: { hairId: string; color: string; bridal: boolean }) {
  const g = geo();
  const m = hairMat(color);
  const style = bridal ? 'hair_4' : hairId;
  return (
    <group>
      {/* Cap tilted back: hairline above the brows at the front, nape at the back; it stands
          slightly off the scalp all round, like real hair has volume */}
      <mesh geometry={g.hairCap} material={m} position={[0, 0.012, -0.01]} rotation={[-0.43, 0, 0]} scale={[0.128, 0.167, 0.148]} />
      {style === 'hair_2' && <mesh geometry={g.sphere} material={m} position={[0, 0.122, 0.055]} rotation={[-0.35, 0, 0]} scale={[0.072, 0.036, 0.055]} />}
      {style === 'hair_3' && (
        <group>
          <mesh geometry={g.hairLong} material={hairMat(color, true)} position={[0, -0.13, -0.012]} />
          <mesh geometry={g.box} material={m} position={[0.108, -0.09, 0.035]} scale={[0.022, 0.24, 0.05]} />
          <mesh geometry={g.box} material={m} position={[-0.108, -0.09, 0.035]} scale={[0.022, 0.24, 0.05]} />
        </group>
      )}
      {style === 'hair_4' && (
        <group>
          <mesh geometry={g.sphere} material={m} position={[0, 0.07, -0.128]} scale={0.056} />
          <mesh geometry={g.box} material={mat('#d4af37', 0.3, 0.6)} position={[0, 0.075, -0.13]} rotation={[0, 0, 0.5]} scale={[0.15, 0.008, 0.008]} />
        </group>
      )}
      {style === 'hair_5' && (
        <group>
          <mesh geometry={g.sphere} material={m} position={[0.088, 0.1, -0.06]} scale={0.046} />
          <mesh geometry={g.sphere} material={m} position={[-0.088, 0.1, -0.06]} scale={0.046} />
        </group>
      )}
      {style === 'hair_6' && <mesh geometry={g.hairBob} material={hairMat(color, true)} position={[0, -0.055, -0.004]} />}
    </group>
  );
}

function Face({ skin, brow, feminine, detailRef }: { skin: string; brow: string; feminine: boolean; detailRef: React.RefObject<THREE.Group> }) {
  const g = geo();
  const skinM = mat(skin, 0.6);
  const sclera = mat('#f6f4ef', 0.3);
  const iris = mat('#2a1b12', 0.15);
  const browM = mat(brow, 0.6);
  return (
    <group>
      <mesh geometry={g.head} material={skinM} scale={[feminine ? 0.96 : 1, 1, 1.08]} />
      {/* Features are hidden at a distance where they would be a pixel or two */}
      <group ref={detailRef}>
      {/* Ears */}
      <mesh geometry={g.sphereLow} material={skinM} position={[0.108, -0.01, -0.004]} scale={[0.013, 0.027, 0.019]} />
      <mesh geometry={g.sphereLow} material={skinM} position={[-0.108, -0.01, -0.004]} scale={[0.013, 0.027, 0.019]} />
      {/* Eyes sit on the face surface (z ≈ 0.112 at this height), brows a little above */}
      {[0.04, -0.04].map((x) => (
        <group key={x}>
          <mesh geometry={g.sphereLow} material={sclera} position={[x, 0, 0.102]} scale={[0.02, 0.012, 0.012]} />
          <mesh geometry={g.sphereLow} material={iris} position={[x, 0, 0.111]} scale={0.0085} />
          <mesh geometry={g.box} material={browM} position={[x, 0.03, 0.112]} rotation={[0, 0, x > 0 ? -0.1 : 0.1]} scale={[0.04, feminine ? 0.006 : 0.008, 0.008]} />
        </group>
      ))}
      {/* Nose and mouth */}
      <mesh geometry={g.sphereLow} material={mat(shade(skin, -0.03), 0.6)} position={[0, -0.03, 0.112]} scale={[0.014, 0.026, 0.018]} />
      <mesh geometry={g.mouth} material={mat(feminine ? '#c0535c' : '#a8675f', 0.45)} position={[0, -0.06, 0.099]} rotation={[0.2, 0, Math.PI + Math.PI * 0.1]} />
      </group>
    </group>
  );
}

/** Beyond this distance from the camera, faces and small trims are not drawn (with hysteresis) */
const DETAIL_FAR = 13;
const DETAIL_NEAR = 12;

/* ───────────────────────────── Avatar ───────────────────────────── */

function damp(current: number, target: number, rate: number, dt: number): number {
  return current + (target - current) * (1 - Math.exp(-rate * dt));
}

interface Joints {
  thighA: number;
  thighB: number;
  kneeA: number;
  kneeB: number;
  armAx: number;
  armAz: number;
  armBx: number;
  armBz: number;
  elbowA: number;
  elbowB: number;
  pitch: number;
  bodyY: number;
}

const REST: Joints = { thighA: 0, thighB: 0, kneeA: 0.05, kneeB: 0.05, armAx: 0.04, armAz: 0.08, armBx: 0.04, armBz: 0.08, elbowA: -0.15, elbowB: -0.15, pitch: 0, bodyY: 0 };

/** Runs as the first child of the avatar root group so its useFrame updates root.position before <Html> projects. */
function AvatarFrameDriver({ onFrame }: { onFrame: (state: RootState, delta: number) => void }) {
  useFrame((state, delta) => {
    onFrame(state, delta);
  });
  return null;
}

export const HumanAvatar: React.FC<AvatarRenderProps> = ({
  id,
  displayName,
  side,
  role,
  outfitId,
  hairId,
  hairColor,
  targetX,
  targetZ,
  targetRotY,
  anim,
  hasBouquetCrown = false,
  isSpeaking = false,
  bubbleText = '',
  showLabel = true,
  isLocal = false,
  isNpc = false,
  liveLocalRef,
  motion,
  motionKey,
  isSeated = false,
  personId = '',
  onClick,
}) => {
  const g = geo();
  const outfit = OUTFITS[outfitId] ?? OUTFITS.ao_dai_guest;
  const fem = outfit.feminine;
  const skin = useMemo(() => (isNpc ? SKIN_TONES[0] : SKIN_TONES[hashString(id) % SKIN_TONES.length]), [id, isNpc]);
  const hair = hairColor || '#1f2937';
  const bridal = outfitId === 'vay_cuoi_trang' || outfitId === 'ao_dai_cuoi_do';
  const scale = fem ? 0.95 : 1;
  const shoulderX = fem ? 0.158 : 0.19;

  const rootRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const upperRef = useRef<THREE.Group>(null);
  const thighARef = useRef<THREE.Group>(null);
  const thighBRef = useRef<THREE.Group>(null);
  const kneeARef = useRef<THREE.Group>(null);
  const kneeBRef = useRef<THREE.Group>(null);
  const armARef = useRef<THREE.Group>(null);
  const armBRef = useRef<THREE.Group>(null);
  const elbowARef = useRef<THREE.Group>(null);
  const elbowBRef = useRef<THREE.Group>(null);
  const panelFRef = useRef<THREE.Group>(null);
  const panelBRef = useRef<THREE.Group>(null);
  const skirtRef = useRef<THREE.Mesh>(null);
  const faceDetailRef = useRef<THREE.Group>(null);
  const trimDetailRef = useRef<THREE.Group>(null);
  const personMotion = useRef<PersonMotion>({ walk: 0, speed: 0 });

  // Seed initial group transform once so Colyseus re-renders never reset root.position back to stale network props
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const initPosition = useMemo<[number, number, number]>(
    () => [liveLocalRef?.current?.x ?? targetX, 0, liveLocalRef?.current?.z ?? targetZ],
    []
  );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const initRotation = useMemo<[number, number, number]>(
    () => [0, liveLocalRef?.current?.rotY ?? targetRotY, 0],
    []
  );

  const st = useRef({
    phase: 0,
    walk: 0,
    speed: 0,
    lastX: targetX,
    lastZ: targetZ,
    pose: { ...REST },
    seed: (hashString(id) % 1000) / 160,
  });

  const handleFrame = (state: RootState, delta: number) => {
    const root = rootRef.current;
    const body = bodyRef.current;
    const upper = upperRef.current;
    if (!root) return;
    const dt = Math.min(delta, 0.1);
    const s = st.current;
    const t = state.clock.elapsedTime + s.seed;
    const seated = anim === 'sit' || isSeated;

    // ── Where to stand ──
    let x = targetX;
    let z = targetZ;
    let rotY = targetRotY;
    const live = isLocal && !seated ? liveLocalRef?.current : undefined;
    const pose = !live && motion && motionKey ? motion.get(motionKey)?.sample(performance.now()) : null;
    if (live) {
      x = live.x;
      z = live.z;
      rotY = live.rotY;
    } else if (pose) {
      x = pose.x;
      z = pose.z;
      rotY = pose.rotY;
    } else {
      x = damp(root.position.x, targetX, 10, dt);
      z = damp(root.position.z, targetZ, 10, dt);
    }
    root.position.x = x;
    root.position.z = z;

    // Level of detail by camera distance
    const cam = state.camera.position;
    const camDist = Math.hypot(cam.x - x, cam.y - 1.4, cam.z - z);
    const face = faceDetailRef.current;
    if (face) {
      const show = face.visible ? camDist < DETAIL_FAR : camDist < DETAIL_NEAR;
      face.visible = show;
      if (trimDetailRef.current) trimDetailRef.current.visible = show;
    }

    let dr = rotY - root.rotation.y;
    while (dr > Math.PI) dr -= Math.PI * 2;
    while (dr < -Math.PI) dr += Math.PI * 2;
    root.rotation.y += dr * (1 - Math.exp(-14 * dt));
    root.updateMatrixWorld();

    // ── Walk cycle driven by distance covered ──
    const moved = Math.hypot(x - s.lastX, z - s.lastZ);
    s.lastX = x;
    s.lastZ = z;
    const frameSpeed = moved > 1.5 ? 0 : moved / Math.max(dt, 1e-4); // ignore teleports
    s.speed = damp(s.speed, frameSpeed, 12, dt);
    if (moved <= 1.5) s.phase += moved * STRIDE_RAD_PER_M;
    const walking = !seated && s.speed > 0.6;
    s.walk = damp(s.walk, walking ? 1 : 0, walking ? 10 : 6, dt);
    const w = s.walk;
    personMotion.current.walk = w;
    personMotion.current.speed = s.speed;
    // A realistic body animates itself from here on
    if (!body || !upper) return;

    // ── Static pose for the current action ──
    const target: Joints = { ...REST };
    let gesture = false;
    target.armAz = 0.08 + Math.sin(t * 0.9) * 0.015;
    target.armBz = 0.08 + Math.sin(t * 0.9 + 1) * 0.015;
    if (seated) {
      // Hips on the cushion (seat top ≈ 0.42 m), thighs level, shins down, hands on the lap
      target.bodyY = 0.47 - HIP_Y * scale;
      target.thighA = target.thighB = -1.5;
      target.kneeA = target.kneeB = 1.5;
      target.armAx = target.armBx = -0.5;
      target.elbowA = target.elbowB = -0.75;
    }
    if (anim === 'wave') {
      gesture = true;
      target.armAx = -2.55;
      target.armAz = 0.3 + Math.sin(t * 9) * 0.22;
      target.elbowA = -0.45 + Math.sin(t * 9) * 0.25;
    } else if (anim === 'clap') {
      gesture = true;
      const k = (Math.sin(t * 14) + 1) / 2;
      target.armAx = target.armBx = -1.05;
      target.armAz = target.armBz = -0.42 + k * 0.2;
      target.elbowA = target.elbowB = -0.95;
    } else if (anim === 'cheers' || anim === 'drink') {
      gesture = true;
      target.armAx = anim === 'drink' ? -1.45 : -2.65;
      target.elbowA = anim === 'drink' ? -1.15 : -0.35;
      target.armBx = -0.45;
      target.elbowB = -0.65;
      target.bodyY += Math.abs(Math.sin(t * 6)) * 0.025;
    } else if (anim === 'jump_catch' && !seated) {
      gesture = true;
      const hop = Math.abs(Math.sin(t * 6));
      target.armAx = target.armBx = -2.85;
      target.armAz = target.armBz = 0.25;
      target.elbowA = target.elbowB = -0.1;
      target.bodyY = hop * 0.42;
      target.kneeA = target.kneeB = (1 - hop) * 0.5;
      target.thighA = target.thighB = -(1 - hop) * 0.25;
    } else if (anim === 'bow') {
      target.pitch = 0.55;
      target.armAx = target.armBx = -0.5;
    }

    const p = s.pose;
    const r = 14;
    (Object.keys(target) as Array<keyof Joints>).forEach((key) => {
      p[key] = damp(p[key], target[key], r, dt);
    });

    // ── Walk overlay ──
    const sw = Math.sin(s.phase);
    const cw = Math.cos(s.phase);
    const legSwing = 0.55 * sw * w;
    const thighA = p.thighA + legSwing;
    const thighB = p.thighB - legSwing;
    const kneeA = p.kneeA + w * (0.08 + 0.95 * Math.max(0, -cw));
    const kneeB = p.kneeB + w * (0.08 + 0.95 * Math.max(0, cw));
    const armSwing = gesture ? 0 : -legSwing * 0.85;
    const elbowBend = gesture ? 0 : -0.35 * w;

    thighARef.current?.rotation.set(thighA, 0, 0);
    thighBRef.current?.rotation.set(thighB, 0, 0);
    kneeARef.current?.rotation.set(kneeA, 0, 0);
    kneeBRef.current?.rotation.set(kneeB, 0, 0);
    armARef.current?.rotation.set(p.armAx + armSwing, 0, p.armAz);
    armBRef.current?.rotation.set(p.armBx - armSwing, 0, -p.armBz);
    elbowARef.current?.rotation.set(p.elbowA + elbowBend, 0, 0);
    elbowBRef.current?.rotation.set(p.elbowB + elbowBend, 0, 0);

    body.position.y = p.bodyY + w * 0.032 * (Math.abs(cw) - 0.4);
    upper.rotation.set(p.pitch + w * 0.06, sw * 0.07 * w, Math.sin(t * 0.6) * 0.012 * (1 - w));
    upper.position.y = Math.sin(t * 1.7) * 0.0035;

    // Áo dài panels flow ahead of / behind the striding legs; skirts sway
    if (panelFRef.current) panelFRef.current.rotation.x = -Math.max(0, -thighA, -thighB) * 0.95 - 0.04 - w * 0.06;
    if (panelBRef.current) panelBRef.current.rotation.x = Math.max(0, thighA, thighB) * 0.95 + 0.04 + w * 0.12;
    if (skirtRef.current) {
      skirtRef.current.rotation.z = sw * 0.035 * w;
      skirtRef.current.rotation.x = w * 0.05;
      const sit = seated ? 1 : 0;
      skirtRef.current.scale.set(1 + sit * 0.15, 1 - sit * 0.4, 1 + sit * 0.35);
    }
  };

  const badge =
    role === 'BRIDE' || (isNpc && outfitId === 'vay_cuoi_trang')
      ? 'Cô Dâu'
      : role === 'GROOM' || (isNpc && outfitId === 'vest_chu_re')
        ? 'Chú Rể'
        : role === 'OWNER'
          ? 'Chủ Tiệc'
          : role === 'MC'
            ? 'MC'
            : side
              ? SIDE_LABELS[side] || ''
              : '';

  // Garment colours per body part
  const sleeve = outfit.style === 'gown' || outfit.style === 'dress' ? skin : outfit.top;
  const forearm = outfit.style === 'casual' || outfit.style === 'gown' || outfit.style === 'dress' ? skin : outfit.top;
  const legColor = outfit.style === 'dress' ? skin : outfit.bottom;
  const wideLegs = outfit.style === 'ao_dai';
  const thighGeo = wideLegs ? g.thighWide : fem ? g.thighF : g.thighM;
  const shinGeo = wideLegs ? g.shinWide : fem ? g.shinF : g.shinM;
  const torsoDepth = 0.72;
  const chestFront = (fem ? 0.14 : 0.157) * torsoDepth + 0.002;

  const kneeR = wideLegs ? 0.084 : fem ? 0.056 : 0.07;
  const elbowR = fem ? 0.037 : 0.047;
  const leg = (sideX: number, thighRef: React.RefObject<THREE.Group>, kneeRef: React.RefObject<THREE.Group>) => (
    <group ref={thighRef} position={[sideX, 0, 0]}>
      <mesh geometry={thighGeo} material={mat(legColor, 0.75)} position={[0, -0.21, 0]} />
      <group ref={kneeRef} position={[0, -THIGH, 0]}>
        <mesh geometry={g.sphereLow} material={mat(legColor, 0.75)} scale={kneeR} />
        <mesh geometry={shinGeo} material={mat(legColor, 0.75)} position={[0, -0.2, 0]} />
        <mesh geometry={g.sphere} material={mat(outfit.shoes, outfit.style === 'suit' ? 0.25 : 0.55)} position={[0, -SHIN_TO_SOLE + 0.012, 0.035]} scale={[0.055, 0.042, 0.12]} />
      </group>
    </group>
  );

  const arm = (sideSign: 1 | -1, armRef: React.RefObject<THREE.Group>, elbowRef: React.RefObject<THREE.Group>) => (
    <group ref={armRef} position={[sideSign * shoulderX, SHOULDER_Y, 0]}>
      <mesh geometry={g.sphereLow} material={mat(sleeve, 0.65)} scale={fem ? 0.044 : 0.057} />
      <mesh geometry={fem ? g.upperArmF : g.upperArmM} material={mat(sleeve, 0.65)} position={[0, -0.14, 0]} />
      <group ref={elbowRef} position={[0, -0.28, 0]}>
        <mesh geometry={g.sphereLow} material={mat(sleeve === forearm ? sleeve : forearm, 0.65)} scale={elbowR} />
        <mesh geometry={fem ? g.foreArmF : g.foreArmM} material={mat(forearm, 0.65)} position={[0, -0.125, 0]} />
        <mesh geometry={g.sphere} material={mat(skin, 0.6)} position={[0, -0.29, 0.006]} scale={fem ? [0.022, 0.052, 0.036] : [0.026, 0.06, 0.042]} />
        {sideSign === 1 && (anim === 'cheers' || anim === 'drink') && (
          <group position={[0, -0.31, 0.045]} rotation={[Math.PI * 0.62, 0, 0]} scale={1.08}>
            <mesh geometry={wineGlass()} material={glass('#f8fbff')} castShadow={false} />
            <mesh geometry={wineFill()} material={liquid('#d99b26')} castShadow={false} />
          </group>
        )}
      </group>
    </group>
  );

  const stylisedBody = (
      <group ref={bodyRef} scale={scale}>
        <group position={[0, HIP_Y, 0]}>
          {leg(0.085, thighARef, kneeARef)}
          {leg(-0.085, thighBRef, kneeBRef)}

          {/* Pelvis in the trouser / skirt colour */}
          <mesh geometry={g.sphere} material={mat(outfit.bottom, 0.7)} position={[0, -0.01, 0]} scale={[fem ? 0.158 : 0.15, 0.1, (fem ? 0.158 : 0.15) * torsoDepth]} />

          {outfit.style === 'gown' && <mesh ref={skirtRef} geometry={g.skirtGown} material={mat(outfit.top, 0.5, 0, true)} />}
          {outfit.style === 'dress' && <mesh ref={skirtRef} geometry={g.skirtDress} material={mat(outfit.top, 0.45, 0, true)} />}
          {outfit.style === 'ao_dai' && (
            <>
              <group ref={panelFRef} position={[0, 0.06, 0.112]}>
                <mesh geometry={g.box} material={mat(outfit.top, 0.5)} position={[0, -0.37, 0]} scale={[0.22, 0.74, 0.012]} />
              </group>
              <group ref={panelBRef} position={[0, 0.06, -0.112]}>
                <mesh geometry={g.box} material={mat(outfit.top, 0.5)} position={[0, -0.37, 0]} scale={[0.22, 0.74, 0.012]} />
              </group>
            </>
          )}

          <group ref={upperRef}>
            <mesh geometry={fem ? g.torsoF : g.torsoM} material={mat(outfit.top, outfit.style === 'suit' ? 0.55 : 0.6)} scale={[1, 1, torsoDepth]} />
            {(outfit.style === 'gown' || outfit.style === 'dress') && (
              // Bare shoulders and neckline above the bodice
              <mesh geometry={g.sphere} material={mat(skin, 0.6)} position={[0, 0.455, 0]} scale={[0.145, 0.07, 0.105]} />
            )}
            {outfit.style === 'suit' && (
              <group>
                <mesh geometry={g.jacketHem} material={mat(outfit.top, 0.55, 0, true)} scale={[1, 1, torsoDepth + 0.02]} />
                {/* Shirt, tie or bow tie, lapels, boutonnière */}
                <mesh geometry={g.box} material={mat(outfit.accent, 0.4)} position={[0, 0.405, chestFront]} rotation={[0.12, 0, 0]} scale={[0.1, 0.17, 0.01]} />
                {outfitId === 'vest_chu_re' ? (
                  <group position={[0, 0.49, chestFront + 0.012]}>
                    <mesh geometry={g.sphereLow} material={mat(outfit.tie!, 0.4)} position={[0.022, 0, 0]} scale={[0.024, 0.016, 0.01]} />
                    <mesh geometry={g.sphereLow} material={mat(outfit.tie!, 0.4)} position={[-0.022, 0, 0]} scale={[0.024, 0.016, 0.01]} />
                  </group>
                ) : (
                  <mesh geometry={g.box} material={mat(outfit.tie!, 0.4)} position={[0, 0.405, chestFront + 0.008]} rotation={[0.12, 0, 0]} scale={[0.03, 0.15, 0.008]} />
                )}
                {/* Satin lapels catch the light, so the jacket reads as tailored rather than a black block */}
                <mesh geometry={g.box} material={mat(shade(outfit.top, 0.07), 0.28, 0.1)} position={[0.055, 0.41, chestFront + 0.004]} rotation={[0.12, 0, 0.32]} scale={[0.035, 0.19, 0.01]} />
                <mesh geometry={g.box} material={mat(shade(outfit.top, 0.07), 0.28, 0.1)} position={[-0.055, 0.41, chestFront + 0.004]} rotation={[0.12, 0, -0.32]} scale={[0.035, 0.19, 0.01]} />
                <group ref={trimDetailRef}>
                  {[0.27, 0.19].map((y) => (
                    <mesh key={y} geometry={g.sphereLow} material={mat('#c9b27a', 0.3, 0.6)} position={[0, y, (fem ? 0.13 : 0.142) * torsoDepth + 0.004]} scale={0.009} />
                  ))}
                  {outfitId === 'vest_chu_re' && <mesh geometry={g.sphereLow} material={mat('#e11d48', 0.45)} position={[0.095, 0.4, chestFront + 0.006]} scale={0.022} />}
                </group>
              </group>
            )}
            {outfit.style === 'casual' && (
              <mesh geometry={g.box} material={mat(outfit.accent, 0.5)} position={[0, 0.5, chestFront - 0.01]} rotation={[0.3, 0, 0]} scale={[0.1, 0.03, 0.03]} />
            )}
            {outfit.style === 'ao_dai' && (
              <>
                <mesh geometry={g.collar} material={mat(outfit.top, 0.5, 0, true)} position={[0, 0.555, 0]} />
                <mesh geometry={g.sphereLow} material={mat(outfit.accent, 0.4, outfitId === 'ao_dai_cuoi_do' ? 0.4 : 0)} position={[0.05, 0.36, chestFront - 0.004]} scale={[0.035, 0.035, 0.006]} />
              </>
            )}
            {outfit.style === 'gown' && (
              <mesh geometry={g.cylinder} material={mat(outfit.accent, 0.35, 0.3)} position={[0, 0.16, 0]} scale={[0.116, 0.038, 0.116 * torsoDepth + 0.004]} />
            )}

            <mesh geometry={g.neck} material={mat(skin, 0.6)} position={[0, 0.56, 0]} />

            {arm(1, armARef, elbowARef)}
            {arm(-1, armBRef, elbowBRef)}

            <group position={[0, HEAD_Y, 0.01]}>
              <Face skin={skin} brow={hair} feminine={fem} detailRef={faceDetailRef} />
              <Hair hairId={hairId} color={hair} bridal={bridal && outfitId === 'vay_cuoi_trang'} />
              {outfitId === 'vay_cuoi_trang' && (
                <group>
                  <mesh geometry={g.tiara} material={mat('#e5c06a', 0.25, 0.7)} position={[0, 0.118, 0.03]} rotation={[-0.9, 0, 0]} />
                  <mesh geometry={g.veil} material={veilMat()} position={[0, -0.4, -0.15]} rotation={[0.12, 0, 0]} />
                </group>
              )}
              {outfitId === 'ao_dai_cuoi_do' && (
                // Khăn vấn (traditional bridal headdress)
                <mesh geometry={g.headband} material={mat(outfit.accent, 0.35, 0.45)} position={[0, 0.085, -0.004]} rotation={[Math.PI / 2 - 0.28, 0, 0]} scale={[1, 1, 1.5]} />
              )}
              {hasBouquetCrown && (
                <group position={[0, 0.135, 0]} rotation={[Math.PI / 2, 0, 0]}>
                  <mesh geometry={g.crown} material={mat('#facc15', 0.3, 0.5)} />
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <mesh key={i} geometry={g.sphereLow} material={mat('#f9a8d4', 0.5)} position={[Math.cos(i * 1.047) * 0.105, Math.sin(i * 1.047) * 0.105, -0.01]} scale={0.022} />
                  ))}
                </group>
              )}
            </group>
          </group>
        </group>
      </group>
  );

  return (
    <group
      ref={rootRef}
      position={initPosition}
      rotation={initRotation}
      onClick={(e) => {
        if (onClick) {
          e.stopPropagation();
          onClick();
        }
      }}
      onPointerOver={(e) => {
        if (onClick && typeof document !== 'undefined') {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }
      }}
      onPointerOut={() => {
        if (onClick && typeof document !== 'undefined') document.body.style.cursor = 'auto';
      }}
    >
      <AvatarFrameDriver onFrame={handleFrame} />
      {/* Soft contact shadow (the sun shadow does the rest when it is on) */}
      <mesh geometry={g.blob} material={blobMat('#1e1b2e', 0.16)} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]} />
      {(isLocal || isSpeaking) && (
        <mesh geometry={g.ring} material={blobMat(isSpeaking ? '#22c55e' : '#f43f5e', 0.85)} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]} />
      )}

      {personId ? (
        <>
          <RealPerson
            id={personId}
            anim={anim}
            seated={anim === 'sit' || isSeated}
            motion={personMotion}
            fallback={stylisedBody}
            attire={outfitId === 'vay_cuoi_trang' ? 'gown' : 'none'}
            priority={isNpc || outfitId === 'vay_cuoi_trang' || outfitId === 'vest_chu_re'}
          />
      {hasBouquetCrown && (
        <group position={[0, 1.78, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh geometry={g.crown} material={mat('#facc15', 0.3, 0.5)} />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <mesh key={i} geometry={g.sphereLow} material={mat('#f9a8d4', 0.5)} position={[Math.cos(i * 1.047) * 0.105, Math.sin(i * 1.047) * 0.105, -0.01]} scale={0.022} />
          ))}
        </group>
      )}
        </>
      ) : (
        stylisedBody
      )}

      {(showLabel || bubbleText) && (
        <Html position={[0, personId ? 2.05 : fem ? 1.95 : 2.02, 0]} center eps={0} zIndexRange={[10, 0]}>
          <div className="pointer-events-none flex select-none flex-col items-center gap-1">
            {bubbleText && (
              <div className="max-w-[180px] rounded-2xl border border-amber-200 bg-white/95 px-2.5 py-1 text-center text-[11px] font-medium text-slate-900 shadow-md">
                {bubbleText}
              </div>
            )}
            {showLabel && (
              <div className="flex items-center gap-1 whitespace-nowrap rounded-full bg-slate-900/75 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                {isSpeaking && <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />}
                {hasBouquetCrown && <span>👑</span>}
                <span>{displayName}</span>
                {badge && <span className="rounded bg-rose-500/85 px-1 text-[9px] text-white">{badge}</span>}
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
};
