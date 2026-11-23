'use client';

import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { IS_HANDHELD } from './deviceTier';
import { buildJejuRubbleField, JejuBasaltShore, type JejuRubbleField } from './JejuBasaltShore';

type Sample = (x: number, z: number) => number;

const MASK_MIN = new THREE.Vector2(-49, -39);
const MASK_SIZE = new THREE.Vector2(98, 25);
const smooth = THREE.MathUtils.smoothstep;

// Rasterize the actual instanced basalt footprints once in world coordinates.
// R holds the rock core, G the contact area around it where foam collects.
function makeBasaltMask(field: JejuRubbleField) {
  const width = IS_HANDHELD ? 256 : 512;
  const height = IS_HANDHELD ? 88 : 144;
  const data = new Uint8Array(width * height * 4);
  for (const rocks of field.rocks) for (const rock of rocks) {
    const [x, y, z] = rock.position;
    const [rx, h, rz] = rock.scale;
    if (z < MASK_MIN.y || z > MASK_MIN.y + MASK_SIZE.y || rx < 0.07 || y > 0.42) continue;
    const sin = Math.sin(rock.rotation[1]);
    const cos = Math.cos(rock.rotation[1]);
    const radius = Math.max(rx, rz) + 0.30;
    const lowX = Math.max(0, Math.floor((x - radius - MASK_MIN.x) / MASK_SIZE.x * width));
    const highX = Math.min(width - 1, Math.ceil((x + radius - MASK_MIN.x) / MASK_SIZE.x * width));
    const lowZ = Math.max(0, Math.floor((z - radius - MASK_MIN.y) / MASK_SIZE.y * height));
    const highZ = Math.min(height - 1, Math.ceil((z + radius - MASK_MIN.y) / MASK_SIZE.y * height));
    const emergent = smooth(y + h, -0.05, 0.17);
    for (let row = lowZ; row <= highZ; row++) {
      const dz = MASK_MIN.y + (row + 0.5) / height * MASK_SIZE.y - z;
      for (let col = lowX; col <= highX; col++) {
        const dx = MASK_MIN.x + (col + 0.5) / width * MASK_SIZE.x - x;
        const u = dx * cos - dz * sin;
        const v = dx * sin + dz * cos;
        const solid = Math.hypot(u / rx, v / rz);
        const contact = Math.hypot(u / (rx + 0.22), v / (rz + 0.22));
        const index = (row * width + col) * 4;
        data[index] = Math.max(data[index], Math.round(255 * emergent * (1 - smooth(solid, 0.47, 0.94))));
        data[index + 1] = Math.max(data[index + 1], Math.round(255 * emergent * (1 - smooth(contact, 0.49, 1.0))));
      }
    }
  }
  const mask = new THREE.DataTexture(data, width, height);
  mask.minFilter = THREE.LinearFilter;
  mask.magFilter = THREE.LinearFilter;
  mask.colorSpace = THREE.NoColorSpace;
  mask.needsUpdate = true;
  return mask;
}

const vertex = /* glsl */ `
  #include <fog_pars_vertex>
  attribute float dryDepth;
  uniform float time;
  varying vec3 vWorld;
  varying float vDepth;
  varying float vRunup;

  void main() {
    vec3 p = position;
    float phase = p.z * 1.54 + p.x * 0.46 - time * 1.51
      + sin(p.x * 0.28 + p.z * 0.21 - time * 0.39) * 1.15;
    float gate = 0.5 + 0.5 * sin(p.x * 0.41 - p.z * 0.15 + time * 0.53);
    float gust = 0.52 + 0.48 * sin(p.x * 0.12 + p.z * 0.26 - time * 0.74);
    float bore = pow(max(0.0, 0.5 + sin(phase) * 0.5), 2.5) * (0.24 + 0.76 * gate) * gust;
    float shallow = 1.0 - smoothstep(0.06, 1.55, max(0.0, dryDepth));
    float runup = shallow * (0.205 * bore - 0.044 * (1.0 - gate));
    p.y += 0.027 * sin(phase) + 0.012 * sin(p.z * 2.85 - p.x * 1.12 - time * 1.14) + runup;
    vDepth = dryDepth + (p.y - position.y);
    vRunup = bore;
    vWorld = (modelMatrix * vec4(p, 1.0)).xyz;
    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;

const fragment = /* glsl */ `
  #include <fog_pars_fragment>
  uniform float time;
  uniform vec3 deepWater;
  uniform vec3 blueWater;
  uniform vec3 tideWater;
  uniform vec3 skyReflection;
  uniform vec3 foamColor;
  uniform sampler2D basaltMask;
  uniform vec2 maskMin;
  uniform vec2 maskSize;
  varying vec3 vWorld;
  varying float vDepth;
  varying float vRunup;

  float hash(vec2 p) {
    vec3 f = fract(vec3(p.xyx) * 0.1031);
    f += dot(f, f.yzx + 33.33);
    return fract((f.x + f.y) * f.z);
  }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + 1.0), f.x), f.y);
  }

  void main() {
    vec2 w = vWorld.xz;
    float packet = noise(w * vec2(1.12, 0.70) + vec2(time * 0.063, -time * 0.25));
    float eddies = noise(w * vec2(5.1, 7.7) + vec2(packet * 2.7, -time * 1.18));
    float filterWidth = max(fwidth(w.x), fwidth(w.y));
    float detail = 1.0 - smoothstep(0.24, 0.94, filterWidth);
    if (vDepth <= 0.0) discard;

    float phase = dot(w, vec2(0.46, 1.54)) - time * 1.51;
    float swell = sin(phase + packet * 4.2);
    float crossSea = sin(dot(w, vec2(1.34, -0.68)) - time * 1.19 + eddies * 2.1);
    vec3 N = normalize(vec3((crossSea * 0.11 + 0.20 * (eddies - 0.5)) * detail, 1.0,
      (swell * 0.13 + 0.16 * (packet - 0.5)) * detail));
    vec3 toCamera = normalize(cameraPosition - vWorld);
    float grazing = pow(1.0 - clamp(dot(toCamera, N), 0.0, 1.0), 4.0);
    vec3 water = mix(blueWater, deepWater, smoothstep(0.80, 3.75, vDepth));
    water = mix(water, tideWater, 0.76 * (1.0 - smoothstep(0.08, 0.78, vDepth)));
    water = mix(water, skyReflection, 0.06 + grazing * 0.24);
    water *= 0.90 + 0.16 * packet + 0.12 * swell + 0.10 * crossSea * detail;
    vec3 light = normalize(vec3(-0.44, 0.76, 0.42));
    float glint = pow(max(dot(reflect(-light, N), toCamera), 0.0), 46.0);
    water += vec3(0.38, 0.48, 0.64) * (glint * 0.25);

    vec2 mapUv = (w - maskMin) / maskSize;
    vec2 rock = texture2D(basaltMask, clamp(mapUv, vec2(0.0), vec2(1.0))).rg;
    rock *= step(0.0, mapUv.x) * step(0.0, mapUv.y) * step(mapUv.x, 1.0) * step(mapUv.y, 1.0);
    float contact = rock.g * (1.0 - rock.r);
    float shallows = 1.0 - smoothstep(0.15, 0.72, vDepth);
    float bubbles = noise(w * vec2(13.7, 19.0) + vec2(eddies * 2.3, -time * 1.42));
    float breakup = smoothstep(0.38, 0.69, eddies * 0.49 + packet * 0.18 + bubbles * 0.33);
    float lace = (1.0 - smoothstep(0.02, 0.13, abs(eddies * 0.70 + bubbles * 0.30 - 0.57))) * detail;
    float advancing = smoothstep(0.16, 0.68, vRunup + packet * 0.23);
    float wash = breakup * 0.63 + lace * 0.37;
    float edgeWash = (1.0 - smoothstep(0.05, 0.23, vDepth)) * wash * advancing * 0.87;
    float rockFoam = contact * shallows * wash * (0.33 + 0.67 * advancing) * 1.46;
    float crest = smoothstep(0.78, 1.0, swell * 0.66 + crossSea * 0.25 + (packet - 0.5) * 0.42);
    float gust = noise(w * vec2(0.27, 0.77) + vec2(time * 0.15, -time * 0.42));
    float whitecaps = crest * smoothstep(0.47, 0.73, eddies * 0.38 + gust * 0.62) * (0.34 + shallows * 0.53);
    float foam = clamp(max(max(edgeWash, rockFoam), whitecaps) * (0.57 + eddies * 0.46), 0.0, 0.83);
    gl_FragColor = vec4(mix(water, foamColor, foam), 1.0);
    #include <colorspace_fragment>
    #ifdef USE_FOG
      #ifdef FOG_EXP2
        float haze = 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
      #else
        float haze = smoothstep(fogNear, fogFar, vFogDepth);
      #endif
      gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, haze * 0.63);
    #endif
  }
`;

export function JejuCoast({ geometry, seed, ground, coast }: {
  geometry: THREE.BufferGeometry;
  seed: number;
  ground: Sample;
  coast: Sample;
}) {
  const field = useMemo(() => buildJejuRubbleField(seed, ground, coast), [seed, ground, coast]);
  const mask = useMemo(() => makeBasaltMask(field), [field]);
  useEffect(() => () => mask.dispose(), [mask]);
  const uniforms = useMemo(() => ({
    ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
    time: { value: 0 },
    deepWater: { value: new THREE.Color('#0b275a') },
    blueWater: { value: new THREE.Color('#1d4b85') },
    tideWater: { value: new THREE.Color('#315b6e') },
    skyReflection: { value: new THREE.Color('#496c99') },
    foamColor: { value: new THREE.Color('#e3ebea') },
    basaltMask: { value: mask },
    maskMin: { value: MASK_MIN },
    maskSize: { value: MASK_SIZE },
  }), [mask]);
  useFrame(({ clock }) => { uniforms.time.value = clock.elapsedTime; });

  return <>
    <mesh geometry={geometry} name="jeju-shore-water" userData={{ noCastShadow: true }}>
      <shaderMaterial uniforms={uniforms} vertexShader={vertex} fragmentShader={fragment} fog toneMapped={false} />
    </mesh>
    <JejuBasaltShore field={field} ground={ground} />
  </>;
}
