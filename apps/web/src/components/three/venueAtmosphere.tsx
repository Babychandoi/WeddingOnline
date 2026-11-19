'use client';

/**
 * Light, sky and camera finish shared by every venue: a painted sky dome (gradient, sun,
 * clouds) in each venue's palette, a sun that casts soft shadows, image-based light so
 * materials pick up reflections, and a bloom pass so lanterns, candles and lit windows glow.
 * Everything heavy switches off in low quality.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import type { VenueTheme } from '@dco/shared';
import { IS_HANDHELD } from './deviceTier';
import { PhSky, type SkyInfo } from './phAssets';

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
        // Reflections of a warm room: bright ceiling, four cream walls with window light
        formers: [
          { position: [0, 20, 0], scale: [30, 30, 1], color: '#fff1d6', intensity: 1.4 },
          { position: [0, 4, 25], scale: [40, 8, 1], color: '#ffe6c4', intensity: 0.9 },
          { position: [0, 4, -25], scale: [40, 8, 1], color: '#ffe6c4', intensity: 0.9 },
          { position: [25, 4, 0], scale: [40, 8, 1], color: '#ffecd2', intensity: 0.8 },
          { position: [-25, 4, 0], scale: [40, 8, 1], color: '#ffecd2', intensity: 0.8 },
          { position: [0, 8, 0], scale: [3, 3, 1], color: '#ffd9a0', intensity: 4 },
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
        // Open-air shade is bright: sides of the cake, tablecloth skirts and faces need sky fill
        hemi: ['#dfeaff', '#6b5a48', 0.55],
        envIntensity: 0.8,
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
  const hdri = useVenueHdri(theme.mood, quality === 'high');
  const farScenery = theme.kits.b.length > 0;
  // Haze only in the distance: the ground melts into the horizon colour, the hall stays crisp
  const fogRange: [number, number] = farScenery ? [90, 260] : [55, 190];

  // Outdoors, the sky is a real photograph; it tells us where its sun is and what colour
  // its horizon haze is, so shadows and fog agree with the picture
  // (Phones keep the painted sky: the photograph is a 4–5 MB download)
  // Night keeps the painted starry sky: the night photograph reads as a pale dusk on screen
  const photoSky = quality === 'high' && (theme.mood === 'day' || theme.mood === 'sunset') && !IS_HANDHELD;
  const [sky, setSky] = useState<SkyInfo | null>(null);
  const onSky = useCallback((info: SkyInfo | null) => setSky(info), []);
  useEffect(() => setSky(null), [theme.mood]);
  const fogColor = sky ? `#${sky.horizon.getHexString()}` : setup.fogColor;
  // Tells the thumbnail renderer the lighting is final (sky photo / environment loaded, or not used)
  useEffect(() => {
    (window as unknown as { __venueEnvReady?: boolean }).__venueEnvReady = quality !== 'high' || (photoSky ? Boolean(sky) : Boolean(hdri));
  }, [hdri, sky, photoSky, quality]);
  const sunPosition: Vec3 = sky?.sun ? [sky.sun.x * 60, sky.sun.y * 60, sky.sun.z * 60] : setup.sunLight.position;

  const proceduralSky = (
    <>
      <GradientSky sky={setup.sky} />
      {quality === 'high' && (
        <Environment
          key={hdri ?? 'formers'}
          files={hdri}
          resolution={256}
          frames={1}
          environmentIntensity={setup.envIntensity * (hdri ? 1.1 : 1)}
        >
          {!hdri && (
            <>
              {/* Until the photographed light arrives: a plain sky above and ground below */}
              <color attach="background" args={[mixHex(setup.sky.horizon, '#000000', theme.mood === 'night' ? 0.4 : 0.15)]} />
              <mesh position={[0, -40, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[400, 400]} />
                <meshBasicMaterial color={mixHex(theme.colors.f, '#000000', 0.35)} side={THREE.DoubleSide} />
              </mesh>
            </>
          )}
          {setup.formers.map((f, i) => (
            <Lightformer key={i} form="rect" position={f.position} scale={f.scale} color={f.color} intensity={f.intensity * (hdri ? 0.5 : 1)} target={[0, 0, 0]} />
          ))}
        </Environment>
      )}
    </>
  );

  return (
    <>
      <color attach="background" args={[fogColor]} />
      <fog attach="fog" args={[fogColor, fogRange[0], fogRange[1]]} />
      {photoSky ? (
        <PhSky mood={theme.mood as 'day' | 'sunset' | 'night'} intensity={setup.envIntensity * 1.1} fallback={proceduralSky} onSky={onSky} />
      ) : (
        proceduralSky
      )}
      {theme.mood === 'night' && !sky && <Stars radius={160} depth={60} count={quality === 'high' ? 3000 : 900} factor={5} saturation={0.2} fade speed={0.4} />}

      <hemisphereLight args={setup.hemi} />
      <directionalLight
        position={sunPosition}
        color={setup.sunLight.color}
        intensity={setup.sunLight.intensity}
        castShadow={quality === 'high'}
        shadow-mapSize-width={IS_HANDHELD ? 2048 : 4096}
        shadow-mapSize-height={IS_HANDHELD ? 2048 : 4096}
        shadow-camera-left={-27}
        shadow-camera-right={27}
        shadow-camera-top={27}
        shadow-camera-bottom={-27}
        shadow-camera-near={1}
        shadow-camera-far={130}
        shadow-bias={-0.0006}
        shadow-normalBias={0.06}
      />
      {/* Warm bounce from lanterns and candles: a soft hemisphere, not a point light — an
          invisible point light leaves a bright reflection on lacquered floors with no lamp */}
      {setup.warmFill > 0 && <hemisphereLight args={['#ffd59a', '#2a1c12', setup.warmFill * 0.45]} />}
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
      const isClear = ((material as THREE.MeshPhysicalMaterial).transmission ?? 0) > 0;
      mesh.castShadow = !isGlow && !isFlatGround && !material.transparent && !isClear && !mesh.userData.noCastShadow;
    });
  });
  return null;
}

/**
 * Camera-like grade applied in linear HDR before tone mapping: a touch of contrast around
 * mid-grey, gentle saturation, warm highlights / cool shadows split-tone, lens vignette
 * and a whisper of film grain so flat CG gradients stop looking computer-made.
 */
const SanitizeShader = {
  uniforms: { tDiffuse: { value: null as THREE.Texture | null } },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    varying vec2 vUv;
    void main() {
      vec4 c = texture2D(tDiffuse, vUv);
      if (any(isnan(c)) || any(isinf(c))) c = vec4(0.0, 0.0, 0.0, 1.0);
      // Bulbs and flames peak around 7; anything far above is a pin-point specular glint
      gl_FragColor = vec4(min(c.rgb, vec3(10.0)), c.a);
    }`,
};

const GradeShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uTime: { value: 0 },
    uContrast: { value: 1.08 },
    uSaturation: { value: 1.06 },
    uVignette: { value: 0.32 },
    uWarm: { value: new THREE.Vector3(1.03, 1.0, 0.96) },
    uCool: { value: new THREE.Vector3(0.97, 0.99, 1.04) },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uContrast;
    uniform float uSaturation;
    uniform float uVignette;
    uniform vec3 uWarm;
    uniform vec3 uCool;
    varying vec2 vUv;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main() {
      vec4 tex = texture2D(tDiffuse, vUv);
      vec3 c = max(tex.rgb, 0.0);
      float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
      // Contrast in log space around 18% grey keeps highlights from clipping
      vec3 lc = log2(c + 1e-4);
      lc = (lc - log2(0.18)) * uContrast + log2(0.18);
      c = exp2(lc);
      l = dot(c, vec3(0.2126, 0.7152, 0.0722));
      c = mix(vec3(l), c, uSaturation);
      float t = smoothstep(0.05, 0.6, l);
      c *= mix(uCool, uWarm, t);
      // Natural lens vignette (cos^4 falloff)
      vec2 d = vUv - 0.5;
      float v = 1.0 - dot(d, d) * uVignette * 2.2;
      c *= clamp(v, 0.0, 1.0);
      // Very fine luminance grain
      float g = hash(vUv * 1024.0 + fract(uTime) * 61.0) - 0.5;
      c *= 1.0 + g * 0.025;
      gl_FragColor = vec4(c, tex.a);
    }`,
};

/**
 * Photographic finish: ground-truth ambient occlusion (contact shadows under every table,
 * chair, pillar and plant), bloom on light sources, then the camera grade. Rendered
 * through an MSAA half-float target so tone mapping happens once, at the end.
 */
export function PostFX({ strength, ambientOcclusion = !IS_HANDHELD }: { strength: number; ambientOcclusion?: boolean }) {
  const { gl, scene, camera, size } = useThree();
  const { composer, grade } = useMemo(() => {
    const target = new THREE.WebGLRenderTarget(size.width, size.height, { samples: 4, type: THREE.HalfFloatType });
    const c = new EffectComposer(gl, target);
    c.addPass(new RenderPass(scene, camera));
    // Safety net: one bad pixel (NaN / inf from a material) must not bloom into a haze
    c.addPass(new ShaderPass(SanitizeShader));
    if (ambientOcclusion) {
      const ao = new GTAOPass(scene, camera, size.width, size.height);
      ao.output = 0; // GTAOPass.OUTPUT.Default: the scene with AO multiplied in
      // The AO pre-pass draws front faces only: open shells (skirts) must face outward — see
      // the lathe profiles in HumanAvatar.tsx
      ao.blendIntensity = 0.85;
      ao.updateGtaoMaterial({ radius: 0.55, distanceExponent: 1.6, thickness: 1.2, scale: 1.1, samples: 16, distanceFallOff: 1 });
      ao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 16 });
      c.addPass(ao);
    }
    // Threshold 1.8: only true light sources (bulbs, flames, lanterns at 2–7×) bloom — a brightly
    // lit cream floor under the chandeliers must not smear into a milky haze
    c.addPass(new UnrealBloomPass(new THREE.Vector2(size.width, size.height), strength * 0.7, 0.5, 1.8));
    const gradePass = new ShaderPass(GradeShader);
    c.addPass(gradePass);
    c.addPass(new OutputPass());
    return { composer: c, grade: gradePass };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl, scene, camera, strength, ambientOcclusion]);

  useEffect(() => {
    composer.setPixelRatio(gl.getPixelRatio());
    composer.setSize(size.width, size.height);
  }, [composer, gl, size.width, size.height]);
  useEffect(() => () => composer.dispose(), [composer]);

  // Priority 1 takes over rendering from react-three-fiber
  useFrame((state, delta) => {
    grade.uniforms.uTime.value = state.clock.elapsedTime;
    composer.render(delta);
  }, 1);
  return null;
}

/** Renderer settings for a photographic look: Khronos PBR Neutral response keeps true colours */
export function RendererSetup({ exposure = 1 }: { exposure?: number }) {
  const { gl } = useThree();
  useEffect(() => {
    gl.toneMapping = THREE.NeutralToneMapping;
    gl.toneMappingExposure = exposure;
    gl.shadowMap.type = THREE.PCFSoftShadowMap;
    gl.shadowMap.needsUpdate = true;
  }, [gl, exposure]);
  return null;
}

/**
 * Photographed environments (Poly Haven HDRIs, CC0, via @pmndrs/assets) so reflections and
 * ambient light come from a real place: a park by day, a real sunset, a lit hall indoors.
 * Loaded lazily per mood so only the one in use is downloaded.
 */
const HDRI_LOADERS: Record<VenueTheme['mood'], () => Promise<{ default: string }>> = {
  // 'sky' is open daylight with a natural blue skylight (R:G:B ≈ 0.76:0.82:1); 'park' was
  // so blue (0.36:0.47:1) that white linen and brown bark turned lavender
  day: () => import('@pmndrs/assets/hdri/sky.exr.js'),
  sunset: () => import('@pmndrs/assets/hdri/sunset.exr.js'),
  night: () => import('@pmndrs/assets/hdri/night.exr.js'),
  indoor: () => import('@pmndrs/assets/hdri/hall.exr.js'),
};

function useVenueHdri(mood: VenueTheme['mood'], enabled: boolean): string | undefined {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    HDRI_LOADERS[mood]()
      .then((m) => alive && setUrl(m.default))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [mood, enabled]);
  return url;
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
