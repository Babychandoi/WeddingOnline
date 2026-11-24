'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Html, OrbitControls, Splat } from '@react-three/drei';
import type { OrbitControls as OrbitControlsInstance } from 'three-stdlib';
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
import { Fireworks, type FireworksFocus, type ScheduledFireworks } from './Fireworks';
import { npcTrackKey, type MotionStore } from '@dco/shared';
import { GlbAssetMesh } from './GlbAssetMesh';
import { SurfaceMaterial, VenueEnvironment, VenueGate } from './venueKits';
import { getPhotoHallProfile } from './photoHallProfiles';
import {
  AisleRunner,
  BanquetTableDressing,
  ChampagneTower,
  ChiavariChair,
  EaselFrame,
  FloralPedestal,
  GiftTable,
  GuestbookLectern,
  RoseDome,
  StageDeck,
  hashString,
  naturalTone,
} from './realProps';
import { fabric } from './realMaterials';
import { FpsGuard, PostFX, RendererSetup, ShadowCasters, VenueAtmosphere, bloomStrength } from './venueAtmosphere';
import { GardenAltar, GardenCeremony } from './GardenCeremony';
import { GARDEN_VENUE } from './gardenReference';

/** In-scene HTML labels and buttons are hidden in the non-interactive venue preview */
const SceneLabelsContext = createContext(true);

class SceneCanvasBoundary extends React.Component<
  { children: React.ReactNode; bg: string },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: unknown) {
    console.error('[VenueScene] 3D render error', error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div
          className="grid h-full w-full place-items-center px-6 text-center text-sm text-white/90"
          style={{ backgroundColor: this.props.bg }}
        >
          <div className="max-w-sm rounded-2xl bg-slate-950/70 p-5 backdrop-blur">
            <p className="font-semibold">Không gian 3D tạm gặp sự cố hiển thị WebGL trên thiết bị này.</p>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false })}
              className="mt-3 rounded-full bg-rose-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-rose-700"
            >
              Thử tải lại cảnh 3D
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function SceneLabel(props: React.ComponentProps<typeof Html>) {
  // Labels stay under the hall's own panels and dialogs (z-20 and up); drei's default stacks them on top
  return useContext(SceneLabelsContext) ? <Html zIndexRange={[15, 0]} eps={0} {...props} /> : null;
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
  /** Realistic person (PEOPLE id); empty = stylised figure */
  personId?: string;
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
  /** Silenced by a host: no chat, no voice */
  isMuted?: boolean;
}

export interface RemoteNpcView {
  npcId: string;
  displayName: string;
  outfitId: string;
  isTakenOver: boolean;
  /** Real person the bride/groom appears as; empty = drawn figure */
  personId?: string;
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
  /** Paid fireworks shows to play (and recently played) */
  fireworks?: ScheduledFireworks[];
  registerCaptureFn?: (fn: () => string | null) => void;
  waypointTarget?: { x: number; z: number; key: number } | null;
  /**
   * 'preview': a look-only showcase of the venue (no walking, no in-scene buttons),
   * with the camera orbiting the hall; previewAutoRotate=false holds a still frame.
   */
  mode?: 'play' | 'preview';
  previewAutoRotate?: boolean;
  photoComposition?: boolean;
  /** Preview camera override (close-up stills) */
  previewCamera?: { position: [number, number, number]; target: [number, number, number] };
  /** Optional 3D Gaussian Splatting (.splat) environment URL */
  splatUrl?: string;
}

type AuditVector = [number, number, number];
type CaptureWindow = Window & {
  __venueScene?: THREE.Scene;
  __venueFrames?: number;
  __venueAudit?: {
    setView: (position: AuditVector, target: AuditVector) => void;
    getView: () => { position: AuditVector; target: AuditVector; frames: number };
  };
};

/** Still captures only: inspect multiple camera poses without reloading the hall. */
const FrameProbe: React.FC<{ orbit: React.RefObject<OrbitControlsInstance> }> = ({ orbit }) => {
  const { scene, camera } = useThree();
  useEffect(() => {
    const capture = window as CaptureWindow;
    capture.__venueScene = scene;
    capture.__venueFrames = 0;
    capture.__venueAudit = {
      setView(position, target) {
        const controls = orbit.current;
        if (!controls) return;
        controls.target.fromArray(target);
        camera.position.fromArray(position);
        controls.update();
      },
      getView: () => ({ position: camera.position.toArray(), target: orbit.current?.target.toArray() ?? [0, 0, 0], frames: capture.__venueFrames ?? 0 }),
    };
    return () => {
      capture.__venueScene = undefined;
      capture.__venueAudit = undefined;
      capture.__venueFrames = 0;
    };
  }, [scene, camera, orbit]);
  useFrame(() => {
    const w = window as CaptureWindow;
    w.__venueFrames = (w.__venueFrames ?? 0) + 1;
  });
  return null;
};

function GardenCameraFraming() {
  const { camera, size } = useThree();
  useEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;
    const aspect = size.width / Math.max(size.height, 1);
    camera.fov = THREE.MathUtils.lerp(52, 36, THREE.MathUtils.smoothstep(aspect, 0.45, 1.25));
    camera.updateProjectionMatrix();
  }, [camera, size.width, size.height]);
  return null;
}

const setPointerCursor = (active: boolean) => {
  if (typeof document !== 'undefined') {
    document.body.style.cursor = active ? 'pointer' : 'auto';
  }
};

function constrainHallCamera(position: THREE.Vector3, target: THREE.Vector3) {
  let fraction = 1;
  for (const axis of ['x', 'y', 'z'] as const) {
    const offset = position[axis] - target[axis];
    if (Math.abs(offset) < 1e-5) continue;
    const boundary = axis === 'y' ? (offset > 0 ? 6.9 : 0.55) : (offset > 0 ? 15.42 : -15.42);
    fraction = Math.min(fraction, (boundary - target[axis]) / offset);
  }
  if (fraction < 1) position.lerp(target, 1 - Math.max(fraction, 0));
}

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
  enclosed?: boolean;
  registerCaptureFn?: (fn: () => string | null) => void;
  /** While fireworks play the camera turns to the sky over the stage */
  focusRef?: React.MutableRefObject<FireworksFocus>;
}> = ({
  grid,
  localPlayer,
  localPosRef,
  joystickInput,
  targetPath,
  onArriveClickMarker,
  onMove,
  onFpsDrop,
  enclosed = false,
  registerCaptureFn,
  focusRef,
}) => {
    const { gl, scene, camera } = useThree();
    const keys = useRef<Set<string>>(new Set());
    const lastEmitTs = useRef(0);
    const wasMovingRef = useRef(false);
    const frameStats = useRef({ count: 0, elapsed: 0, low: false });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const controlsRef = useRef<any>(null);
    const camDirVec = useMemo(() => new THREE.Vector3(), []);
    /** Camera offset from the avatar before the show, to return to afterwards */
    const preShowOffset = useRef<THREE.Vector3 | null>(null);
    const wantTarget = useMemo(() => new THREE.Vector3(), []);
    const wantCam = useMemo(() => new THREE.Vector3(), []);

    useEffect(() => {
      if (!localPlayer) return;
      if (!localPosRef.current.initialized) {
        localPosRef.current.x = localPlayer.x;
        localPosRef.current.z = localPlayer.z;
        localPosRef.current.rotY = localPlayer.rotY;
        localPosRef.current.initialized = true;
        if (controlsRef.current) {
          controlsRef.current.target.set(localPlayer.x, 1.2, localPlayer.z);
          camera.position.set(localPlayer.x, enclosed ? 4.8 : 8.5, localPlayer.z + 7.5);
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
      enclosed,
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

      const safeDelta = Math.min(delta, 0.05);
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
        if (!preShowOffset.current) target.y = 1.2;
        camera.position.x += stepX;
        camera.position.z += stepZ;

        // Fireworks: turn to face the sky over the stage, low and looking up, then come back
        const focus = focusRef?.current;
        const px = localPosRef.current.x;
        const pz = localPosRef.current.z;
        if (focus?.active) {
          if (!preShowOffset.current) {
            preShowOffset.current = camera.position.clone().sub(target);
            controlsRef.current.maxPolarAngle = Math.PI * 0.72;
            controlsRef.current.minDistance = 3;
          }
          let dx = focus.x - px;
          let dz = focus.z - pz;
          const d = Math.hypot(dx, dz) || 1;
          dx /= d;
          dz /= d;
          const lookAhead = enclosed ? Math.min(4, d) : 4;
          wantTarget.set(px + dx * lookAhead, Math.min(5.2, focus.y), pz + dz * lookAhead);
          wantCam.set(px - dx * 5.2, 2.3, pz - dz * 5.2);
          const k = 1 - Math.exp(-safeDelta * 2.2);
          target.lerp(wantTarget, k);
          camera.position.lerp(wantCam, k);
        } else if (preShowOffset.current) {
          wantTarget.set(px, 1.2, pz);
          wantCam.copy(wantTarget).add(preShowOffset.current);
          if (enclosed) constrainHallCamera(wantCam, wantTarget);
          const k = 1 - Math.exp(-safeDelta * 2.6);
          target.lerp(wantTarget, k);
          camera.position.lerp(wantCam, k);
          if (camera.position.distanceTo(wantCam) < 0.05 && target.distanceTo(wantTarget) < 0.05) {
            target.copy(wantTarget);
            camera.position.copy(wantCam);
            preShowOffset.current = null;
            controlsRef.current.maxPolarAngle = Math.PI * 0.44;
            controlsRef.current.minDistance = enclosed ? 2.4 : 4.5;
          }
        }
        if (focus?.active || preShowOffset.current) {
          controlsRef.current.update();
        }
        if (enclosed) constrainHallCamera(camera.position, target);
        camera.updateMatrixWorld();
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
        minDistance={enclosed ? 2.4 : 4.5}
        maxDistance={enclosed ? 13 : 21}
        minPolarAngle={Math.PI * (enclosed ? 0.37 : 0.16)}
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

const PhotoCanvasPlane: React.FC<{ url?: string; width?: number; height?: number; glow?: boolean }> = ({ url, width = 0.78, height = 0.96, glow = false }) => {
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
        // Cover-fit: crop the photo to the frame's shape instead of stretching it
        const img = tex.image as { width?: number; height?: number } | undefined;
        if (img?.width && img?.height) {
          const photoAspect = img.width / img.height;
          const frameAspect = width / height;
          if (photoAspect > frameAspect) {
            tex.repeat.set(frameAspect / photoAspect, 1);
            tex.offset.set((1 - tex.repeat.x) / 2, 0);
          } else {
            tex.repeat.set(1, photoAspect / frameAspect);
            tex.offset.set(0, (1 - tex.repeat.y) / 2);
          }
        }
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
  }, [url, width, height]);

  return (
    // A printed photo behind the frame's window: lit like paper, with a faint satin sheen
    <mesh position={[0, 0, 0.012]}>
      <planeGeometry args={[width, height]} />
      {texture && glow ? (
        // The LED wall shows the photo by its own light
        <meshStandardMaterial map={texture} emissiveMap={texture} emissive="#ffffff" emissiveIntensity={0.85} roughness={0.3} toneMapped={false} />
      ) : texture ? (
        <meshPhysicalMaterial map={texture} roughness={0.45} clearcoat={0.4} clearcoatRoughness={0.2} />
      ) : (
        <meshStandardMaterial color={url ? '#f3dfe3' : '#ece6dc'} roughness={0.8} />
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

/** 'none' in a spot's mediaSlotId = the couple chose to show no photo there */
const NO_PHOTO = 'none';

const DEFAULT_SHOWCASE_PHOTOS: PhotoAssetRecord[] = [
  {
    id: 'showcase_1',
    weddingId: 'showcase',
    uploaderId: 'showcase',
    type: 'PRE_WEDDING_GALLERY',
    r2ObjectKey: 'invitation-samples/ao-dai-gate.webp',
    publicUrl: '/invitation-samples/ao-dai-gate.webp',
    caption: 'Khoảnh khắc hạnh phúc ngày chung đôi',
    hasWatermark: false,
    displayOrder: 1,
    createdAt: '2026-11-18T00:00:00.000Z',
  },
  {
    id: 'showcase_2',
    weddingId: 'showcase',
    uploaderId: 'showcase',
    type: 'PRE_WEDDING_GALLERY',
    r2ObjectKey: 'invitation-samples/ao-dai-arch.webp',
    publicUrl: '/invitation-samples/ao-dai-arch.webp',
    caption: 'Áo dài truyền thống Việt Nam',
    hasWatermark: false,
    displayOrder: 2,
    createdAt: '2026-11-18T00:00:00.000Z',
  },
  {
    id: 'showcase_3',
    weddingId: 'showcase',
    uploaderId: 'showcase',
    type: 'PRE_WEDDING_GALLERY',
    r2ObjectKey: 'invitation-samples/aodai-arch-pastel.webp',
    publicUrl: '/invitation-samples/aodai-arch-pastel.webp',
    caption: 'Trăm năm tình viên mãn',
    hasWatermark: false,
    displayOrder: 3,
    createdAt: '2026-11-18T00:00:00.000Z',
  },
  {
    id: 'showcase_4',
    weddingId: 'showcase',
    uploaderId: 'showcase',
    type: 'PRE_WEDDING_GALLERY',
    r2ObjectKey: 'invitation-samples/ao-dai-red.webp',
    publicUrl: '/invitation-samples/ao-dai-red.webp',
    caption: 'Bạc đầu nghĩa phu thê',
    hasWatermark: false,
    displayOrder: 4,
    createdAt: '2026-11-18T00:00:00.000Z',
  },
  {
    id: 'showcase_5',
    weddingId: 'showcase',
    uploaderId: 'showcase',
    type: 'PRE_WEDDING_GALLERY',
    r2ObjectKey: 'invitation-samples/bouquet-veil.webp',
    publicUrl: '/invitation-samples/bouquet-veil.webp',
    caption: 'Ngày chung đôi',
    hasWatermark: false,
    displayOrder: 5,
    createdAt: '2026-11-18T00:00:00.000Z',
  },
];

/** The photo for a spot: the one the couple picked, else the wedding gallery in order (falling back to real showcase photos when empty) */
function spotPhoto(prefab: PlacedPrefab, photos: PhotoAssetRecord[], fallbackIndex: number | null): { photo: PhotoAssetRecord | null; index: number } {
  const slot = prefab.meta?.mediaSlotId;
  if (slot === NO_PHOTO) return { photo: null, index: -1 };
  if (slot) {
    const i = photos.findIndex((p) => p.id === slot);
    if (i >= 0) return { photo: photos[i], index: i };
  }
  if (fallbackIndex === null) return { photo: null, index: -1 };
  const gallery = photos.filter((p) => p.type === 'PRE_WEDDING_GALLERY');
  const pool = gallery.length > 0 ? gallery : DEFAULT_SHOWCASE_PHOTOS;
  const pick = pool[fallbackIndex % pool.length] ?? null;
  return { photo: pick, index: pick && gallery.length > 0 ? photos.indexOf(pick) : fallbackIndex };
}

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
    const seed = hashString(prefab.instanceId);
    // Real flower colours drawn from the theme: its petal tone, a softened accent, ivory
    const flowers = useMemo(() => {
      const petal = theme.colors.pe || naturalTone(theme.colors.a, 0.45, 0.35);
      return [naturalTone(petal, 0.1, 0.2), naturalTone(theme.colors.a, 0.3, 0.3), '#f7f1e6', '#f3d7dc', naturalTone(petal, 0.35, 0.3)];
    }, [theme.colors.pe, theme.colors.a]);
    const tableLinen = useMemo(() => fabric('#f7f3ec', 'linen'), []);

    if (prefab.prefabType === 'STAGE_MAIN') {
      const screen = spotPhoto(prefab, photos, 0).photo;
      if (templateId === GARDEN_VENUE) return (
        <group position={[center.x, 0, center.z]} rotation={[0, rotY, 0]}>
          <GardenAltar>
            {screen && (
              <group position={[0, 1.72, -0.49]}>
                <PhotoCanvasPlane url={screen.publicUrl} width={2.38} height={1.32} />
              </group>
            )}
            <SceneLabel position={[0, screen ? 2.04 : 0.89, 0.92]} center distanceFactor={14}>
              <button type="button" onClick={onOpenVideo} className="whitespace-nowrap rounded-xl bg-rose-700 px-3 py-2 text-xs font-bold text-white shadow hover:bg-rose-600">
                Xem video lễ cưới
              </button>
            </SceneLabel>
          </GardenAltar>
        </group>
      );
      return (
        <group position={[center.x, 0, center.z]} rotation={[0, rotY, 0]}>
          {/* Carpeted stage deck, steps, pleated velvet backdrop and swag valance */}
          <StageDeck curtain={theme.colors.cu} carpetColor={naturalTone(palette.carpet, 0.05, 0.15)} />
          {/* Florist arrangements framing the stage */}
          {[-2.55, 2.55].map((x) => (
            <group key={x} position={[x, 0.42, 1.45]}>
              <RoseDome radius={0.34} palette={flowers} seed={Math.round(x * 10) + 7} minY={-0.05} />
            </group>
          ))}
          {[-2.75, 2.75].map((x) => (
            <group key={`b${x}`} position={[x, 0.42, -1.45]}>
              <RoseDome radius={0.42} palette={flowers} seed={Math.round(x * 10) + 11} minY={-0.05} />
            </group>
          ))}

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
              <boxGeometry args={[4.5, 2.35, 0.12]} />
              <meshStandardMaterial color="#e3b65c" metalness={1} roughness={0.25} />
            </mesh>
            {screen ? (
              // The couple's photo on the LED wall
              <group position={[0, 0, 0.053]}>
                <PhotoCanvasPlane url={screen.publicUrl} width={4.2} height={2.08} glow />
              </group>
            ) : (
              // Switched-off LED wall: near-black glass that still mirrors the room
              <mesh position={[0, 0, 0.065]}>
                <planeGeometry args={[4.2, 2.08]} />
                <meshPhysicalMaterial color="#0b0d18" roughness={0.12} clearcoat={1} clearcoatRoughness={0.05} emissive="#141a3a" emissiveIntensity={0.35} />
              </mesh>
            )}
            <SceneLabel position={[0, screen ? -0.82 : 0, 0.16]} center distanceFactor={14}>
              <button
                type="button"
                onClick={onOpenVideo}
                className={`whitespace-nowrap rounded-xl border border-amber-300/70 bg-rose-600/95 font-bold text-white shadow-lg hover:bg-rose-500 ${screen ? 'px-2.5 py-1 text-[10px]' : 'px-3.5 py-2 text-xs'}`}
              >
                {screen ? '▶ Video lễ cưới' : '▶ XEM VIDEO / LIVESTREAM LỄ CƯỚI'}
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

          {/* Coupe champagne tower on a silver tray */}
          <group position={[1.7, 0.45, 0.9]}>
            <mesh position={[0, 0.3, 0]}>
              <cylinderGeometry args={[0.36, 0.42, 0.6, 32]} />
              <primitive object={tableLinen} attach="material" />
            </mesh>
            <group position={[0, 0.63, 0]}>
              <ChampagneTower />
            </group>
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

          {(() => {
            const welcome = prefab.meta?.mediaSlotId ? spotPhoto(prefab, photos, null) : null;
            if (!welcome?.photo) return null;
            return (
              <group
                position={[2.3, 0, -1.1]}
                rotation={[0, -0.35, 0]}
                onPointerOver={(e) => {
                  e.stopPropagation();
                  setPointerCursor(true);
                }}
                onPointerOut={() => setPointerCursor(false)}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenPhoto(welcome.photo, welcome.index);
                }}
              >
                {/* Welcome board: a large portrait print on an easel */}
                <group scale={1.3}>
                  <EaselFrame>
                    <PhotoCanvasPlane url={welcome.photo.publicUrl} />
                  </EaselFrame>
                </group>
                <SceneLabel position={[0, 2.2, 0]} center>
                  <div className="pointer-events-none whitespace-nowrap rounded bg-white/95 px-2 py-0.5 text-[10px] font-semibold text-rose-800 shadow">
                    💐 {prefab.meta?.customLabel || 'Chào mừng đến lễ cưới'}
                  </div>
                </SceneLabel>
              </group>
            );
          })()}

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
            <GuestbookLectern />
            <SceneLabel position={[0, 1.55, 0]} center>
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
          {/* Linen-draped gift table with wrapped presents and a glass card box */}
          <GiftTable accent={naturalTone(palette.accent, 0.2, 0.25)} />
          <SceneLabel position={[0, 1.75, 0]} center>
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
      const radius = prefab.prefabType === 'BANQUET_TABLE_10' ? 0.9 : 0.76;

      return (
        <group>
          <group position={[center.x, 0, center.z]}>
            {/* Floor-length linen, full place settings, rose and candle centrepiece */}
            <BanquetTableDressing
              radius={radius}
              seatCount={seats.length}
              linen="#fbf9f5"
              napkin={naturalTone(palette.accent, 0.25, 0.3)}
              flowers={flowers}
              seed={seed}
            />
            <SceneLabel position={[0, 1.52, 0]} center>
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
                {/* Chiavari chair: cushion greys out when the seat is taken */}
                <ChiavariChair
                  occupied={occupied}
                  cushion="#f5efe6"
                  sash={naturalTone(palette.accent, 0.35, 0.25)}
                  frame={theme.mood === 'indoor' || theme.mood === 'night' ? 'gold' : 'white'}
                />
              </group>
            );
          })}
        </group>
      );
    }

    if (prefab.prefabType === 'PHOTO_FRAME_STAND') {
      const spot = spotPhoto(prefab, photos, photoIndexMap.get(prefab.instanceId) ?? 0);
      const photo = spot.photo;
      const idx = spot.index;
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
          <EaselFrame>
            <PhotoCanvasPlane url={photo?.publicUrl} />
          </EaselFrame>
          <SceneLabel position={[0, 1.72, 0]} center>
            <button
              type="button"
              onClick={() => onOpenPhoto(photo, idx)}
              className="whitespace-nowrap rounded bg-white/95 px-2 py-0.5 text-[10px] font-semibold text-slate-800 shadow"
            >
              🖼️ {prefab.meta?.customLabel || `Ảnh #${(photoIndexMap.get(prefab.instanceId) ?? 0) + 1}`}
            </button>
          </SceneLabel>
        </group>
      );
    }

    if (prefab.prefabType === 'AISLE_CARPET_4X4') {
      return (
        <group position={[center.x, 0.012, center.z]} rotation={[-Math.PI / 2, 0, rotY]}>
          <AisleRunner color={naturalTone(palette.carpet, 0.04, 0.15)} seed={seed} />
        </group>
      );
    }

    if (prefab.prefabType === 'DECOR_FLOWER_PILLAR') {
      return (
        <group position={[center.x, 0, center.z]}>
          <FloralPedestal flowers={flowers} seed={seed} />
        </group>
      );
    }

    return null;
  };

export const VenueScene: React.FC<VenueSceneProps> = (props) => {
  const { layout, tier, photos, localSessionId, players, npcs, bouquet, activeRitual, giftBurstKey, waypointTarget } =
    props;
  const [autoLowQuality, setAutoLowQuality] = useState(false);
  const [qualityPreset, setQualityPreset] = useState<'auto' | 'high' | 'low'>('auto');
  const lowQuality = qualityPreset === 'low' ? true : qualityPreset === 'high' ? false : autoLowQuality;
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
  const fireworksFocusRef = useRef<FireworksFocus>({ active: false, x: 0, y: 15, z: -18 });
  const fireworksStage = useMemo(() => {
    const st = layout.prefabs.find((p) => p.prefabType === 'STAGE_MAIN');
    const c = st ? getPrefabCenterWorld(st) : { x: 0, z: -12 };
    return { x: c.x, z: c.z, rotY: st ? (st.rotationDeg * Math.PI) / 180 : 0 };
  }, [layout.prefabs]);
  const isPreview = props.mode === 'preview';
  const photoComposition = isPreview && theme.id === GARDEN_VENUE && props.photoComposition === true;
  const photoHall = getPhotoHallProfile(theme.id);
  const terrainFloor = Boolean(photoHall?.terrain && ['grass', 'sand', 'snow'].includes(photoHall.floor));
  const enclosed = photoHall?.architecture === 'ballroom';
  const previewOrbit = useRef<OrbitControlsInstance>(null);
  const boundPreview = enclosed && !props.previewCamera;
  const keepPreviewInside = useCallback(() => {
    const controls = previewOrbit.current;
    if (!boundPreview || !controls) return;
    const { target, object } = controls;
    target.x = THREE.MathUtils.clamp(target.x, -14.7, 14.7);
    target.y = THREE.MathUtils.clamp(target.y, 0.65, 6.5);
    target.z = THREE.MathUtils.clamp(target.z, -14.7, 14.7);
    constrainHallCamera(object.position, target);
    object.lookAt(target);
  }, [boundPreview]);
  const indoorPreview = theme.mood === 'indoor';
  const previewPosition: [number, number, number] = props.previewCamera?.position ?? (
    enclosed ? [4.7, 4.55, 12.5] : photoHall ? [10.5, 8.6, 22.4] : indoorPreview ? [5.8, 4.8, 18.2] : [13, 9.5, 23]
  );
  const previewTarget: [number, number, number] = props.previewCamera?.target ?? (enclosed ? [0, 2.6, -0.5] : indoorPreview ? [0, 2.0, -4.8] : [0, 2.5, -5]);

  const localPlayer = players.find((p) => p.sessionId === localSessionId);
  const localPlayerRef = useRef(localPlayer);
  localPlayerRef.current = localPlayer;
  const lastWaypointKeyRef = useRef<number | null>(null);

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
      const lp = localPlayerRef.current;
      const start = localPosRef.current.initialized
        ? { x: localPosRef.current.x, z: localPosRef.current.z }
          : lp
            ? { x: lp.x, z: lp.z }
            : { x: 0, z: 10 };
      const path = findGridPathAStar(grid, start, { x: destX, z: destZ });
      if (path.length > 0) {
        targetPath.current = path;
        const last = path[path.length - 1];
        setClickMarker(last);
      }
    },
    [grid]
  );

  useEffect(() => {
    if (!waypointTarget || lastWaypointKeyRef.current === waypointTarget.key) return;
    lastWaypointKeyRef.current = waypointTarget.key;
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
      <SceneCanvasBoundary bg={theme.colors.s}>
        <SceneLabelsContext.Provider value={!isPreview}>
          <Canvas
            shadows={lowQuality ? false : qualityPreset === 'high' ? 'soft' : true}
            dpr={lowQuality ? 1 : qualityPreset === 'high' ? [1, 1.75] : [1, 1.25]}
            camera={{
              position: isPreview ? previewPosition : [0, 8.5, 17.5],
              fov: photoComposition ? 36 : 50,
              near: 0.1,
              far: 2000,
            }}
            gl={{ preserveDrawingBuffer: true, antialias: !lowQuality, powerPreference: 'high-performance' }}
            fallback={
              <div className="grid h-full w-full place-items-center px-6 text-center text-sm text-white/90" style={{ backgroundColor: theme.colors.s }}>
                Thiết bị này chưa hỗ trợ WebGL để hiển thị sảnh cưới 3D.
              </div>
            }
          >
          {/* Sky, sun with soft shadows, fill and image-based light */}
          <RendererSetup exposure={(photoHall ? photoHall.light === 'night' || photoHall.light === 'twilight' : theme.mood === 'night') ? 1.15 : 1.05} />
          {/* Run CameraRigAndController FIRST before all PrefabMesh & HumanAvatar so every 3D mesh and <Html> label projects with the exact same frame's camera matrix */}
          {!isPreview && (
            <CameraRigAndController
              grid={grid}
              localPlayer={localPlayer}
              localPosRef={localPosRef}
              joystickInput={props.joystickInput}
              targetPath={targetPath}
              onArriveClickMarker={() => setClickMarker(null)}
              onMove={props.onMove}
              onFpsDrop={setAutoLowQuality}
              enclosed={enclosed}
              registerCaptureFn={props.registerCaptureFn}
              focusRef={fireworksFocusRef}
            />
          )}
          <VenueAtmosphere theme={theme} quality={lowQuality ? 'low' : 'high'} reference={photoHall} />
          <ShadowCasters enabled={!lowQuality} />
          {!lowQuality && (qualityPreset === 'high' || (isPreview && props.previewAutoRotate === false)) && (
            <PostFX strength={photoComposition ? 0.12 : bloomStrength(theme, photoHall)} ambientOcclusion={!photoComposition && qualityPreset === 'high'} />
          )}
          {/* Monitor FPS in live hall and auto-preview so slower GPUs drop to light mode automatically */}
          {qualityPreset === 'auto' && !(isPreview && props.previewAutoRotate === false) && <FpsGuard onLowFps={setAutoLowQuality} />}
          {isPreview && props.previewAutoRotate === false && <FrameProbe orbit={previewOrbit} />}

          <VenueEnvironment theme={theme} photoComposition={photoComposition} reference={photoHall} />
          {props.splatUrl && <Splat src={props.splatUrl} position={[0, 0, 0]} scale={1} />}
          {photoComposition ? <><GardenCameraFraming /><GardenCeremony /></> : <AmbientPetals lowQuality={lowQuality} templateId={layout.templateId} />}

          {/* Keep furniture grounded if Auto drops the live shadow map. This map bakes once. */}
          {!photoComposition && (!lowQuality || (photoHall && qualityPreset === 'auto')) && (
            <ContactShadows
              position={[0, 0.004, 0]}
              opacity={theme.mood === 'night' || theme.mood === 'indoor' ? 0.48 : 0.36}
              scale={32}
              blur={1.9}
              far={4.2}
              resolution={photoHall && qualityPreset === 'auto' ? 128 : 256}
              color={theme.mood === 'night' ? '#09080c' : '#261e18'}
              frames={1}
            />
          )}

          {/* 30m x 30m Hall Floor */}
          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, 0, 0]}
            userData={{ noCastShadow: terrainFloor }}
            onClick={(e) => {
              if (isPreview) return;
              e.stopPropagation();
              handleFloorClick(e.point);
            }}
          >
            <planeGeometry args={[30, 30]} />
            {terrainFloor ? <meshBasicMaterial colorWrite={false} depthWrite={false} />
              : <SurfaceMaterial color={theme.colors.f} theme={theme} role="floor" size={30} reference={photoHall} />}
          </mesh>

          {/* Tap-to-Move Destination Ripple */}
          {clickMarker && (
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[clickMarker.x, 0.03, clickMarker.z]}>
              <ringGeometry args={[0.22, 0.34, 20]} />
              <meshBasicMaterial color="#f43f5e" transparent opacity={0.75} />
            </mesh>
          )}

          {/* Placed Smart Prefabs */}
          {!photoComposition && layout.prefabs.map((prefab) => (
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
                personId={npc.personId}
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
                personId={p.personId}
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
          {!isPreview && props.fireworks && props.fireworks.length > 0 && (
            <Fireworks shows={props.fireworks} stage={fireworksStage} focusRef={fireworksFocusRef} lowQuality={lowQuality} mood={theme.mood} enclosed={enclosed} />
          )}

          {isPreview && (
            <OrbitControls
              ref={previewOrbit}
              target={previewTarget}
              enablePan={Boolean(photoHall)}
              zoomToCursor={Boolean(photoHall)}
              screenSpacePanning={!photoHall}
              panSpeed={0.65}
              onChange={keepPreviewInside}
              enableDamping
              dampingFactor={0.08}
              autoRotate={!photoComposition && !photoHall && props.previewAutoRotate !== false}
              autoRotateSpeed={0.45}
              minDistance={props.previewCamera ? 0.5 : photoHall ? 2.15 : 12}
              maxDistance={enclosed && !props.previewCamera ? 14.6 : 46}
              minPolarAngle={props.previewCamera ? 0 : Math.PI * (enclosed ? 0.42 : 0.12)}
              maxPolarAngle={props.previewCamera ? Math.PI * 0.6 : Math.PI * (photoHall ? 0.492 : 0.46)}
            />
          )}
          </Canvas>
        </SceneLabelsContext.Provider>
      </SceneCanvasBoundary>
      {!isPreview && (
        <div className="pointer-events-auto absolute left-3 top-14 z-10 flex items-center gap-1 rounded-full border border-white/15 bg-slate-900/75 px-2.5 py-1 text-[10px] font-medium text-slate-200 shadow backdrop-blur-sm sm:bottom-3 sm:top-auto">
          <span className="text-slate-400">Đồ họa:</span>
          {(['auto', 'high', 'low'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setQualityPreset(mode)}
              className={`rounded-full px-2 py-0.5 transition ${qualityPreset === mode
                  ? 'bg-rose-600 font-bold text-white'
                  : 'text-slate-300 hover:bg-white/10'
                }`}
            >
              {mode === 'auto' ? (autoLowQuality ? 'Tự động (Nhẹ)' : 'Tự động') : mode === 'high' ? 'Cao (Photoreal)' : 'Tiết kiệm pin'}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
