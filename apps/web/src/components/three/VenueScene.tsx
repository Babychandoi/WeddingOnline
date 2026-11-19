'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import {
  buildOccupancyGrid,
  findGridPathAStar,
  getPrefabCenterWorld,
  getTableSeatAnchors,
  getVenueTheme,
  type PlacedPrefab,
  type SceneLayoutDocument,
} from '@dco/shared';
import type { PhotoAssetRecord } from '@dco/database';
import { HumanAvatar } from './HumanAvatar';
import { npcTrackKey, type MotionStore } from '@dco/shared';
import { GlbAssetMesh } from './GlbAssetMesh';
import { SurfaceMaterial, VenueEnvironment, VenueGate } from './venueKits';
import { FpsGuard, PostFX, ShadowCasters, VenueAtmosphere, bloomStrength } from './venueAtmosphere';

/** In-scene HTML labels and buttons are hidden in the non-interactive venue preview */
const SceneLabelsContext = createContext(true);

function SceneLabel(props: React.ComponentProps<typeof Html>) {
  return useContext(SceneLabelsContext) ? <Html {...props} /> : null;
}

export interface RemotePlayerView {
  sessionId: string;
  userId: string;
  displayName: string;
  role: string;
  side: string;
  outfitId: string;
  hairId: string;
  hairColor: string;
  x: number;
  z: number;
  rotY: number;
  anim: string;
  seatedTableNo: number;
  seatIndex: number;
  hasBouquetCrown: boolean;
  isSpeaking: boolean;
  takingOverNpc?: string;
  bubbleText: string;
}

export interface RemoteNpcView {
  npcId: string;
  displayName: string;
  outfitId: string;
  isTakenOver: boolean;
  x: number;
  z: number;
  rotY: number;
  anim: string;
  bubbleText?: string;
}

export interface BouquetView {
  status: string;
  originX: number;
  originZ: number;
  targetX: number;
  targetZ: number;
  tossStartTs: number;
  flightDurationMs: number;
}

interface VenueSceneProps {
  layout: SceneLayoutDocument;
  tier: string;
  photos: PhotoAssetRecord[];
  localSessionId: string;
  players: RemotePlayerView[];
  npcs: RemoteNpcView[];
  /** Live, smoothed positions of players and NPCs (updated every network patch, read per frame) */
  motionStore?: MotionStore;
  bouquet: BouquetView;
  activeRitual: string;
  giftBurstKey: number;
  joystickInput: { dx: number; dz: number };
  onMove: (x: number, z: number, rotY: number, isMoving: boolean) => void;
  onSitSeat: (tableNo: number, seatIndex: number) => void;
  onOpenGuestbook: () => void;
  onOpenGiftBox: () => void;
  onOpenVideo: () => void;
  onOpenPhoto: (photo: PhotoAssetRecord | null, index: number) => void;
  onSelectPlayer?: (player: RemotePlayerView) => void;
  registerCaptureFn?: (fn: () => string | null) => void;
  waypointTarget?: { x: number; z: number; key: number } | null;
  /**
   * 'preview': a look-only showcase of the venue (no walking, no in-scene buttons),
   * with the camera orbiting the hall; previewAutoRotate=false holds a still frame.
   */
  mode?: 'play' | 'preview';
  previewAutoRotate?: boolean;
  /** Preview camera override (close-up stills) */
  previewCamera?: { position: [number, number, number]; target: [number, number, number] };
}

const setPointerCursor = (active: boolean) => {
  if (typeof document !== 'undefined') {
    document.body.style.cursor = active ? 'pointer' : 'auto';
  }
};

const CameraRigAndController: React.FC<{
  grid: boolean[][];
  localPlayer?: RemotePlayerView;
  localPosRef: React.MutableRefObject<{
    x: number;
    z: number;
    rotY: number;
    isMoving: boolean;
    initialized: boolean;
  }>;
  joystickInput: { dx: number; dz: number };
  targetPath: React.MutableRefObject<Array<{ x: number; z: number }>>;
  onArriveClickMarker: () => void;
  onMove: (x: number, z: number, rotY: number, isMoving: boolean) => void;
  onFpsDrop: (lowFps: boolean) => void;
  registerCaptureFn?: (fn: () => string | null) => void;
}> = ({
  grid,
  localPlayer,
  localPosRef,
  joystickInput,
  targetPath,
  onArriveClickMarker,
  onMove,
  onFpsDrop,
  registerCaptureFn,
}) => {
    const { gl, scene, camera } = useThree();
    const keys = useRef<Set<string>>(new Set());
    const lastEmitTs = useRef(0);
    const wasMovingRef = useRef(false);
    const frameStats = useRef({ count: 0, elapsed: 0, low: false });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const controlsRef = useRef<any>(null);
    const camDirVec = useMemo(() => new THREE.Vector3(), []);

    useEffect(() => {
        if (!localPlayer) return;
        if (!localPosRef.current.initialized) {
          localPosRef.current.x = localPlayer.x;
          localPosRef.current.z = localPlayer.z;
          localPosRef.current.rotY = localPlayer.rotY;
          localPosRef.current.initialized = true;
          if (controlsRef.current) {
            controlsRef.current.target.set(localPlayer.x, 1.2, localPlayer.z);
            camera.position.set(localPlayer.x, 8.5, localPlayer.z + 7.5);
            controlsRef.current.update();
          }
          return;
        }
    const drift = Math.hypot(
      localPlayer.x - localPosRef.current.x,
      localPlayer.z - localPosRef.current.z
    );
    if (localPlayer.seatedTableNo >= 0 || drift > 4.5) {
      localPosRef.current.x = localPlayer.x;
      localPosRef.current.z = localPlayer.z;
      localPosRef.current.rotY = localPlayer.rotY;
      localPosRef.current.isMoving = false;
    }
  }, [
    localPlayer,
    localPlayer?.seatedTableNo,
    localPlayer?.x,
    localPlayer?.z,
    localPlayer?.rotY,
    localPosRef,
    camera,
  ]);

useEffect(() => {
  if (!registerCaptureFn) return;
  registerCaptureFn(() => {
    gl.render(scene, camera);
    return gl.domElement.toDataURL('image/png');
  });
}, [gl, scene, camera, registerCaptureFn]);

useEffect(() => {
  const clearKeys = () => keys.current.clear();
  const onDown = (e: KeyboardEvent) => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;
    keys.current.add(e.key.toLowerCase());
  };
  const onUp = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase());
  window.addEventListener('keydown', onDown);
  window.addEventListener('keyup', onUp);
  window.addEventListener('blur', clearKeys);
  document.addEventListener('visibilitychange', clearKeys);
  return () => {
    window.removeEventListener('keydown', onDown);
    window.removeEventListener('keyup', onUp);
    window.removeEventListener('blur', clearKeys);
    document.removeEventListener('visibilitychange', clearKeys);
    setPointerCursor(false);
  };
}, []);

useFrame((_, delta) => {
  frameStats.current.count += 1;
  frameStats.current.elapsed += delta;
  if (frameStats.current.elapsed >= 3.0) {
    const fps = frameStats.current.count / frameStats.current.elapsed;
    const shouldDegrade = fps < 28;
    if (shouldDegrade !== frameStats.current.low) {
      frameStats.current.low = shouldDegrade;
      onFpsDrop(shouldDegrade);
    }
    frameStats.current.count = 0;
    frameStats.current.elapsed = 0;
  }

  const safeDelta = Math.min(delta, 0.1);
  let vx = joystickInput.dx;
  let vz = joystickInput.dz;
  if (keys.current.has('w') || keys.current.has('arrowup')) vz -= 1;
  if (keys.current.has('s') || keys.current.has('arrowdown')) vz += 1;
  if (keys.current.has('a') || keys.current.has('arrowleft')) vx -= 1;
  if (keys.current.has('d') || keys.current.has('arrowright')) vx += 1;

  const speed = 4.8;
  let isMoving = false;
  const prevX = localPosRef.current.x;
  const prevZ = localPosRef.current.z;

  if (Math.abs(vx) > 0.05 || Math.abs(vz) > 0.05) {
    targetPath.current = [];
    onArriveClickMarker();

    // Camera-relative horizontal forward/right on XZ plane
    camera.getWorldDirection(camDirVec);
    camDirVec.y = 0;
    if (camDirVec.lengthSq() < 1e-6) camDirVec.set(0, 0, -1);
    camDirVec.normalize();
    const rightX = -camDirVec.z;
    const rightZ = camDirVec.x;

    const rawMoveX = rightX * vx + camDirVec.x * -vz;
    const rawMoveZ = rightZ * vx + camDirVec.z * -vz;
    const len = Math.hypot(rawMoveX, rawMoveZ) || 1;
    const stepX = (rawMoveX / len) * speed * safeDelta;
    const stepZ = (rawMoveZ / len) * speed * safeDelta;

    const nx = localPosRef.current.x + stepX;
    const nz = localPosRef.current.z + stepZ;
    const canX = grid[Math.max(0, Math.min(59, Math.floor((localPosRef.current.z + 15) / 0.5)))]?.[
      Math.max(0, Math.min(59, Math.floor((nx + 15) / 0.5)))
    ];
    const canZ = grid[Math.max(0, Math.min(59, Math.floor((nz + 15) / 0.5)))]?.[
      Math.max(0, Math.min(59, Math.floor((localPosRef.current.x + 15) / 0.5)))
    ];
    if (canX) localPosRef.current.x = Math.max(-14.2, Math.min(14.2, nx));
    if (canZ) localPosRef.current.z = Math.max(-14.2, Math.min(14.2, nz));
    localPosRef.current.rotY = Math.atan2(rawMoveX, rawMoveZ);
    isMoving = true;
  } else if (targetPath.current.length > 0) {
    const wp = targetPath.current[0];
    const dx = wp.x - localPosRef.current.x;
    const dz = wp.z - localPosRef.current.z;
    const dist = Math.hypot(dx, dz);
      if (dist < 0.2) {
        targetPath.current.shift();
        if (targetPath.current.length === 0) onArriveClickMarker();
      } else {
        localPosRef.current.x += (dx / dist) * speed * safeDelta;
        localPosRef.current.z += (dz / dist) * speed * safeDelta;
        localPosRef.current.rotY = Math.atan2(dx, dz);
        isMoving = true;
      }
    }

    localPosRef.current.isMoving = isMoving;

    // Camera moves rigidly with the avatar: both use the same per-frame position, so the
    // avatar stays perfectly still on screen instead of swimming against a lagging target
    const movedX = localPosRef.current.x - prevX;
    const movedZ = localPosRef.current.z - prevZ;
    if (controlsRef.current) {
      const target = controlsRef.current.target as THREE.Vector3;
      const offX = localPosRef.current.x - target.x;
      const offZ = localPosRef.current.z - target.z;
      // Close the gap left by a server snap smoothly; otherwise follow exactly
      const catchUp = Math.abs(offX - movedX) + Math.abs(offZ - movedZ) > 0.01 ? 1 - Math.exp(-safeDelta * 8) : 1;
      const stepX = movedX + (offX - movedX) * catchUp;
      const stepZ = movedZ + (offZ - movedZ) * catchUp;
      target.x += stepX;
      target.z += stepZ;
      target.y = 1.2;
      camera.position.x += stepX;
      camera.position.z += stepZ;
      controlsRef.current.update();
    }

    const now = performance.now();
    if (isMoving && now - lastEmitTs.current >= 100) {
      lastEmitTs.current = now;
      wasMovingRef.current = true;
      onMove(localPosRef.current.x, localPosRef.current.z, localPosRef.current.rotY, true);
    } else if (!isMoving && wasMovingRef.current) {
      wasMovingRef.current = false;
      onMove(localPosRef.current.x, localPosRef.current.z, localPosRef.current.rotY, false);
    }
  });

return (
  <OrbitControls
    ref={controlsRef}
    enablePan={false}
    enableDamping
    dampingFactor={0.09}
    minDistance={4.5}
    maxDistance={21}
    minPolarAngle={Math.PI * 0.16}
    maxPolarAngle={Math.PI * 0.44}
  />
);
  };

const AmbientPetals: React.FC<{ lowQuality: boolean; templateId: string }> = ({
  lowQuality,
  templateId,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const petals = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        x: ((i * 7.3) % 26) - 13,
        z: ((i * 11.7) % 26) - 13,
        speed: 0.45 + (i % 5) * 0.12,
        phase: i * 0.7,
      })),
    []
  );

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.children.forEach((child, idx) => {
      const p = petals[idx];
      if (!p) return;
      child.position.y = 5.5 - ((t * p.speed + p.phase) % 5.2);
      child.position.x = p.x + Math.sin(t * 1.1 + p.phase) * 0.4;
      child.rotation.x = t * 1.2 + p.phase;
      child.rotation.z = t * 0.8;
    });
  });

  const color = getVenueTheme(templateId).colors.pe;
  // Themes without falling petals (e.g. night city, desert) leave pe empty
  if (lowQuality || !color) return null;

  return (
    <group ref={groupRef}>
      {petals.map((p, idx) => (
        <mesh key={idx} position={[p.x, 3, p.z]}>
          <planeGeometry args={[0.14, 0.1]} />
          <meshBasicMaterial color={color} side={THREE.DoubleSide} transparent opacity={0.8} />
        </mesh>
      ))}
    </group>
  );
};

const PhotoCanvasPlane: React.FC<{ url?: string }> = ({ url }) => {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    if (!url) {
      setTexture(null);
      return;
    }
    let active = true;
    let loadedTex: THREE.Texture | null = null;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    loader.load(
      url,
      (tex) => {
        if (!active) {
          tex.dispose();
          return;
        }
        tex.colorSpace = THREE.SRGBColorSpace;
        loadedTex = tex;
        setTexture(tex);
      },
      undefined,
      () => {
        if (active) setTexture(null);
      }
    );
    return () => {
      active = false;
      loadedTex?.dispose();
    };
  }, [url]);

  return (
    <mesh position={[0, 0.96, 0.08]}>
      <planeGeometry args={[0.78, 0.94]} />
      {texture ? (
        <meshBasicMaterial map={texture} />
      ) : (
        <meshBasicMaterial color={url ? '#fbcfe8' : '#e2e8f0'} />
      )}
    </mesh>
  );
};

const BouquetArcMesh: React.FC<{ bouquet: BouquetView }> = ({ bouquet }) => {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!ref.current || bouquet.status !== 'IN_FLIGHT') return;
    const elapsed = Date.now() - bouquet.tossStartTs;
    const t = Math.max(0, Math.min(1, elapsed / bouquet.flightDurationMs));
    const x = THREE.MathUtils.lerp(bouquet.originX, bouquet.targetX, t);
    const z = THREE.MathUtils.lerp(bouquet.originZ, bouquet.targetZ, t);
    const y = 1.4 + Math.sin(t * Math.PI) * 4.2;
    ref.current.position.set(x, y, z);
    ref.current.rotation.y += 0.16;
    ref.current.rotation.x += 0.09;
  });

  if (bouquet.status !== 'IN_FLIGHT' && bouquet.status !== 'COUNTDOWN') return null;
  return (
    <group>
      <group ref={ref} position={[bouquet.originX, 1.5, bouquet.originZ]}>
        <GlbAssetMesh
          url="/models/bouquet-flowers.glb"
          fallback={
            <>
              <mesh>
                <coneGeometry args={[0.25, 0.45, 8]} />
                <meshStandardMaterial color="#ec4899" roughness={0.5} />
              </mesh>
              <mesh position={[0, 0.25, 0]}>
                <sphereGeometry args={[0.28, 10, 10]} />
                <meshStandardMaterial color="#fbcfe8" roughness={0.5} />
              </mesh>
            </>
          }
        />
      </group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[bouquet.targetX, 0.04, bouquet.targetZ]}>
        <ringGeometry args={[0.8, 1.5, 24]} />
        <meshBasicMaterial color="#f43f5e" transparent opacity={0.55} />
      </mesh>
    </group>
  );
};

const CelebrationParticles: React.FC<{
  activeRitual: string;
  giftBurstKey: number;
  lowQuality: boolean;
}> = ({ activeRitual, giftBurstKey, lowQuality }) => {
  const groupRef = useRef<THREE.Group>(null);
  const [burstActive, setBurstActive] = useState(false);

  useEffect(() => {
    if (giftBurstKey === 0) return;
    setBurstActive(true);
    const timer = setTimeout(() => setBurstActive(false), 4500);
    return () => clearTimeout(timer);
  }, [giftBurstKey]);

  const seeds = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        x: (i % 2 === 0 ? -1 : 1) * (2.2 + (i % 4) * 0.4),
        z: -8 + i * 0.9,
        phase: i * 0.4,
      })),
    []
  );

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.children.forEach((child, idx) => {
      const s = seeds[idx];
      if (!s) return;
      child.position.y = 0.4 + ((state.clock.elapsedTime * 3 + s.phase) % 3.2);
    });
  });

  if (lowQuality || (activeRitual === 'NONE' && !burstActive)) return null;

  return (
    <group ref={groupRef}>
      {seeds.map((s, idx) => (
        <mesh key={idx} position={[s.x, 1, s.z]}>
          <octahedronGeometry args={[0.12, 0]} />
          <meshBasicMaterial color={burstActive ? '#fb7185' : '#facc15'} />
        </mesh>
      ))}
    </group>
  );
};

const PrefabMesh: React.FC<{
  prefab: PlacedPrefab;
  templateId: string;
  tier: string;
  photos: PhotoAssetRecord[];
  photoIndexMap: Map<string, number>;
  players: RemotePlayerView[];
  onSitSeat: (tableNo: number, seatIndex: number) => void;
  onOpenGuestbook: () => void;
  onOpenGiftBox: () => void;
  onOpenVideo: () => void;
  onOpenPhoto: (photo: PhotoAssetRecord | null, index: number) => void;
}> = ({
  prefab,
  templateId,
  tier,
  photos,
  photoIndexMap,
  players,
  onSitSeat,
  onOpenGuestbook,
  onOpenGiftBox,
  onOpenVideo,
  onOpenPhoto,
}) => {
    const center = useMemo(() => getPrefabCenterWorld(prefab), [prefab]);
    const rotY = (prefab.rotationDeg * Math.PI) / 180;
    const theme = getVenueTheme(templateId);
    const palette = { accent: theme.colors.a, carpet: theme.colors.c };

    if (prefab.prefabType === 'STAGE_MAIN') {
      return (
        <group position={[center.x, 0, center.z]} rotation={[0, rotY, 0]}>
          {/* Tiered Stage Deck + Front Steps */}
          <mesh position={[0, 0.2, 0]}>
            <boxGeometry args={[6, 0.4, 4]} />
            <meshStandardMaterial color={palette.accent} roughness={0.45} />
          </mesh>
          <mesh position={[0, 0.41, 0]}>
            <boxGeometry args={[5.7, 0.05, 3.7]} />
            <meshStandardMaterial color="#fffbeb" roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.1, 2.2]}>
            <boxGeometry args={[2.6, 0.2, 0.45]} />
            <meshStandardMaterial color="#fef3c7" roughness={0.5} />
          </mesh>

          {/* Velvet Backdrop Curtain & Floral Arch */}
          <mesh position={[0, 2.1, -1.78]}>
            <boxGeometry args={[5.6, 3.4, 0.14]} />
            <meshStandardMaterial color={theme.colors.cu} roughness={0.65} />
          </mesh>
          <mesh position={[0, 3.85, -1.68]}>
            <boxGeometry args={[5.9, 0.35, 0.24]} />
            <meshStandardMaterial color="#d4af37" metalness={0.35} roughness={0.35} />
          </mesh>

          {/* Gold-Rimmed Stage LED Screen */}
          <group
            position={[0, 2.15, -1.56]}
            onPointerOver={(e) => {
              e.stopPropagation();
              setPointerCursor(true);
            }}
            onPointerOut={() => setPointerCursor(false)}
            onClick={(e) => {
              e.stopPropagation();
              onOpenVideo();
            }}
          >
            <mesh>
              <boxGeometry args={[4.5, 2.35, 0.18]} />
              <meshStandardMaterial color="#d4af37" metalness={0.4} roughness={0.35} />
            </mesh>
            <mesh position={[0, 0, 0.1]}>
              <planeGeometry args={[4.2, 2.08]} />
              <meshBasicMaterial color="#1e1b4b" />
            </mesh>
            <SceneLabel position={[0, 0, 0.16]} center distanceFactor={14}>
              <button
                type="button"
                onClick={onOpenVideo}
                className="rounded-xl border border-amber-300/70 bg-rose-600/95 px-3.5 py-2 text-xs font-bold text-white shadow-lg hover:bg-rose-500"
              >
                ▶ XEM VIDEO / LIVESTREAM LỄ CƯỚI
              </button>
            </SceneLabel>
          </group>

          {/* 3-Tier Wedding Cake with Lit Candles */}
          <group position={[-1.7, 0.45, 0.9]}>
            <GlbAssetMesh
              url="/models/stage-cake.glb"
              fallback={
                <>
                  <mesh position={[0, 0.16, 0]}>
                    <cylinderGeometry args={[0.45, 0.48, 0.32, 16]} />
                    <meshStandardMaterial color="#fff1f2" roughness={0.5} />
                  </mesh>
                  <mesh position={[0, 0.42, 0]}>
                    <cylinderGeometry args={[0.32, 0.34, 0.24, 16]} />
                    <meshStandardMaterial color="#fecdd3" roughness={0.5} />
                  </mesh>
                  <mesh position={[0, 0.64, 0]}>
                    <cylinderGeometry args={[0.19, 0.21, 0.2, 16]} />
                    <meshStandardMaterial color="#ffffff" roughness={0.45} />
                  </mesh>
                  <mesh position={[0, 0.82, 0]}>
                    <sphereGeometry args={[0.07, 8, 8]} />
                    <meshBasicMaterial color="#facc15" />
                  </mesh>
                </>
              }
            />
          </group>

          {/* Tiered Champagne Tower */}
          <group position={[1.7, 0.45, 0.9]}>
            <mesh position={[0, 0.1, 0]}>
              <cylinderGeometry args={[0.42, 0.45, 0.16, 12]} />
              <meshStandardMaterial color="#fef08a" transparent opacity={0.8} roughness={0.2} />
            </mesh>
            <mesh position={[0, 0.28, 0]}>
              <cylinderGeometry args={[0.28, 0.32, 0.18, 12]} />
              <meshStandardMaterial color="#fde047" transparent opacity={0.85} roughness={0.2} />
            </mesh>
            <mesh position={[0, 0.46, 0]}>
              <cylinderGeometry args={[0.14, 0.18, 0.18, 12]} />
              <meshStandardMaterial color="#facc15" transparent opacity={0.9} roughness={0.2} />
            </mesh>
          </group>
        </group>
      );
    }

    if (prefab.prefabType === 'GATE_RECEPTION') {
      return (
        <group position={[center.x, 0, center.z]} rotation={[0, rotY, 0]}>
          {/* Themed reception gate (coconut leaves, lacquer, stone arch, palm, bamboo, floral) */}
          <VenueGate theme={theme} />
          {theme.kits.g === 'coconut' && (
            <GlbAssetMesh
              url="/models/coconut-arch-crest.glb"
              position={[0, 2.65, 0.24]}
              fallback={
                <mesh>
                  <boxGeometry args={[1.3, 0.55, 0.14]} />
                  <meshStandardMaterial color="#dc2626" roughness={0.45} />
                </mesh>
              }
            />
          )}
          {theme.gateSign && (
            <SceneLabel position={[0, theme.kits.g === 'lacquer' ? 2.5 : 2.65, 0.4]} center distanceFactor={12}>
              <div className="pointer-events-none whitespace-nowrap rounded border border-amber-300 bg-red-700 px-2 py-0.5 text-xs font-extrabold text-amber-200 shadow">
                {theme.gateSign}
              </div>
            </SceneLabel>
          )}

          {/* Sculpted Guestbook Lectern */}
          <group
            position={[-2.2, 0, -1.1]}
            onPointerOver={(e) => {
              e.stopPropagation();
              setPointerCursor(true);
            }}
            onPointerOut={() => setPointerCursor(false)}
            onClick={(e) => {
              e.stopPropagation();
              onOpenGuestbook();
            }}
          >
            <mesh position={[0, 0.5, 0]}>
              <boxGeometry args={[0.65, 1.0, 0.45]} />
              <meshStandardMaterial color="#78350f" roughness={0.65} />
            </mesh>
            <mesh position={[0, 1.03, 0]} rotation={[-0.25, 0, 0]}>
              <boxGeometry args={[0.52, 0.06, 0.36]} />
              <meshStandardMaterial color="#fffbeb" roughness={0.6} />
            </mesh>
            <SceneLabel position={[0, 1.45, 0]} center distanceFactor={12}>
              <button
                type="button"
                onClick={onOpenGuestbook}
                className="whitespace-nowrap rounded-full bg-amber-500 px-2.5 py-1 text-[11px] font-bold text-white shadow hover:bg-amber-400"
              >
                📖 Ký Sổ Lưu Bút
              </button>
            </SceneLabel>
          </group>
        </group>
      );
    }

    if (prefab.prefabType === 'GIFT_BOX_STAND') {
      if (tier !== 'HAPPINESS' && tier !== 'VIP_FULFILLMENT') {
        return null;
      }
      return (
        <group
          position={[center.x, 0, center.z]}
          rotation={[0, rotY, 0]}
          onPointerOver={(e) => {
            e.stopPropagation();
            setPointerCursor(true);
          }}
          onPointerOut={() => setPointerCursor(false)}
          onClick={(e) => {
            e.stopPropagation();
            onOpenGiftBox();
          }}
        >
          <GlbAssetMesh
            url="/models/gift-heart-box.glb"
            fallback={
              <>
                <mesh position={[0, 0.45, 0]}>
                  <boxGeometry args={[0.95, 0.9, 0.95]} />
                  <meshStandardMaterial color="#ffe4e6" roughness={0.55} />
                </mesh>
                <mesh position={[0, 0.93, 0]}>
                  <boxGeometry args={[1.02, 0.06, 1.02]} />
                  <meshStandardMaterial color="#d4af37" metalness={0.3} roughness={0.4} />
                </mesh>
                <mesh position={[0, 1.2, 0]}>
                  <boxGeometry args={[0.58, 0.48, 0.48]} />
                  <meshStandardMaterial color="#e11d48" roughness={0.45} />
                </mesh>
              </>
            }
          />
          <SceneLabel position={[0, 1.8, 0]} center distanceFactor={12}>
            <button
              type="button"
              onClick={onOpenGiftBox}
              className="whitespace-nowrap rounded-full bg-rose-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-lg hover:bg-rose-500"
            >
              💝 Mừng Cưới VietQR
            </button>
          </SceneLabel>
        </group>
      );
    }

    if (prefab.prefabType === 'BANQUET_TABLE_10' || prefab.prefabType === 'BANQUET_TABLE_8') {
      const tableNo = prefab.meta?.tableNumber ?? 1;
      const seats = getTableSeatAnchors(prefab);
      const radius = prefab.prefabType === 'BANQUET_TABLE_10' ? 0.98 : 0.82;

      return (
        <group>
          <group position={[center.x, 0, center.z]}>
            {/* Floor-Length Draped Tablecloth */}
            <mesh position={[0, 0.36, 0]}>
              <cylinderGeometry args={[radius * 0.95, radius * 1.05, 0.72, 20]} />
              <meshStandardMaterial color="#fff1f2" roughness={0.65} />
            </mesh>
            {/* Satin Accent Overlay */}
            <mesh position={[0, 0.73, 0]}>
              <cylinderGeometry args={[radius, radius, 0.05, 20]} />
              <meshStandardMaterial color="#fecdd3" roughness={0.5} />
            </mesh>
            {/* Lazy Susan Tray & Teapot Centerpiece */}
            <mesh position={[0, 0.77, 0]}>
              <cylinderGeometry args={[radius * 0.48, radius * 0.48, 0.03, 16]} />
              <meshStandardMaterial color="#ffffff" roughness={0.3} />
            </mesh>
            <mesh position={[0, 0.93, 0]}>
              <cylinderGeometry args={[0.11, 0.15, 0.24, 10]} />
              <meshStandardMaterial color="#e11d48" roughness={0.4} />
            </mesh>
            <mesh position={[0, 1.12, 0]}>
              <sphereGeometry args={[0.2, 10, 10]} />
              <meshStandardMaterial color="#fb7185" roughness={0.5} />
            </mesh>
            {/* Festive Plates around Table */}
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const a = (i / 6) * Math.PI * 2;
              return (
                <mesh
                  key={i}
                  position={[Math.sin(a) * (radius * 0.72), 0.76, Math.cos(a) * (radius * 0.72)]}
                >
                  <cylinderGeometry args={[0.11, 0.09, 0.02, 10]} />
                  <meshStandardMaterial color="#ffffff" roughness={0.3} />
                </mesh>
              );
            })}
            <SceneLabel position={[0, 1.52, 0]} center distanceFactor={13}>
              <div className="pointer-events-none whitespace-nowrap rounded-full border border-rose-200 bg-white/90 px-2.5 py-0.5 text-[10px] font-bold text-rose-900 shadow-sm">
                {prefab.meta?.tableLabel || `Bàn ${tableNo}`}
              </div>
            </SceneLabel>
          </group>

          {/* Banquet Chairs with Backrests & Satin Sash Bows */}
          {seats.map((seat) => {
            const occupied = players.some(
              (p) => p.seatedTableNo === tableNo && p.seatIndex === seat.seatIndex
            );
            return (
              <group
                key={seat.seatIndex}
                position={[seat.x, 0, seat.z]}
                rotation={[0, seat.rotY, 0]}
                onPointerOver={(e) => {
                  if (!occupied) {
                    e.stopPropagation();
                    setPointerCursor(true);
                  }
                }}
                onPointerOut={() => setPointerCursor(false)}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!occupied) onSitSeat(tableNo, seat.seatIndex);
                }}
              >
                {/* Seat Cushion */}
                <mesh position={[0, 0.24, 0]}>
                  <cylinderGeometry args={[0.21, 0.22, 0.36, 10]} />
                  <meshStandardMaterial color={occupied ? '#cbd5e1' : '#fff1f2'} roughness={0.6} />
                </mesh>
                {/* Chair Backrest (outer side facing away from table) */}
                <mesh position={[0, 0.56, -0.17]}>
                  <boxGeometry args={[0.34, 0.42, 0.07]} />
                  <meshStandardMaterial color={occupied ? '#94a3b8' : '#ffe4e6'} roughness={0.6} />
                </mesh>
                {/* Satin Chair Sash Bow */}
                <mesh position={[0, 0.54, -0.215]}>
                  <boxGeometry args={[0.26, 0.1, 0.04]} />
                  <meshStandardMaterial color={occupied ? '#64748b' : '#f43f5e'} roughness={0.45} />
                </mesh>
              </group>
            );
          })}
        </group>
      );
    }

    if (prefab.prefabType === 'PHOTO_FRAME_STAND') {
      const idx = photoIndexMap.get(prefab.instanceId) ?? 0;
      const photo = photos[idx] ?? null;
      return (
        <group
          position={[center.x, 0, center.z]}
          rotation={[0, rotY, 0]}
          onPointerOver={(e) => {
            e.stopPropagation();
            setPointerCursor(true);
          }}
          onPointerOut={() => setPointerCursor(false)}
          onClick={(e) => {
            e.stopPropagation();
            onOpenPhoto(photo, idx);
          }}
        >
          {/* Easel Legs */}
          <mesh position={[-0.25, 0.55, 0]} rotation={[0, 0, -0.12]}>
            <cylinderGeometry args={[0.03, 0.035, 1.15, 6]} />
            <meshStandardMaterial color="#78350f" roughness={0.7} />
          </mesh>
          <mesh position={[0.25, 0.55, 0]} rotation={[0, 0, 0.12]}>
            <cylinderGeometry args={[0.03, 0.035, 1.15, 6]} />
            <meshStandardMaterial color="#78350f" roughness={0.7} />
          </mesh>
          {/* Gold Frame */}
          <mesh position={[0, 0.96, 0]}>
            <boxGeometry args={[0.92, 1.1, 0.11]} />
            <meshStandardMaterial color="#d4af37" metalness={0.35} roughness={0.35} />
          </mesh>
          {/* Texture-mapped Photo Canvas */}
          <PhotoCanvasPlane url={photo?.publicUrl} />
          <SceneLabel position={[0, 1.72, 0]} center distanceFactor={12}>
            <button
              type="button"
              onClick={() => onOpenPhoto(photo, idx)}
              className="whitespace-nowrap rounded bg-white/95 px-2 py-0.5 text-[10px] font-semibold text-slate-800 shadow"
            >
              🖼️ {prefab.meta?.customLabel || `Ảnh #${idx + 1}`}
            </button>
          </SceneLabel>
        </group>
      );
    }

    if (prefab.prefabType === 'AISLE_CARPET_4X4') {
      return (
        <group position={[center.x, 0.015, center.z]} rotation={[-Math.PI / 2, 0, rotY]}>
          <mesh>
            <planeGeometry args={[2.0, 2.0]} />
            <meshStandardMaterial color={palette.carpet} roughness={0.8} />
          </mesh>
          <mesh position={[0.92, 0, 0.002]}>
            <planeGeometry args={[0.08, 2.0]} />
            <meshBasicMaterial color="#fde68a" />
          </mesh>
          <mesh position={[-0.92, 0, 0.002]}>
            <planeGeometry args={[0.08, 2.0]} />
            <meshBasicMaterial color="#fde68a" />
          </mesh>
        </group>
      );
    }

    if (prefab.prefabType === 'DECOR_FLOWER_PILLAR') {
      return (
        <group position={[center.x, 0, center.z]}>
          <mesh position={[0, 0.55, 0]}>
            <cylinderGeometry args={[0.24, 0.3, 1.1, 12]} />
            <meshStandardMaterial color="#fffbeb" roughness={0.5} />
          </mesh>
          <mesh position={[0, 1.25, 0]}>
            <sphereGeometry args={[0.42, 12, 12]} />
            <meshStandardMaterial color="#fb7185" roughness={0.55} />
          </mesh>
          <mesh position={[0.2, 1.38, 0.16]}>
            <sphereGeometry args={[0.18, 8, 8]} />
            <meshStandardMaterial color="#fecdd3" roughness={0.5} />
          </mesh>
        </group>
      );
    }

    return null;
  };

export const VenueScene: React.FC<VenueSceneProps> = (props) => {
  const { layout, tier, photos, localSessionId, players, npcs, bouquet, activeRitual, giftBurstKey, waypointTarget } =
    props;
  const [lowQuality, setLowQuality] = useState(false);
  const [clickMarker, setClickMarker] = useState<{ x: number; z: number } | null>(null);
  const targetPath = useRef<Array<{ x: number; z: number }>>([]);
  const localPosRef = useRef({
    x: 0,
    z: 10,
    rotY: Math.PI,
    isMoving: false,
    initialized: false,
  });
  const grid = useMemo(() => buildOccupancyGrid(layout), [layout]);
  const theme = getVenueTheme(layout.templateId);
  const isPreview = props.mode === 'preview';

  const localPlayer = players.find((p) => p.sessionId === localSessionId);

  const photoIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    let idx = 0;
    for (const p of layout.prefabs) {
      if (p.prefabType === 'PHOTO_FRAME_STAND') {
        map.set(p.instanceId, idx++);
      }
    }
    return map;
  }, [layout]);

      const navigateToWorld = useCallback(
        (destX: number, destZ: number) => {
          const start = localPosRef.current.initialized
            ? { x: localPosRef.current.x, z: localPosRef.current.z }
            : localPlayer
              ? { x: localPlayer.x, z: localPlayer.z }
              : { x: 0, z: 10 };
          const path = findGridPathAStar(grid, start, { x: destX, z: destZ });
          if (path.length > 0) {
            targetPath.current = path;
            const last = path[path.length - 1];
            setClickMarker(last);
          }
        },
        [grid, localPlayer]
      );

      useEffect(() => {
        if (!waypointTarget) return;
        navigateToWorld(waypointTarget.x, waypointTarget.z);
      }, [waypointTarget, navigateToWorld]);

      const handleFloorClick = useCallback(
        (point: THREE.Vector3) => {
          navigateToWorld(point.x, point.z);
        },
        [navigateToWorld]
      );

      return (
        <div className="relative h-full w-full">
          <SceneLabelsContext.Provider value={!isPreview}>
          <Canvas
            shadows={lowQuality ? false : 'soft'}
            dpr={lowQuality ? 1 : [1, 1.75]}
            camera={{
              position: isPreview ? (props.previewCamera?.position ?? [13, 9.5, 23]) : [0, 8.5, 17.5],
              fov: 50,
              near: 0.1,
              far: 5000,
            }}
            gl={{ preserveDrawingBuffer: true, antialias: !lowQuality }}
          >
            {/* Sky, sun with soft shadows, fill and image-based light */}
            <VenueAtmosphere theme={theme} quality={lowQuality ? 'low' : 'high'} />
            <ShadowCasters enabled={!lowQuality} />
            {!lowQuality && <PostFX strength={bloomStrength(theme)} />}
            {/* A still capture (no auto-rotate) must keep full quality however slow the renderer */}
            {isPreview && props.previewAutoRotate !== false && <FpsGuard onLowFps={setLowQuality} />}

            <VenueEnvironment theme={theme} />
            <AmbientPetals lowQuality={lowQuality} templateId={layout.templateId} />

            {/* 30m x 30m Hall Floor */}
            <mesh
              rotation={[-Math.PI / 2, 0, 0]}
              position={[0, 0, 0]}
              onClick={(e) => {
                if (isPreview) return;
                e.stopPropagation();
                handleFloorClick(e.point);
              }}
            >
              <planeGeometry args={[30, 30]} />
              <SurfaceMaterial color={theme.colors.f} theme={theme} role="floor" size={30} />
            </mesh>

            {/* Tap-to-Move Destination Ripple */}
            {clickMarker && (
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[clickMarker.x, 0.03, clickMarker.z]}>
                <ringGeometry args={[0.22, 0.34, 20]} />
                <meshBasicMaterial color="#f43f5e" transparent opacity={0.75} />
              </mesh>
            )}

            {/* Placed Smart Prefabs */}
            {layout.prefabs.map((prefab) => (
              <PrefabMesh
                key={prefab.instanceId}
                prefab={prefab}
                templateId={layout.templateId}
                tier={tier}
                photos={photos}
                photoIndexMap={photoIndexMap}
                players={players}
                onSitSeat={props.onSitSeat}
                onOpenGuestbook={props.onOpenGuestbook}
                onOpenGiftBox={props.onOpenGiftBox}
                onOpenVideo={props.onOpenVideo}
                onOpenPhoto={props.onOpenPhoto}
              />
            ))}

            {/* Auto-NPCs (Hidden when live taken over by Bride/Groom/MC) */}
            {npcs
              .filter((n) => !n.isTakenOver)
              .map((npc) => (
                <HumanAvatar
                  key={npc.npcId}
                  id={npc.npcId}
                  displayName={npc.displayName}
                  outfitId={npc.outfitId}
                  hairId={npc.npcId === 'BRIDE' ? 'hair_4' : 'hair_2'}
                  hairColor="#1f2937"
                  targetX={npc.x}
                  targetZ={npc.z}
                  targetRotY={npc.rotY}
                  anim={npc.anim}
                  bubbleText={npc.bubbleText}
                  isNpc
                  showLabel={!isPreview}
                  motion={props.motionStore}
                  motionKey={npcTrackKey(npc.npcId)}
                />
              ))}

            {/* Live Multiplayer Avatars */}
            {players.map((p) => {
              const dist = localPlayer ? Math.hypot(p.x - localPlayer.x, p.z - localPlayer.z) : 0;
              const showLabel = !isPreview && (!lowQuality || dist <= 18);
              const isMe = p.sessionId === localSessionId;
              return (
                <HumanAvatar
                  key={p.sessionId}
                  id={p.sessionId}
                  displayName={p.displayName}
                  side={p.side}
                  role={p.role}
                  outfitId={p.outfitId}
                  hairId={p.hairId}
                  hairColor={p.hairColor}
                  targetX={p.x}
                  targetZ={p.z}
                  targetRotY={p.rotY}
                  anim={p.anim}
                  hasBouquetCrown={p.hasBouquetCrown}
                  isSpeaking={p.isSpeaking}
                  bubbleText={p.bubbleText}
                  showLabel={showLabel}
                  isLocal={isMe}
                  liveLocalRef={isMe ? localPosRef : undefined}
                  motion={props.motionStore}
                  motionKey={p.sessionId}
                  isSeated={p.seatedTableNo >= 0}
                  onClick={
                    !isMe && props.onSelectPlayer
                      ? () => props.onSelectPlayer?.(p)
                      : undefined
                  }
                />
              );
            })}

            <BouquetArcMesh bouquet={bouquet} />
            <CelebrationParticles
              activeRitual={activeRitual}
              giftBurstKey={giftBurstKey}
              lowQuality={lowQuality}
            />

            {isPreview ? (
              <OrbitControls
                target={props.previewCamera?.target ?? [0, 2.5, -5]}
                enablePan={false}
                enableDamping
                dampingFactor={0.08}
                autoRotate={props.previewAutoRotate !== false}
                autoRotateSpeed={0.45}
                minDistance={props.previewCamera ? 0.5 : 12}
                maxDistance={46}
                minPolarAngle={props.previewCamera ? 0 : Math.PI * 0.12}
                maxPolarAngle={props.previewCamera ? Math.PI * 0.6 : Math.PI * 0.46}
              />
            ) : (
              <CameraRigAndController
                grid={grid}
                localPlayer={localPlayer}
                localPosRef={localPosRef}
                joystickInput={props.joystickInput}
                targetPath={targetPath}
                onArriveClickMarker={() => setClickMarker(null)}
                onMove={props.onMove}
                onFpsDrop={setLowQuality}
                registerCaptureFn={props.registerCaptureFn}
              />
            )}
          </Canvas>
          </SceneLabelsContext.Provider>
          {lowQuality && !isPreview && (
            <div className="pointer-events-none absolute left-3 top-14 rounded-full bg-slate-900/75 px-2.5 py-0.5 text-[10px] text-amber-300">
              Chế độ tiết kiệm đồ họa đang bật (FPS &lt; 28)
            </div>
          )}
        </div>
      );
    };
