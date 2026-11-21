'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { getFireworkPack, type FireworksShow } from '@dco/shared';
import { soundEngine } from '@/lib/soundEngine';

/** A show waiting to play: `startAt` is in performance.now() seconds */
export interface ScheduledFireworks extends FireworksShow {
  startAt: number;
}

/** Where the camera should look while a show plays (written every frame) */
export interface FireworksFocus {
  active: boolean;
  x: number;
  y: number;
  z: number;
}

/*
 * One Points cloud for every spark of every show. A spark's whole flight is decided when it is
 * born (start, velocity, drag, gravity, life) and the vertex shader computes where it is, so
 * the CPU only writes newborn sparks into a ring buffer.
 */

const VERT = /* glsl */ `
  attribute vec3 aStart;
  attribute vec3 aVel;
  attribute vec3 aColor;
  attribute vec2 aTime;   // birth, life (s)
  attribute vec4 aParams; // drag, gravity, size (m), flicker
  uniform float uTime;
  uniform float uPx;      // pixels per metre at 1 m
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float t = uTime - aTime.x;
    if (t < 0.0 || t > aTime.y) {
      gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
      gl_PointSize = 0.0;
      return;
    }
    float k = aParams.x;
    float travel = k > 0.001 ? (1.0 - exp(-k * t)) / k : t;
    vec3 p = aStart + aVel * travel + vec3(0.0, -4.9 * aParams.y, 0.0) * t * t;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float life = t / aTime.y;
    float fade = 1.0 - life * life * life;
    float flick = mix(1.0, 0.35 + 0.65 * step(0.5, fract(t * 14.0 + aStart.x * 7.3 + aStart.z * 3.1)), aParams.w * smoothstep(0.35, 0.6, life));
    vAlpha = fade * flick;
    vColor = aColor;
    gl_PointSize = max(1.5, aParams.z * uPx / -mv.z * (1.0 - 0.45 * life));
  }
`;

const FRAG = /* glsl */ `
  uniform float uDay;     // 0 night … 1 bright day: keep colour, cover more of the sky behind
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    if (d > 1.0) discard;
    float core = exp(-d * d * 5.0);
    // Hot white core, coloured halo; values over 1 feed the bloom pass
    vec3 col = mix(vColor, vec3(1.0), core * 0.6 * (1.0 - uDay)) * mix(1.0 + 4.2 * core, 0.9 + 1.4 * core, uDay);
    float a = vAlpha * smoothstep(1.0, 0.15, d);
    // Premultiplied "over": adds light on a dark sky, still reads against a bright day sky
    gl_FragColor = vec4(col * a, a * mix(0.4, 0.85, uDay));
  }
`;

/** Deterministic random from the show seed, so every guest sees the same pattern */
function rng(seed: number): () => number {
  let a = seed >>> 0 || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PALETTES: Array<[string, string]> = [
  ['#ff4d8d', '#ffd1e1'], // rose
  ['#ffcf5c', '#fff3c4'], // gold
  ['#6fe9ff', '#ffffff'], // ice
  ['#b98aff', '#ffd1ff'], // violet
  ['#ff6a3d', '#ffe08a'], // ember
  ['#7dff9a', '#f0ffd0'], // jade
  ['#ff3048', '#ffc2c8'], // red
];
const defaultClock = () => performance.now() / 1000;
const GOLD = new THREE.Color('#ffbe55');
const SPARK = new THREE.Color('#fff1c9');

type ShellKind = 'peony' | 'ring' | 'willow' | 'crossette' | 'glitter' | 'heart';

interface PlannedShell {
  launch: number;
  riseTime: number;
  from: THREE.Vector3;
  apex: THREE.Vector3;
  kind: ShellKind;
  colors: [THREE.Color, THREE.Color];
  scale: number;
  launched: boolean;
  burst: boolean;
}

interface ActiveShow {
  show: ScheduledFireworks;
  shells: PlannedShell[];
  end: number;
  fountains: boolean;
  /** Fountain spark debt (fractional sparks carried between frames) */
  fountainCarry: number;
  /** Second-stage bursts (crossette splits, glitter) waiting for their time */
  pending: Array<{ at: number; fn: () => void }>;
}

function planShow(s: ScheduledFireworks, centre: THREE.Vector3, enclosed: boolean): ActiveShow | null {
  const pack = getFireworkPack(s.packId);
  if (!pack) return null;
  const r = rng(s.seed);
  const D = pack.durationMs / 1000;
  const shells: PlannedShell[] = [];
  const kinds: ShellKind[] = ['peony', 'peony', 'ring', 'willow', 'crossette', 'glitter'];
  const last = pack.heartFinale ? D - 3.2 : D - 2.2;
  for (let i = 0; i < pack.shells; i++) {
    // Salvos: every few shells two or three go up together
    const base = (i / pack.shells) * last;
    const launch = s.startAt + Math.max(0, base + (r() - 0.5) * 0.35);
    const x = centre.x + (r() - 0.5) * 22;
    const z = centre.z - r() * 7;
    const apexY = centre.y + (r() - 0.5) * 7;
    const pal = PALETTES[Math.floor(r() * PALETTES.length)];
    const kind = kinds[Math.floor(r() * kinds.length)];
    shells.push({
      launch,
      riseTime: 1.05 + r() * 0.45,
      from: new THREE.Vector3(x + (r() - 0.5) * 3, 0.2, z + 2),
      apex: new THREE.Vector3(x, apexY, z),
      kind,
      colors: [new THREE.Color(pal[0]), new THREE.Color(pal[r() < 0.5 ? 0 : 1])],
      scale: 0.85 + r() * 0.45,
      launched: false,
      burst: false,
    });
  }
  if (pack.heartFinale) {
    // Gold willows either side, then the heart in the middle
    for (const dx of [-8, 8]) {
      shells.push({
        launch: s.startAt + D - 3.0,
        riseTime: 1.2,
        from: new THREE.Vector3(centre.x + dx, 0.2, centre.z - 2),
        apex: new THREE.Vector3(centre.x + dx, centre.y + 1, centre.z - 4),
        kind: 'willow',
        colors: [GOLD.clone(), SPARK.clone()],
        scale: 1.15,
        launched: false,
        burst: false,
      });
    }
    shells.push({
      launch: s.startAt + D - 2.8,
      riseTime: 1.35,
      from: new THREE.Vector3(centre.x, 0.2, centre.z - 1),
      apex: new THREE.Vector3(centre.x, centre.y + 2.5, centre.z - 3),
      kind: 'heart',
      colors: [new THREE.Color('#ff2e63'), new THREE.Color('#ffb3c7')],
      scale: 1.2,
      launched: false,
      burst: false,
    });
  }
  if (enclosed) {
    for (const shell of shells) {
      for (const point of [shell.from, shell.apex]) {
        point.x = THREE.MathUtils.clamp(THREE.MathUtils.lerp(centre.x, point.x, 0.44), -12.9, 12.9);
        point.z = THREE.MathUtils.clamp(THREE.MathUtils.lerp(centre.z, point.z, 0.41), -12.9, 12.9);
      }
      shell.apex.y = THREE.MathUtils.lerp(centre.y, shell.apex.y, 0.27);
      shell.scale *= 0.44;
    }
  }
  return { show: s, shells, end: s.startAt + D + 3.5, fountains: pack.fountains, fountainCarry: 0, pending: [] };
}

export function Fireworks({
  shows,
  stage,
  focusRef,
  lowQuality,
  clock = defaultClock,
  silent = false,
  mood = 'night',
  enclosed = false,
}: {
  shows: ScheduledFireworks[];
  /** Front of the stage: shells rise behind it, fountains stand in front of it */
  stage: { x: number; z: number; rotY: number };
  focusRef: React.MutableRefObject<FireworksFocus>;
  lowQuality: boolean;
  /** Seconds; the same timebase as ScheduledFireworks.startAt (tests step it by hand) */
  clock?: () => number;
  silent?: boolean;
  /** Venue light: by day and indoors the sky dims to dusk while a show plays */
  mood?: 'day' | 'sunset' | 'night' | 'indoor';
  enclosed?: boolean;
}) {
  const daylight = mood === 'day' ? 1 : mood === 'sunset' ? 0.65 : mood === 'indoor' ? 0.55 : 0;
  const { camera, size, gl } = useThree();
  const MAX = lowQuality ? 8000 : 24000;
  const density = lowQuality ? 0.5 : 1;

  const { geometry, material, attrs } = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const mk = (n: number) => {
      const a = new THREE.BufferAttribute(new Float32Array(MAX * n), n);
      a.setUsage(THREE.DynamicDrawUsage);
      return a;
    };
    const a = { start: mk(3), vel: mk(3), color: mk(3), time: mk(2), params: mk(4) };
    // Born "never": hidden until written
    (a.time.array as Float32Array).fill(-1e6);
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAX * 3), 3));
    g.setAttribute('aStart', a.start);
    g.setAttribute('aVel', a.vel);
    g.setAttribute('aColor', a.color);
    g.setAttribute('aTime', a.time);
    g.setAttribute('aParams', a.params);
    const m = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: { uTime: { value: 0 }, uPx: { value: 600 }, uDay: { value: 0 } },
      transparent: true,
      depthWrite: false,
      blending: THREE.CustomBlending,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
    });
    return { geometry: g, material: m, attrs: a };
  }, [MAX]);

  useEffect(() => () => {
    geometry.dispose();
    material.dispose();
  }, [geometry, material]);

  const clockBase = useRef(clock());
  const cursor = useRef(0);
  const dirty = useRef<{ lo: number; hi: number; wrapped: boolean }>({ lo: Infinity, hi: -1, wrapped: false });
  const active = useRef<Map<string, ActiveShow>>(new Map());
  const flash = useRef<THREE.PointLight>(null);
  /** A dusk dome around the hall: darkens the sky beyond it, never the hall itself */
  const dusk = useMemo(
    () => new THREE.MeshBasicMaterial({ color: '#10163a', side: THREE.BackSide, transparent: true, opacity: 0, depthWrite: false, fog: false, toneMapped: false }),
    [],
  );
  useEffect(() => () => dusk.dispose(), [dusk]);
  const flashLevel = useRef(0);
  const right = useMemo(() => new THREE.Vector3(), []);
  const up = useMemo(() => new THREE.Vector3(), []);
  const tmp = useMemo(() => new THREE.Vector3(), []);

  const centre = useMemo(() => {
    if (enclosed) {
      const front = new THREE.Vector3(0, 0, 4).applyAxisAngle(new THREE.Vector3(0, 1, 0), stage.rotY);
      return new THREE.Vector3(THREE.MathUtils.clamp(stage.x + front.x, -9.5, 9.5), 5.65, THREE.MathUtils.clamp(stage.z + front.z, -9.5, 9.5));
    }
    const back = new THREE.Vector3(0, 0, -7).applyAxisAngle(new THREE.Vector3(0, 1, 0), stage.rotY);
    return new THREE.Vector3(stage.x + back.x, 15.5, stage.z + back.z);
  }, [stage.x, stage.z, stage.rotY, enclosed]);

  /** Writes one spark into the ring buffer */
  const spawn = (
    now: number,
    p: THREE.Vector3,
    vx: number,
    vy: number,
    vz: number,
    color: THREE.Color,
    life: number,
    drag: number,
    gravity: number,
    sizeM: number,
    flicker: number,
    delay = 0,
  ) => {
    const i = cursor.current;
    cursor.current = (i + 1) % MAX;
    const d = dirty.current;
    if (i < d.lo) d.lo = i;
    if (i > d.hi) d.hi = i;
    if (cursor.current === 0) d.wrapped = true;
    const s = attrs.start.array as Float32Array;
    const v = attrs.vel.array as Float32Array;
    const c = attrs.color.array as Float32Array;
    const t = attrs.time.array as Float32Array;
    const q = attrs.params.array as Float32Array;
    s[i * 3] = p.x;
    s[i * 3 + 1] = p.y;
    s[i * 3 + 2] = p.z;
    v[i * 3] = vx;
    v[i * 3 + 1] = vy;
    v[i * 3 + 2] = vz;
    c[i * 3] = color.r;
    c[i * 3 + 1] = color.g;
    c[i * 3 + 2] = color.b;
    t[i * 2] = now - clockBase.current + delay;
    t[i * 2 + 1] = life;
    q[i * 4] = drag;
    q[i * 4 + 1] = gravity;
    q[i * 4 + 2] = sizeM;
    q[i * 4 + 3] = flicker;
  };

  const sphereDir = (r: () => number) => {
    const u = r() * 2 - 1;
    const th = r() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    return [s * Math.cos(th), u, s * Math.sin(th)] as const;
  };

  const dim = useMemo(() => new THREE.Color(), []);
  /** A star plus the fainter copies that follow it along the same path: the streak */
  const star = (
    now: number,
    p: THREE.Vector3,
    vx: number,
    vy: number,
    vz: number,
    color: THREE.Color,
    life: number,
    drag: number,
    gravity: number,
    sizeM: number,
    flicker: number,
  ) => {
    spawn(now, p, vx, vy, vz, color, life, drag, gravity, sizeM, flicker);
    const ghosts = lowQuality ? 1 : 3;
    for (let g = 1; g <= ghosts; g++) {
      dim.copy(color).multiplyScalar(1 - g * 0.24);
      spawn(now, p, vx, vy, vz, dim, life - g * 0.05, drag, gravity, sizeM * (1 - g * 0.2), flicker, g * 0.045);
    }
  };

  const burst = (now: number, sh: PlannedShell, r: () => number, a: ActiveShow) => {
    // the flash of the break
    spawn(now, sh.apex, 0, 0, 0, SPARK, 0.22, 0, 0, 4.2 * sh.scale, 0);
    const [c1, c2] = sh.colors;
    const k = 1.7;
    const n = (count: number) => Math.round(count * density);
    switch (sh.kind) {
      case 'ring': {
        // A tilted circle
        const tilt = new THREE.Euler((r() - 0.5) * 1.6, r() * Math.PI, (r() - 0.5) * 0.8);
        const count = n(90);
        for (let i = 0; i < count; i++) {
          const th = (i / count) * Math.PI * 2;
          tmp.set(Math.cos(th), Math.sin(th), 0).applyEuler(tilt).multiplyScalar(k * 5.2 * sh.scale);
          star(now, sh.apex, tmp.x, tmp.y, tmp.z, i % 2 ? c1 : c2, 1.9, k, 0.12, 0.32, 0.2);
        }
        // a small core
        for (let i = 0; i < n(30); i++) {
          const [x, y, z] = sphereDir(r);
          spawn(now, sh.apex, x * 3, y * 3, z * 3, SPARK, 1.0, k, 0.1, 0.22, 0.6);
        }
        break;
      }
      case 'willow': {
        // Long-hanging gold that drifts down
        for (let i = 0; i < n(120); i++) {
          const [x, y, z] = sphereDir(r);
          const sp = k * (3.6 + r() * 1.2) * sh.scale;
          star(now, sh.apex, x * sp, y * sp + 1.5, z * sp, i % 3 ? GOLD : SPARK, 3.2 + r() * 0.8, k * 1.1, 0.42, 0.27, 0.7);
        }
        break;
      }
      case 'heart': {
        // A heart facing whoever is watching
        right.setFromMatrixColumn(camera.matrixWorld, 0).setY(0).normalize();
        up.set(0, 1, 0);
        const count = n(180);
        for (let i = 0; i < count; i++) {
          const th = (i / count) * Math.PI * 2;
          const hx = 16 * Math.pow(Math.sin(th), 3);
          const hy = 13 * Math.cos(th) - 5 * Math.cos(2 * th) - 2 * Math.cos(3 * th) - Math.cos(4 * th);
          const scale = (k * 6.5 * sh.scale) / 16;
          tmp.copy(right).multiplyScalar(hx * scale).addScaledVector(up, hy * scale);
          star(now, sh.apex, tmp.x, tmp.y, tmp.z, i % 4 ? c1 : c2, 3.0, k, 0.05, 0.42, 0.15);
        }
        // glitter inside it
        for (let i = 0; i < n(60); i++) {
          const [x, y, z] = sphereDir(r);
          spawn(now, sh.apex, x * 4, y * 4, z * 4, c2, 2.4, k, 0.15, 0.2, 1);
        }
        break;
      }
      case 'crossette': {
        // Few heavy stars that split in four
        const stars = n(16);
        for (let i = 0; i < stars; i++) {
          const [x, y, z] = sphereDir(r);
          const sp = k * 4.2 * sh.scale;
          star(now, sh.apex, x * sp, y * sp, z * sp, c1, 0.75, k, 0.1, 0.44, 0);
          const at = now + 0.72;
          const p0 = sh.apex.clone().addScaledVector(new THREE.Vector3(x, y, z), (sp / k) * (1 - Math.exp(-k * 0.72)));
          p0.y -= 4.9 * 0.1 * 0.72 * 0.72;
          a.pending.push({
            at,
            fn: () => {
              for (let j = 0; j < 4; j++) {
                const ang = (j / 4) * Math.PI * 2 + r();
                star(at, p0, Math.cos(ang) * 6, Math.sin(ang) * 6, (r() - 0.5) * 3, c2, 1.1, 2.2, 0.25, 0.28, 0.4);
              }
            },
          });
        }
        break;
      }
      case 'glitter': {
        for (let i = 0; i < n(110); i++) {
          const [x, y, z] = sphereDir(r);
          const sp = k * (4.4 + r() * 0.6) * sh.scale;
          star(now, sh.apex, x * sp, y * sp, z * sp, c1, 1.5, k, 0.2, 0.3, 0.3);
        }
        // the shimmer that follows
        a.pending.push({
          at: now + 0.9,
          fn: () => {
            for (let i = 0; i < n(140); i++) {
              const [x, y, z] = sphereDir(r);
              const rad = (4.4 * sh.scale) * (0.6 + r() * 0.45);
              tmp.set(sh.apex.x + x * rad, sh.apex.y + y * rad - 1.2, sh.apex.z + z * rad);
              spawn(now + 0.9, tmp, 0, -0.4, 0, SPARK, 0.5 + r() * 0.7, 0, 0.05, 0.17, 1, r() * 0.5);
            }
          },
        });
        break;
      }
      default: {
        // Peony: a full sphere, two colours
        for (let i = 0; i < n(150); i++) {
          const [x, y, z] = sphereDir(r);
          const sp = k * (4.6 + r() * 0.8) * sh.scale;
          star(now, sh.apex, x * sp, y * sp, z * sp, r() < 0.7 ? c1 : c2, 1.8 + r() * 0.4, k, 0.16, 0.34, 0.25);
        }
      }
    }
  };

  useFrame((_, delta) => {
    const now = clock();
    material.uniforms.uTime.value = now - clockBase.current;
    const persp = camera as THREE.PerspectiveCamera;
    material.uniforms.uPx.value = (size.height * gl.getPixelRatio() * 0.5) / Math.tan(THREE.MathUtils.degToRad(persp.fov ?? 50) * 0.5);

    // Pick up new shows
    for (const s of shows) {
      if (!active.current.has(s.id) && now < s.startAt + 30) {
        const plan = planShow(s, centre, enclosed);
        if (plan) active.current.set(s.id, plan);
      }
    }

    let focus = false;
    for (const [id, a] of Array.from(active.current.entries())) {
      if (now > a.end) {
        active.current.delete(id);
        continue;
      }
      if (now > a.show.startAt - 1.2) focus = true;
      const r = rng(a.show.seed ^ Math.floor(now * 7));

      for (const sh of a.shells) {
        if (!sh.launched && now >= sh.launch) {
          sh.launched = true;
          // the rocket itself
          const vel = tmp.copy(sh.apex).sub(sh.from).divideScalar(sh.riseTime);
          spawn(sh.launch, sh.from, vel.x, vel.y, vel.z, SPARK, sh.riseTime, 0, 0, 0.32, 0);
          const dist = camera.position.distanceTo(sh.from);
          if (!silent) soundEngine.playFireworkLaunch(Math.min(1, 14 / Math.max(6, dist)));
        }
        if (sh.launched && !sh.burst) {
          const t = now - sh.launch;
          if (t < sh.riseTime) {
            // trail: a few slow sparks left behind each frame
            const f = t / sh.riseTime;
            tmp.copy(sh.from).lerp(sh.apex, f);
            for (let i = 0; i < (lowQuality ? 1 : 3); i++) {
              spawn(now, tmp, (r() - 0.5) * 0.6, -0.5 - r(), (r() - 0.5) * 0.6, GOLD, 0.45 + r() * 0.3, 1.5, 0.2, 0.14, 0.6);
            }
          } else {
            sh.burst = true;
            burst(sh.launch + sh.riseTime, sh, rng(Math.floor(sh.apex.x * 1000) ^ a.show.seed), a);
            flashLevel.current = Math.min(1.6, flashLevel.current + (sh.kind === 'heart' ? 1.4 : 0.9));
            if (flash.current) {
              flash.current.position.copy(sh.apex);
              flash.current.color.copy(sh.colors[0]);
            }
            const dist = camera.position.distanceTo(sh.apex);
            const delay = Math.min(0.25, dist / 343);
            if (!silent) window.setTimeout(() => soundEngine.playFireworkBurst(Math.min(1, 26 / Math.max(10, dist)), sh.kind !== 'heart'), delay * 1000);
          }
        }
      }

      for (let i = a.pending.length - 1; i >= 0; i--) {
        if (now >= a.pending[i].at) {
          a.pending[i].fn();
          a.pending.splice(i, 1);
        }
      }

      // Cold-spark fountains in front of the stage, as at a real reception
      if (a.fountains && now > a.show.startAt + 0.3 && now < a.end - 4) {
        a.fountainCarry += Math.min(0.05, delta) * 110 * density;
        const count = Math.floor(a.fountainCarry);
        a.fountainCarry -= count;
        for (const sx of [-3.1, -1.4, 1.4, 3.1]) {
          tmp.set(sx, 0.45, 2.3).applyAxisAngle(new THREE.Vector3(0, 1, 0), stage.rotY);
          tmp.x += stage.x;
          tmp.z += stage.z;
          for (let i = 0; i < count; i++) {
            spawn(now, tmp, (r() - 0.5) * 1.1, 6.2 + r() * 1.6, (r() - 0.5) * 1.1, r() < 0.6 ? SPARK : GOLD, 0.8 + r() * 0.35, 0.9, 0.85, 0.1, 0.8);
          }
        }
      }
    }

    // Evening falls for the show, then the day comes back
    const duskTarget = focus ? 0.84 * daylight : 0;
    dusk.opacity += (duskTarget - dusk.opacity) * (1 - Math.exp(-Math.min(0.1, delta) * 1.6));
    material.uniforms.uDay.value = daylight * (1 - dusk.opacity * 0.75);

    focusRef.current.active = focus;
    focusRef.current.x = centre.x;
    focusRef.current.y = centre.y;
    focusRef.current.z = centre.z;

    // Upload only what changed this frame
    const d = dirty.current;
    if (d.hi >= 0) {
      for (const attr of [attrs.start, attrs.vel, attrs.color, attrs.time, attrs.params]) {
        attr.clearUpdateRanges();
        if (d.wrapped || d.hi - d.lo > MAX / 2) attr.addUpdateRange(0, MAX * attr.itemSize);
        else attr.addUpdateRange(d.lo * attr.itemSize, (d.hi - d.lo + 1) * attr.itemSize);
        attr.needsUpdate = true;
      }
      dirty.current = { lo: Infinity, hi: -1, wrapped: false };
    }

    flashLevel.current *= 0.9;
    if (flash.current) flash.current.intensity = flashLevel.current * 2600;
  });

  return (
    <>
      {daylight > 0 && (
        <mesh material={dusk} renderOrder={10} frustumCulled={false}>
          <sphereGeometry args={[95, 32, 16]} />
        </mesh>
      )}
      <points geometry={geometry} material={material} frustumCulled={false} renderOrder={20} />
      {!lowQuality && <pointLight ref={flash} intensity={0} distance={0} decay={2} />}
    </>
  );
}
