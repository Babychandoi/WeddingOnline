'use client';

/**
 * Light, sky and camera finish shared by every venue: a painted sky dome (gradient, sun,
 * clouds) in each venue's palette, a sun that casts soft shadows, image-based light so
 * materials pick up reflections, and a bloom pass so lanterns, candles and lit windows glow.
 * Everything heavy switches off in low quality.
 */

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import type { VenueTheme } from '@dco/shared';

type Vec3 = [number, number, number];

interface SkySetup {
  top: string;
  horizon: string;
  /** Direction towards the sun (need not be normalised) */
  sun: Vec3;
  sunColor: string;
  /** 0 = clear sky, 1 = many clouds */
  clouds: number;
  cloudLit: string;
  cloudShade: string;
}

interface MoodSetup {
  sky: SkySetup;
  fogColor: string;
  sunLight: { position: Vec3; color: string; intensity: number };
  hemi: [string, string, number];
  envIntensity: number;
  formers: Array<{ position: Vec3; scale: Vec3; color: string; intensity: number }>;
  warmFill: number;
  bloom: number;
}

function mixHex(a: string, b: string, t: number): string {
  return `#${new THREE.Color(a).lerp(new THREE.Color(b), t).getHexString()}`;
}

function moodSetup(theme: VenueTheme): MoodSetup {
  const s = theme.colors.s;
  switch (theme.mood) {
    case 'sunset': {
      const horizon = mixHex('#ffb27a', s, 0.35);
      return {
        // Sun just above the horizon, off to the left of the view, under a dusky violet zenith
        sky: { top: '#4a4f8f', horizon, sun: [-80, 9, -60], sunColor: '#ffe2a8', clouds: 0.55, cloudLit: '#ffc9a8', cloudShade: '#8a6a8f' },
        fogColor: horizon,
        sunLight: { position: [-26, 22, -18], color: '#ffc58f', intensity: 2.1 },
        hemi: ['#ffe4c7', '#8a6a5a', 0.55],
        envIntensity: 0.55,
        formers: [
          { position: [0, 4, -30], scale: [60, 8, 1], color: '#ffb07a', intensity: 2.2 },
          { position: [0, 30, 0], scale: [40, 40, 1], color: '#fff1e0', intensity: 0.6 },
        ],
        warmFill: 0,
        bloom: 0.3,
      };
    }
    case 'night':
      return {
        sky: { top: mixHex(s, '#000000', 0.55), horizon: mixHex(s, '#ffffff', 0.06), sun: [0, 1, 0], sunColor: '#000000', clouds: 0, cloudLit: '#000000', cloudShade: '#000000' },
        fogColor: s,
        sunLight: { position: [-20, 30, 12], color: '#b8c4ff', intensity: 0.55 },
        hemi: ['#8ea0ff', '#1c1630', 0.35],
        envIntensity: 0.35,
        formers: [
          { position: [0, 30, 0], scale: [40, 40, 1], color: '#9fb0ff', intensity: 0.45 },
          { position: [0, 3, 25], scale: [40, 6, 1], color: '#ffcf8a', intensity: 0.5 },
        ],
        warmFill: 1.5,
        bloom: 0.85,
      };
    case 'indoor':
      return {
        sky: { top: mixHex(s, '#000000', 0.45), horizon: s, sun: [0, 1, 0], sunColor: '#000000', clouds: 0, cloudLit: '#000000', cloudShade: '#000000' },
        fogColor: s,
        sunLight: { position: [10, 26, 12], color: '#fff3dc', intensity: 1.3 },
        hemi: ['#fff4e0', '#5a4636', 0.55],
        envIntensity: 0.7,
        formers: [
          { position: [0, 20, 0], scale: [30, 30, 1], color: '#fff1d6', intensity: 1.2 },
          { position: [0, 4, 25], scale: [30, 6, 1], color: '#ffe2b8', intensity: 0.6 },
        ],
        warmFill: 0.9,
        bloom: 0.6,
      };
    case 'day':
    default: {
      const horizon = mixHex('#d6e6f5', s, 0.2);
      return {
        // Deep blue zenith fading to a pale horizon, scattered fair-weather clouds
        sky: { top: '#3b7dd8', horizon, sun: [70, 55, 30], sunColor: '#fff4d6', clouds: 0.7, cloudLit: '#ffffff', cloudShade: '#c4d2e4' },
        fogColor: horizon,
        sunLight: { position: [22, 32, 16], color: '#fff3e0', intensity: 2.5 },
        hemi: ['#dfeaff', '#6b5a48', 0.42],
        envIntensity: 0.5,
        formers: [
          { position: [0, 30, 0], scale: [50, 50, 1], color: '#ffffff', intensity: 1.2 },
          { position: [-30, 8, 0], scale: [6, 20, 1], color: '#cfe3ff', intensity: 0.5 },
        ],
        warmFill: 0,
        bloom: 0.35,
      };
    }
  }
}

const SKY_VERTEX = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const SKY_FRAGMENT = /* glsl */ `
uniform vec3 uTop;
uniform vec3 uHorizon;
uniform vec3 uSun;
uniform vec3 uSunColor;
uniform float uClouds;
uniform vec3 uCloudLit;
uniform vec3 uCloudShade;
varying vec3 vDir;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
  return v;
}

void main() {
  vec3 d = normalize(vDir);
  float h = d.y;
  vec3 col = h > 0.0 ? mix(uHorizon, uTop, pow(clamp(h, 0.0, 1.0), 0.5)) : uHorizon;

  // Sun: wide warm halo, tighter glow, small disc bright enough to bloom
  float sd = max(dot(d, normalize(uSun)), 0.0);
  col += uSunColor * (pow(sd, 6.0) * 0.28 + pow(sd, 90.0) * 0.6);
  col += uSunColor * smoothstep(0.9993, 0.9997, sd) * 2.5;

  // Clouds on a flat layer overhead, thinning towards the horizon
  if (uClouds > 0.0 && h > 0.0) {
    vec2 uv = d.xz / (h + 0.15) * 1.4;
    float n = fbm(uv + vec2(3.1, 1.7));
    float c = smoothstep(0.52, 0.8, n) * uClouds * smoothstep(0.0, 0.2, h);
    vec3 cloud = mix(uCloudShade, uCloudLit, smoothstep(0.55, 0.95, n)) + uSunColor * pow(sd, 5.0) * 0.35;
    col = mix(col, cloud, c);
  }

  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

/** Painted sky dome: gradient, sun and clouds in the theme's palette, never blown out */
function GradientSky({ sky }: { sky: SkySetup }) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: SKY_VERTEX,
        fragmentShader: SKY_FRAGMENT,
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {
          uTop: { value: new THREE.Color(sky.top) },
          uHorizon: { value: new THREE.Color(sky.horizon) },
          uSun: { value: new THREE.Vector3(...sky.sun) },
          uSunColor: { value: new THREE.Color(sky.sunColor) },
          uClouds: { value: sky.clouds },
          uCloudLit: { value: new THREE.Color(sky.cloudLit) },
          uCloudShade: { value: new THREE.Color(sky.cloudShade) },
        },
      }),
    [sky],
  );
  useEffect(() => () => material.dispose(), [material]);
  return (
    <mesh material={material} renderOrder={-1} frustumCulled={false}>
      <sphereGeometry args={[1500, 32, 16]} />
    </mesh>
  );
}

/** Sky, fog, sun with soft shadows, fill lights and image-based light for one venue */
export function VenueAtmosphere({ theme, quality }: { theme: VenueTheme; quality: 'high' | 'low' }) {
  const setup = useMemo(() => moodSetup(theme), [theme]);
  const farScenery = theme.kits.b.length > 0;
  // Haze only in the distance: the ground melts into the horizon colour, the hall stays crisp
  const fogRange: [number, number] = farScenery ? [90, 260] : [55, 190];

  return (
    <>
      <color attach="background" args={[setup.fogColor]} />
      <fog attach="fog" args={[setup.fogColor, fogRange[0], fogRange[1]]} />
      <GradientSky sky={setup.sky} />
      {theme.mood === 'night' && <Stars radius={160} depth={60} count={quality === 'high' ? 3000 : 900} factor={5} saturation={0.2} fade speed={0.4} />}

      <hemisphereLight args={setup.hemi} />
      <directionalLight
        position={setup.sunLight.position}
        color={setup.sunLight.color}
        intensity={setup.sunLight.intensity}
        castShadow={quality === 'high'}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-27}
        shadow-camera-right={27}
        shadow-camera-top={27}
        shadow-camera-bottom={-27}
        shadow-camera-near={1}
        shadow-camera-far={90}
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
      />
      {setup.warmFill > 0 && <pointLight position={[0, 7, -2]} intensity={setup.warmFill * 40} distance={40} decay={2} color="#ffd59a" />}

      {quality === 'high' && (
        <Environment resolution={64} frames={1} environmentIntensity={setup.envIntensity}>
          {setup.formers.map((f, i) => (
            <Lightformer key={i} form="rect" position={f.position} scale={f.scale} color={f.color} intensity={f.intensity} target={[0, 0, 0]} />
          ))}
        </Environment>
      )}
    </>
  );
}

/** Lets every solid mesh cast and receive the sun's shadow (re-checked as models stream in) */
export function ShadowCasters({ enabled }: { enabled: boolean }) {
  const { scene } = useThree();
  const frame = useRef(0);
  useFrame(() => {
    if (!enabled || frame.current++ % 60 !== 0) return;
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      const material = mesh.material as THREE.Material & { transparent?: boolean };
      const isGlow = (material as THREE.MeshBasicMaterial).isMeshBasicMaterial;
      const isFlatGround = (mesh.geometry as THREE.PlaneGeometry).type === 'PlaneGeometry';
      mesh.receiveShadow = !isGlow;
      mesh.castShadow = !isGlow && !isFlatGround && !material.transparent;
    });
  });
  return null;
}

/** Bloom on lights above white, rendered through an MSAA HDR target */
export function PostFX({ strength }: { strength: number }) {
  const { gl, scene, camera, size } = useThree();
  const composer = useMemo(() => {
    const target = new THREE.WebGLRenderTarget(size.width, size.height, { samples: 4, type: THREE.HalfFloatType });
    const c = new EffectComposer(gl, target);
    c.addPass(new RenderPass(scene, camera));
    c.addPass(new UnrealBloomPass(new THREE.Vector2(size.width, size.height), strength, 0.55, 0.95));
    c.addPass(new OutputPass());
    return c;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl, scene, camera, strength]);

  useEffect(() => {
    composer.setPixelRatio(gl.getPixelRatio());
    composer.setSize(size.width, size.height);
  }, [composer, gl, size.width, size.height]);
  useEffect(() => () => composer.dispose(), [composer]);

  // Priority 1 takes over rendering from react-three-fiber
  useFrame((_, delta) => composer.render(delta), 1);
  return null;
}

/** Drops to low quality when the device cannot hold ~28 fps (used where no player rig runs) */
export function FpsGuard({ onLowFps }: { onLowFps: (low: boolean) => void }) {
  const stats = useRef({ frames: 0, elapsed: 0, low: false });
  useFrame((_, delta) => {
    const s = stats.current;
    s.frames += 1;
    s.elapsed += delta;
    if (s.elapsed < 3) return;
    const low = s.frames / s.elapsed < 28;
    if (low !== s.low) {
      s.low = low;
      onLowFps(low);
    }
    s.frames = 0;
    s.elapsed = 0;
  });
  return null;
}

export function bloomStrength(theme: VenueTheme): number {
  return moodSetup(theme).bloom;
}
