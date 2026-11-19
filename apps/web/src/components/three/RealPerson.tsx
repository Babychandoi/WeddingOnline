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
function admit(id: string): boolean {
  if (admitted.has(id)) return true;
  if (admitted.size >= MODEL_BUDGET) return false;
  admitted.add(id);
  return true;
}

function useRig(id: string, body: 'f' | 'm') {
  const [rig, setRig] = useState<{ scene: THREE.Group; clips: THREE.AnimationClip[] } | null>(null);
  useEffect(() => {
    let alive = true;
    setRig(null);
    if (!admit(id)) return;
    Promise.all([loadGltfCached(personUrl(id)), loadGltfCached(`${PEOPLE_BASE}/anim_${body}.glb`)])
      .then(([person, anim]) => alive && setRig({ scene: person.scene, clips: anim.animations }))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [id, body]);
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
}: {
  id: string;
  anim: string;
  seated: boolean;
  motion: React.MutableRefObject<PersonMotion>;
  fallback?: React.ReactNode;
  castShadow?: boolean;
}) {
  const info = personInfo(id);
  const body = info?.body ?? 'f';
  const rig = useRig(id, body);

  const { object, mixer, actions } = useMemo(() => {
    if (!rig) return { object: null, mixer: null, actions: null };
    const obj = cloneSkinned(rig.scene) as THREE.Group;
    obj.traverse((o) => {
      const m = o as THREE.SkinnedMesh;
      if (!m.isMesh) return;
      m.castShadow = castShadow;
      m.receiveShadow = true;
      m.frustumCulled = false; // skinned bounds do not follow the animation
      m.userData.realPerson = true;
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      mats.forEach((mat) => {
        const sm = mat as THREE.MeshStandardMaterial;
        sm.envMapIntensity = 0.8;
      });
    });
    const mx = new THREE.AnimationMixer(obj);
    const acts = new Map<ClipName, THREE.AnimationAction>();
    rig.clips.forEach((clip) => {
      const a = mx.clipAction(clip);
      a.setLoop(THREE.LoopRepeat, Infinity);
      acts.set(clip.name as ClipName, a);
    });
    return { object: obj, mixer: mx, actions: acts };
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
  });

  if (!object) return <>{fallback}</>;
  return <primitive object={object} />;
}
