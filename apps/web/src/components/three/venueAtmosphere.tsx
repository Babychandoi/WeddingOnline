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
import { GARDEN_VENUE } from './gardenReference';
import { PhSky, type PhMood, type SkyInfo } from './phAssets';
import { photoHallSeed, type PhotoHallProfile, type ReferenceLight } from './photoHallProfiles';
import { getPhotoHallLighting, type PhotoHallLighting } from './photoHallLighting';

type Vec3 = [number, number, number];

interface SkySetup {
  top: string;
  horizon: string;
  /** Direction towards the sun (need not be normalised) */
  sun: Vec3;
  sunColor: string;
  sunDisc?: number;
  diffuseCover?: number;
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
        sunLight: { position: [-26, 22, -18], color: mixHex('#ffc698', horizon, 0.22), intensity: 1.88 },
        hemi: ['#eee5e5', '#967c69', 0.70],
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
        sunLight: { position: [-20, 30, 12], color: '#b8c4ff', intensity: 0.61 },
        hemi: ['#9daee0', '#272035', 0.42],
        envIntensity: 0.35,
        formers: [
          { position: [0, 30, 0], scale: [40, 40, 1], color: '#9fb0ff', intensity: 0.45 },
          { position: [0, 3, 25], scale: [40, 6, 1], color: '#ffcf8a', intensity: 0.5 },
        ],
        warmFill: 1.5,
        bloom: 0.72,
      };
    case 'indoor':
      return {
        sky: { top: mixHex(s, '#000000', 0.45), horizon: s, sun: [0, 1, 0], sunColor: '#000000', clouds: 0, cloudLit: '#000000', cloudShade: '#000000' },
        fogColor: s,
        sunLight: { position: [10, 26, 12], color: '#fff3dc', intensity: 1.12 },
        hemi: ['#fff3e6', '#675343', 0.74],
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
        sunLight: { position: [22, 32, 16], color: '#fff3e0', intensity: 2.12 },
        // Open-air shade is bright: sides of the cake, tablecloth skirts and faces need sky fill
        hemi: ['#e5edf7', '#827967', 0.76],
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

const REFERENCE_LIGHT = {
  clear: { mood: 'day', top: '#4b82bd', horizon: '#cad8e0', clouds: 0.29, key: '#fff4df', intensity: 2.35, fill: '#dae8f4', bounce: 0.82, haze: [60, 280], height: 34, bloom: 0.17 },
  soft: { mood: 'day', top: '#a4b4c3', horizon: '#d9dedf', clouds: 0.72, key: '#f8f1e6', intensity: 1.40, fill: '#e6edf0', bounce: 0.94, haze: [56, 236], height: 29, bloom: 0.1 },
  mist: { mood: 'day', top: '#9faeb8', horizon: '#d8dcd9', clouds: 0.73, key: '#eae8e1', intensity: 1.12, fill: '#e5ecea', bounce: 0.95, haze: [28, 142], height: 26, bloom: 0.12 },
  golden: { mood: 'sunset', top: '#778290', horizon: '#efbe96', clouds: 0.40, key: '#ffce9d', intensity: 1.66, fill: '#bfc7d6', bounce: 0.76, haze: [54, 240], height: 8, bloom: 0.24 },
  twilight: { mood: 'sunset', top: '#4a5b87', horizon: '#bea5a7', clouds: 0.38, key: '#ffd3b2', intensity: 0.78, fill: '#a9bae0', bounce: 0.84, haze: [58, 245], height: 10, bloom: 0.34 },
  night: { mood: 'night', top: '#101624', horizon: '#293349', clouds: 0, key: '#adbee6', intensity: 0.52, fill: '#a1acce', bounce: 0.61, haze: [60, 240], height: 31, bloom: 0.4 },
  interior: { mood: 'indoor', top: '#483c37', horizon: '#8b7664', clouds: 0, key: '#fff0da', intensity: 1.10, fill: '#e8ded0', bounce: 0.79, haze: [60, 175], height: 22, bloom: 0.28 },
  snow: { mood: 'day', top: '#6393bf', horizon: '#d6e5ed', clouds: 0.47, key: '#fff6e4', intensity: 2.05, fill: '#dce9fa', bounce: 0.91, haze: [75, 305], height: 29, bloom: 0.17 },
} satisfies Record<ReferenceLight, {
  mood: VenueTheme['mood']; top: string; horizon: string; clouds: number; key: string; intensity: number;
  fill: string; bounce: number; haze: [number, number]; height: number; bloom: number;
}>;

function referenceSetup(theme: VenueTheme, reference: PhotoHallProfile, tuning?: PhotoHallLighting): MoodSetup {
  const weather = tuning?.weather ?? reference.light;
  const light = REFERENCE_LIGHT[weather];
  const base = moodSetup({ ...theme, mood: light.mood });
  const seed = photoHallSeed(theme.id);
  const azimuth = (seed % 29 - 14) * 0.033 + (seed % 2 ? -0.83 : 0.83);
  const fallingSun = weather === 'golden' || weather === 'twilight';
  const direction: Vec3 = [Math.sin(azimuth) * 36, light.height, Math.cos(azimuth) * (fallingSun ? -30 : 29)];
  const [position, color, intensity] = tuning?.key ?? [direction, light.key, light.intensity];
  const [top, horizon, clouds] = tuning?.sky ?? [light.top, light.horizon, light.clouds];
  const [fill, bounce] = tuning?.fill ?? [light.fill, light.bounce];
  const sunDisc = weather === 'clear' || weather === 'snow' ? 0.63 : weather === 'golden' ? 0.52 : 0;
  const envIntensity = weather === 'interior' ? 0.54 : base.envIntensity * 0.69;
  return {
    ...base,
    sky: {
      ...base.sky, top, horizon, clouds, sun: position, sunDisc,
      diffuseCover: Math.max(0, (clouds - 0.35) / 0.65),
      sunColor: sunDisc ? color : weather === 'twilight' ? '#a87560' : '#000000',
      cloudLit: mixHex('#f4efea', horizon, 0.25), cloudShade: mixHex('#94a3b7', top, 0.50),
    },
    fogColor: horizon,
    sunLight: { position, color, intensity },
    hemi: [fill, mixHex('#716a5f', reference.palette.shadow, 0.42), bounce],
    envIntensity,
    warmFill: weather === 'night' ? 0.82 : weather === 'interior' ? 0.54 : base.warmFill,
    formers: base.formers.map((former) =>
      weather === 'soft' || weather === 'mist' || weather === 'twilight'
        ? { ...former, color: mixHex(former.color, fill, 0.65) }
        : former,
    ),
    bloom: light.bloom,
  };
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
uniform float uSunDisc;
uniform float uClouds;
uniform float uDiffuseCover;
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
  col += uSunColor * smoothstep(0.9993, 0.9997, sd) * (2.5 * uSunDisc);

  // Clouds on a flat layer overhead, thinning towards the horizon
  if (uClouds > 0.0 && h > 0.0) {
    vec2 uv = d.xz / (h + 0.15) * 1.4;
    float n = fbm(uv + vec2(3.1, 1.7));
    float cloudEdge = mix(0.52, 0.29, uDiffuseCover);
    float c = smoothstep(cloudEdge, cloudEdge + 0.28, n) * uClouds * smoothstep(0.0, 0.2, h);
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
          uSunDisc: { value: sky.sunDisc ?? 1 },
          uClouds: { value: sky.clouds },
          uDiffuseCover: { value: sky.diffuseCover ?? 0 },
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
export function VenueAtmosphere({ theme, quality, reference }: { theme: VenueTheme; quality: 'high' | 'low'; reference?: PhotoHallProfile }) {
  const gardenLight = theme.id === GARDEN_VENUE;
  const tuning = reference ? getPhotoHallLighting(theme.id) : undefined;
  const weather = tuning?.weather ?? reference?.light;
  const setup = useMemo(() => {
    if (reference) return referenceSetup(theme, reference, tuning);
    const base = moodSetup(theme);
    if (!gardenLight) return base;
    const daylight: Vec3 = [-8, 23, 10];
    return {
      ...base,
      sky: { ...base.sky, sun: daylight, top: '#c2cad5', horizon: '#e0e0db', cloudLit: '#f4f2ed', cloudShade: '#cbd2da', clouds: 0.69 },
      fogColor: '#c2cabc',
      sunLight: { position: daylight, color: '#fff3e2', intensity: 1.65 },
      hemi: ['#e4ebf2', '#93a088', 0.95] as MoodSetup['hemi'],
      envIntensity: 0.70,
    };
  }, [theme, gardenLight, reference, tuning]);
  const mood = weather ? REFERENCE_LIGHT[weather].mood : theme.mood;
  const farScenery = theme.kits.b.length > 0;
  const fogRange: [number, number] = tuning?.haze ??
    (weather ? REFERENCE_LIGHT[weather].haze : gardenLight ? [38, 132] : farScenery ? [58, 237] : [52, 186]);

  // The two existing panoramas are sunny afternoon and warm sunset. Cloudy locations and
  // blue-hour photos use their own sky and soft reflection cards in both quality tiers.
  const matchesPanorama = !reference || (weather === 'clear' && !tuning?.sky);
  const photoSkyMood: PhMood | null =
    matchesPanorama && !gardenLight && !IS_HANDHELD && quality === 'high' && (mood === 'day' || mood === 'sunset')
      ? mood
      : null;
  const useHdrEnvironment = quality === 'high' && !photoSkyMood &&
    (!reference || weather === 'clear' || weather === 'interior' || weather === 'night');
  const hdri = useVenueHdri(mood, useHdrEnvironment);
  const [panorama, setPanorama] = useState<{ mood: PhMood; info: SkyInfo } | null>(null);
  const onSky = useCallback((info: SkyInfo | null) => {
    setPanorama(info && photoSkyMood ? { mood: photoSkyMood, info } : null);
  }, [photoSkyMood]);
  const sky = panorama?.mood === photoSkyMood ? panorama.info : null;
  const fogColor = sky ? mixHex(`#${sky.horizon.getHexString()}`, setup.fogColor, 0.26) : setup.fogColor;
  useEffect(() => {
    (window as unknown as { __venueEnvReady?: boolean }).__venueEnvReady =
      photoSkyMood ? Boolean(sky) : !useHdrEnvironment || Boolean(hdri);
  }, [hdri, sky, photoSkyMood, useHdrEnvironment]);
  const sunPosition: Vec3 = sky?.sun ? [sky.sun.x * 60, sky.sun.y * 60, sky.sun.z * 60] : setup.sunLight.position;
  const showStars = mood === 'night' && (!reference || theme.id === 'fi_lapland');
  const practical = tuning?.practical ??
    (weather === 'interior' ? [[-4, 5.1, -8], '#ffe4be', 32] as const : undefined);
  const usePractical = Boolean(practical && quality === 'high' && !IS_HANDHELD);
  const warmBounce = setup.warmFill * 0.45 + (practical && !usePractical ? 0.08 : 0);

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
              <color attach="background" args={[mixHex(setup.sky.horizon, '#000000', mood === 'night' ? 0.4 : 0.15)]} />
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
      {photoSkyMood ? (
        <PhSky mood={photoSkyMood} intensity={setup.envIntensity * 1.1} fallback={proceduralSky} onSky={onSky} />
      ) : (
        proceduralSky
      )}
      {showStars && <Stars radius={160} depth={60} count={quality === 'high' ? 3000 : 900} factor={reference ? 2.4 : 5} saturation={0.2} fade speed={0.4} />}

      <hemisphereLight args={setup.hemi} />
      <directionalLight
        position={sunPosition}
        color={setup.sunLight.color}
        intensity={setup.sunLight.intensity}
        castShadow={quality === 'high' && weather !== 'interior'}
        shadow-mapSize-width={IS_HANDHELD ? 1024 : 2048}
        shadow-mapSize-height={IS_HANDHELD ? 1024 : 2048}
        shadow-camera-left={-25}
        shadow-camera-right={25}
        shadow-camera-top={25}
        shadow-camera-bottom={-25}
        shadow-camera-near={1}
        shadow-camera-far={110}
        shadow-bias={-0.0005}
        shadow-normalBias={gardenLight ? 0.027 : 0.05}
      />
      {/* Warm bounce from lanterns and candles: a soft hemisphere, not a point light — an
          invisible point light leaves a bright reflection on lacquered floors with no lamp */}
      {warmBounce > 0 && <hemisphereLight args={['#ffd59a', '#2a1c12', warmBounce]} />}
      {practical && usePractical && (
        <pointLight position={[...practical[0]]} color={practical[1]} intensity={practical[2]} distance={18} decay={2} />
      )}
    </>
  );
}

/** Lets every solid mesh near the hall cast and receive the sun's shadow (skips distant trees outside the 25m shadow frustum) */
export function ShadowCasters({ enabled }: { enabled: boolean }) {
  const { scene } = useThree();
  const frame = useRef(0);
  const wp = useMemo(() => new THREE.Vector3(), []);
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
      if (isGlow || isFlatGround || material.transparent || isClear || mesh.userData.noCastShadow) {
        mesh.castShadow = false;
        return;
      }
      mesh.getWorldPosition(wp);
      mesh.castShadow = Math.hypot(wp.x, wp.z) <= 32;
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
export function PostFX({ strength, ambientOcclusion = false }: { strength: number; ambientOcclusion?: boolean }) {
  const { gl, scene, camera, size } = useThree();
  const { composer, grade } = useMemo(() => {
    const target = new THREE.WebGLRenderTarget(size.width, size.height, { samples: 2, type: THREE.HalfFloatType });
    const c = new EffectComposer(gl, target);
    c.addPass(new RenderPass(scene, camera));
    // Safety net: one bad pixel (NaN / inf from a material) must not bloom into a haze
    c.addPass(new ShaderPass(SanitizeShader));
    if (ambientOcclusion && !IS_HANDHELD) {
      // Half-resolution GTAO with 8 samples keeps 60fps while adding deep crease shading in High mode
      const ao = new GTAOPass(scene, camera, Math.max(1, Math.floor(size.width * 0.5)), Math.max(1, Math.floor(size.height * 0.5)));
      ao.output = 0;
      ao.blendIntensity = 0.78;
      ao.updateGtaoMaterial({ radius: 0.5, distanceExponent: 1.5, thickness: 1.1, scale: 1.0, samples: 8, distanceFallOff: 1 });
      ao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 4, rings: 2, samples: 8 });
      c.addPass(ao);
    }
    // Threshold 1.8: only true light sources (bulbs, flames, lanterns at 2–7×) bloom
    c.addPass(new UnrealBloomPass(new THREE.Vector2(Math.max(1, Math.floor(size.width * 0.5)), Math.max(1, Math.floor(size.height * 0.5))), strength * 0.7, 0.5, 1.8));
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
  const [asset, setAsset] = useState<{ mood: VenueTheme['mood']; url: string }>();
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    HDRI_LOADERS[mood]()
      .then((m) => alive && setAsset({ mood, url: m.default }))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [mood, enabled]);
  return enabled && asset?.mood === mood ? asset.url : undefined;
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

export function bloomStrength(theme: VenueTheme, reference?: PhotoHallProfile): number {
  const weather = reference && (getPhotoHallLighting(theme.id)?.weather ?? reference.light);
  return weather ? REFERENCE_LIGHT[weather].bloom : moodSetup(theme).bloom;
}
