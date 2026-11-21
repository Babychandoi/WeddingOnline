'use client';

/**
 * A realistic person (Microsoft Rocketbox, MIT) with real skin, hair, clothes and motion-
 * captured animation: idle breathing, walking, sitting on a chair, waving, clapping,
 * cheering, drinking. The body plays whichever clip matches what the guest is doing, with
 * soft cross-fades; the walk speeds up and slows down with the guest's actual speed.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { PEOPLE, type PersonInfo } from '@dco/shared';
import { loadGltfCached } from './GlbAssetMesh';
import { IS_HANDHELD } from './deviceTier';
import { detailNormal, detailRoughness } from './pbr';

export const PEOPLE_BASE = '/assets/people';
export const personUrl = (id: string) => `${PEOPLE_BASE}/${id}.glb`;
export const personThumb = (id: string) => `${PEOPLE_BASE}/${id}.webp`;

export function personInfo(id: string | undefined | null): PersonInfo | null {
  return (id && PEOPLE.find((p) => p.id === id)) || null;
}

/** Live values the avatar's movement code writes and the body reads each frame */
export interface PersonMotion {
  /** 0 standing … 1 walking */
  walk: number;
  /** Metres per second */
  speed: number;
}

/** Walking speed the walk clip was captured at (m/s) */
const WALK_CLIP_SPEED = 1.35;

type ClipName = 'idle' | 'walk' | 'sit' | 'wave' | 'clap' | 'cheers' | 'drink';

/**
 * How many different people one page downloads (~0.7 MB each). Past the budget, guests who
 * picked someone not yet loaded keep the stylised figure, so a full hall stays light on phones.
 */
const MODEL_BUDGET = IS_HANDHELD ? 10 : 36;
const admitted = new Set<string>();
function admit(id: string, priority: boolean): boolean {
  if (admitted.has(id)) return true;
  if (priority) {
    admitted.add(id);
    return true;
  }
  if (admitted.size >= MODEL_BUDGET) return false;
  admitted.add(id);
  return true;
}

function useRig(id: string, body: 'f' | 'm', priority: boolean) {
  const [rig, setRig] = useState<{ scene: THREE.Group; clips: THREE.AnimationClip[] } | null>(null);
  useEffect(() => {
    let alive = true;
    setRig(null);
    if (!admit(id, priority)) return;
    Promise.all([loadGltfCached(personUrl(id)), loadGltfCached(`${PEOPLE_BASE}/anim_${body}.glb`)])
      .then(([person, anim]) => alive && setRig({ scene: person.scene, clips: anim.animations }))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [id, body, priority]);
  return rig;
}

/**
 * The person's body. Renders `fallback` until the files load (or if they are missing).
 * `anim` is the server's action (idle, wave, clap, cheers, sit…), `seated` whether they are
 * on a chair, `motion` the live walking state.
 */
export function RealPerson({
  id,
  anim,
  seated,
  motion,
  fallback = null,
  castShadow = true,
  attire = 'none',
  priority = false,
}: {
  id: string;
  anim: string;
  seated: boolean;
  motion: React.MutableRefObject<PersonMotion>;
  fallback?: React.ReactNode;
  castShadow?: boolean;
  /** 'gown' dresses the person as the bride: full ivory skirt, veil and tiara */
  attire?: 'none' | 'gown';
  /** The couple always load, whatever the page's model budget */
  priority?: boolean;
}) {
  const info = personInfo(id);
  const body = info?.body ?? 'f';
  const rig = useRig(id, body, priority);

  const { object, mixer, actions, lifeBones } = useMemo(() => {
    if (!rig) return { object: null, mixer: null, actions: null, lifeBones: null };
    const obj = cloneSkinned(rig.scene) as THREE.Group;
    const microNorm = detailNormal('micro');
    const fabricNorm = detailNormal('fabric');
    const fabricRough = detailRoughness('fabric');

    obj.traverse((o) => {
      const m = o as THREE.SkinnedMesh;
      if (!m.isMesh) return;
      m.castShadow = castShadow;
      m.receiveShadow = true;
      m.frustumCulled = false; // skinned bounds do not follow the animation
      m.userData.realPerson = true;

      const upgradeMat = (mat: THREE.Material): THREE.Material => {
        const sm = mat as THREE.MeshStandardMaterial;
        if (!sm.isMeshStandardMaterial) return mat;
        const label = `${m.name} ${sm.name}`.toLowerCase();
        const isEye = label.includes('eye') || label.includes('cornea') || label.includes('teeth');
        const isHair = label.includes('hair') || label.includes('brow') || label.includes('lash');
        const isSkin =
          label.includes('skin') ||
          label.includes('head') ||
          label.includes('body') ||
          label.includes('face') ||
          label.includes('hand') ||
          (!isEye && !isHair && !label.includes('cloth') && !label.includes('shirt') && !label.includes('pant') && !label.includes('dress') && !label.includes('shoe'));

        if (IS_HANDHELD) {
          sm.envMapIntensity = isEye ? 1.35 : 0.95;
          sm.roughness = isEye ? 0.12 : isSkin ? 0.54 : 0.72;
          return sm;
        }

        const phys = new THREE.MeshPhysicalMaterial({
          name: sm.name,
          color: sm.color,
          map: sm.map,
          normalMap: sm.normalMap ?? (isSkin ? microNorm : isEye ? null : fabricNorm),
          normalScale: sm.normalMap ? sm.normalScale : new THREE.Vector2(isSkin ? 0.12 : 0.22, isSkin ? 0.12 : 0.22),
          roughnessMap: sm.roughnessMap ?? (!isSkin && !isEye ? fabricRough : null),
          roughness: isEye ? 0.08 : isHair ? 0.46 : isSkin ? 0.52 : 0.76,
          metalness: isEye ? 0.02 : sm.metalness * 0.4,
          alphaMap: sm.alphaMap,
          transparent: sm.transparent,
          opacity: sm.opacity,
          alphaTest: sm.alphaTest,
          side: sm.side,
          // Warm subcutaneous sheen for human skin; soft fabric sheen for garments
          sheen: isEye ? 0 : isSkin ? 0.38 : isHair ? 0.25 : 0.55,
          sheenColor: isSkin ? new THREE.Color('#ffcab8') : new THREE.Color('#fff9f2'),
          sheenRoughness: isSkin ? 0.48 : 0.65,
          // Natural sebaceous micro-gloss on skin, crisp wet corneal reflection on eyes
          clearcoat: isEye ? 1.0 : isSkin ? 0.09 : isHair ? 0.15 : 0,
          clearcoatRoughness: isEye ? 0.04 : 0.38,
          envMapIntensity: isEye ? 1.55 : isSkin ? 0.95 : 0.88,
        });
        return phys;
      };

      m.material = Array.isArray(m.material) ? m.material.map(upgradeMat) : upgradeMat(m.material);
    });

    const mx = new THREE.AnimationMixer(obj);
    const acts = new Map<ClipName, THREE.AnimationAction>();
    rig.clips.forEach((clip) => {
      const a = mx.clipAction(clip);
      a.setLoop(THREE.LoopRepeat, Infinity);
      acts.set(clip.name as ClipName, a);
    });
    const bones = {
      head: obj.getObjectByName('Bip01_Head'),
      neck: obj.getObjectByName('Bip01_Neck'),
      spine: obj.getObjectByName('Bip01_Spine1') ?? obj.getObjectByName('Bip01_Spine'),
    };
    return { object: obj, mixer: mx, actions: acts, lifeBones: bones };
  }, [rig, castShadow]);

  const current = useRef<ClipName | null>(null);
  const phase = useRef(Math.random() * 10);

  useEffect(() => {
    if (!mixer || !actions) return;
    // Start each person somewhere different in the idle loop, so a crowd does not breathe in sync
    const idle = actions.get('idle');
    if (idle) {
      idle.play();
      idle.time = phase.current % idle.getClip().duration;
      current.current = 'idle';
    }
    return () => {
      mixer.stopAllAction();
    };
  }, [mixer, actions]);

  useFrame((_, dt) => {
    if (!mixer || !actions) return;
    const m = motion.current;
    let want: ClipName = 'idle';
    if (seated) want = 'sit';
    else if (m.walk > 0.5) want = 'walk';
    else if (anim === 'wave' || anim === 'clap' || anim === 'cheers') want = anim;
    else if (anim === 'jump_catch') want = 'cheers';
    else if (anim === 'drink') want = 'drink';
    if (!actions.has(want)) want = 'idle';

    if (want !== current.current) {
      const next = actions.get(want)!;
      const prev = current.current ? actions.get(current.current) : undefined;
      next.reset().setEffectiveWeight(1).play();
      if (prev) prev.crossFadeTo(next, want === 'walk' || current.current === 'walk' ? 0.25 : 0.4, false);
      current.current = want;
    }
    const walk = actions.get('walk');
    if (walk) walk.timeScale = THREE.MathUtils.clamp(m.speed / WALK_CLIP_SPEED, 0.6, 1.8);
    mixer.update(Math.min(dt, 0.1));

    // Living micro-motion: subtle desynchronized head gaze, neck tilt and breathing posture
    if (lifeBones && want !== 'walk') {
      const t = performance.now() * 0.001 + phase.current * 3.7;
      if (lifeBones.head) {
        lifeBones.head.rotation.y += Math.sin(t * 0.55) * 0.085 + Math.sin(t * 1.2) * 0.025;
        lifeBones.head.rotation.z += Math.cos(t * 0.42) * 0.035;
      }
      if (lifeBones.neck) {
        lifeBones.neck.rotation.y += Math.sin(t * 0.55) * 0.04;
      }
      if (lifeBones.spine) {
        lifeBones.spine.rotation.x += Math.sin(t * 1.45) * 0.018;
      }
    }
  });

  if (!object) return <>{fallback}</>;
  if (attire === 'gown') {
    return (
      <group>
        <primitive object={object} />
        <BridalGown person={object} />
      </group>
    );
  }
  return <primitive object={object} />;
}

/* ───────────────────────── Bridal gown ───────────────────────── */

let gownGeo: { skirt: THREE.LatheGeometry; tulle: THREE.LatheGeometry; veil: THREE.CylinderGeometry; tiara: THREE.TorusGeometry; sash: THREE.TorusGeometry } | null = null;
let gownMat: { satin: THREE.MeshPhysicalMaterial; tulle: THREE.MeshPhysicalMaterial; veil: THREE.MeshPhysicalMaterial; gold: THREE.MeshStandardMaterial } | null = null;

/** Ball-gown silhouette for a unit-height skirt: waist at y=0, hem at y=-1 (drawn bottom → top) */
function skirtProfile(waist: number, hem: number): THREE.Vector2[] {
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= 18; i++) {
    const t = i / 18; // 0 hem … 1 waist
    const flare = Math.pow(1 - t, 1.6);
    pts.push(new THREE.Vector2(waist + (hem - waist) * flare + Math.sin(t * Math.PI) * 0.03, -1 + t));
  }
  return pts;
}

function gownParts() {
  if (!gownGeo) {
    gownGeo = {
      skirt: new THREE.LatheGeometry(skirtProfile(0.15, 0.62), 48),
      tulle: new THREE.LatheGeometry(skirtProfile(0.165, 0.68), 48),
      // Open half-cone hanging behind the head
      veil: new THREE.CylinderGeometry(0.1, 0.42, 1.25, 28, 1, true, Math.PI * 0.5, Math.PI),
      tiara: new THREE.TorusGeometry(0.088, 0.008, 6, 24, Math.PI),
      sash: new THREE.TorusGeometry(0.155, 0.018, 8, 40),
    };
    gownMat = {
      satin: new THREE.MeshPhysicalMaterial({ color: '#fbf7ef', roughness: 0.5, sheen: 1, sheenColor: new THREE.Color('#ffffff'), sheenRoughness: 0.4, side: THREE.DoubleSide }),
      tulle: new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.9, transparent: true, opacity: 0.32, depthWrite: false, side: THREE.DoubleSide }),
      veil: new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.9, transparent: true, opacity: 0.42, depthWrite: false, side: THREE.DoubleSide }),
      gold: new THREE.MeshStandardMaterial({ color: '#e5c06a', metalness: 0.85, roughness: 0.25 }),
    };
  }
  return { geo: gownGeo, mat: gownMat! };
}

/**
 * The gown follows the body every frame: the skirt hangs from the waist (just above the
 * pelvis bone) to the floor, the veil and tiara sit on the head.
 */
function BridalGown({ person }: { person: THREE.Object3D }) {
  const { geo, mat } = gownParts();
  const root = useRef<THREE.Group>(null);
  const skirt = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const bones = useMemo(() => ({ pelvis: person.getObjectByName('Bip01_Pelvis'), head: person.getObjectByName('Bip01_Head') }), [person]);
  const v = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    const r = root.current;
    if (!r) return;
    if (bones.pelvis && skirt.current) {
      bones.pelvis.getWorldPosition(v);
      r.worldToLocal(v);
      const waist = Math.max(0.35, v.y + 0.1);
      skirt.current.position.set(v.x, waist, v.z);
      skirt.current.scale.set(1, waist - 0.01, 1);
    }
    if (bones.head && head.current) {
      bones.head.getWorldPosition(v);
      r.worldToLocal(v);
      head.current.position.copy(v);
    }
  });

  return (
    <group ref={root}>
      <group ref={skirt}>
        <mesh geometry={geo.skirt} material={mat.satin} castShadow receiveShadow />
        <mesh geometry={geo.tulle} material={mat.tulle} />
        <mesh geometry={geo.sash} material={mat.gold} rotation={[Math.PI / 2, 0, 0]} position={[0, -0.005, 0]} scale={[1, 1, 0.012]} />
      </group>
      <group ref={head}>
        <mesh geometry={geo.tiara} material={mat.gold} position={[0, 0.125, -0.02]} rotation={[Math.PI / 2 - 0.4, 0, 0]} />
        <mesh geometry={geo.veil} material={mat.veil} position={[0, -0.42, -0.12]} scale={[0.8, 1, 0.9]} />
      </group>
    </group>
  );
}
