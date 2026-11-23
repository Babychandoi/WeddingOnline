'use client';

import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { IS_HANDHELD } from './deviceTier';

// Each ring runs from the submerged apron toward the crater. The west apron
// projects farther than the east wall, which stays steep through the upper ledges.
type Ring = [radius: number, elevation: number, westApron: number, eastWall: number, roughness: number];
const CRATER: Ring[] = [
  [1.00, -4.0, 22, 1.04, 0.10],
  [0.98, 0.12, 21, 1.00, 0.14],
  [0.93, 0.66, 17, 0.99, 0.18],
  [0.85, 1.35, 11, 0.96, 0.22],
  [0.77, 2.45, 8, 0.94, 0.26],
  [0.74, 3.95, 6, 0.92, 0.28],
  [0.70, 5.65, 3.8, 0.89, 0.33],
  [0.66, 7.20, 2.4, 0.87, 0.38],
  [0.63, 8.78, 1.1, 0.84, 0.45],
  [0.61, 10.1, 0, 0.81, 0.63],
  [0.58, 11.8, 0, 0.78, 0.92],
  [0.53, 11.5, 0, 0.71, 0.75],
  [0.45, 9.52, 0, 0.58, 0.53],
  [0.32, 7.82, 0, 0.43, 0.38],
  [0.16, 7.40, 0, 0.21, 0.18],
];
const ISLET: Ring[] = [
  [1.00, -4.0, 0, 1.00, 0.16],
  [0.98, 0.15, 0, 0.93, 0.20],
  [0.76, 0.85, 0, 0.74, 0.25],
  [0.57, 1.69, 0, 0.59, 0.27],
  [0.39, 2.55, 0, 0.35, 0.25],
  [0.17, 2.68, 0, 0.16, 0.16],
];

function shapeCliffs() {
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const charcoal = new THREE.Color('#333a48');
  const tuff = new THREE.Color('#706e69');
  const damp = new THREE.Color('#292e36');
  const grass = new THREE.Color('#53563a');
  const stratum = new THREE.Color('#9f9f99');
  const color = new THREE.Color();
  const smooth = THREE.MathUtils.smoothstep;

  function addLandform(rings: Ring[], x: number, z: number, width: number, depth: number, height: number, phase: number, slices: number) {
    const first = positions.length / 3;
    const crater = rings === CRATER;
    for (const [row, [radius, elevation, apron, cliff, roughness]] of rings.entries()) {
      for (let i = 0; i < slices; i++) {
        const angle = Math.PI * 2 * i / slices;
        const u = Math.cos(angle), v = Math.sin(angle);
        const west = Math.max(0, -u);
        const east = smooth(u, -0.30, 0.85);
        const outline = 1 + Math.sin(angle * 3 + phase) * 0.067 + Math.cos(angle * 5 + phase * 2) * 0.054;
        const ribs = 0.53 * Math.sin(angle * 14 + phase + elevation * 0.11)
          + 0.30 * Math.cos(angle * 23 - phase) + 0.17 * Math.sin(angle * 37 + phase * 2);
        const ledges = Math.cos(elevation * 3.2 + u * 3.7 + v * 2.1) * 0.012;
        const radial = outline + ribs * (0.04 + roughness * 0.036) + ledges;
        const rim = Math.sin(angle * 2 - 0.6) * 0.39 + Math.cos(angle * 7 + phase) * 0.33
          + Math.sin(angle * 11 - phase) * 0.21 + ribs * 0.76;
        const ramp = crater ? west * west * (1 - smooth(elevation, 7.5, 11.7)) * 1.21 : 0;
        const crestTilt = crater ? (0.12 - u * 0.58) * smooth(elevation, 7.8, 11.8) : 0;
        const px = x + u * width * THREE.MathUtils.lerp(radius, cliff, east) * radial - apron * west ** 1.75;
        const pz = z + v * depth * radius * radial - u * depth * 0.15 * radius;
        const py = (elevation + rim * roughness + crestTilt - ramp * smooth(elevation, 0, 1.8)) * height;
        positions.push(px, py, pz);

        const seaward = smooth(u, 0.33, 0.93);
        const layers = 0.5 + 0.5 * Math.sin(py * 4.1 - px * 0.30 + pz * 0.14 + ribs * 1.36);
        const ashExposure = (1 - seaward * 0.82) * (0.70 + 0.3 * v);
        const paleFace = (1 - smooth(Math.abs(px - (x - 2)), width * 0.24, width * 0.83))
          * smooth(py, 1.3, 4.4) * (1 - smooth(py, 6.0, 8.3)) * ashExposure;
        color.copy(charcoal).lerp(tuff, (0.48 + layers * 0.23 + ribs * 0.10) * ashExposure);
        color.lerp(stratum, paleFace * (0.19 + layers * 0.30));
        const greenFace = crater && row >= 12 ? 0.67 : west * west * (0.24 + 0.16 * rim);
        color.lerp(grass, Math.max(0, greenFace) * smooth(py, 0.55, 3.1));
        color.lerp(damp, (1 - smooth(py, 0.0, 0.92)) * 0.69);
        colors.push(color.r, color.g, color.b);
      }
    }

    for (let row = 0; row < rings.length - 1; row++) {
      for (let i = 0; i < slices; i++) {
        const a = first + row * slices + i;
        const next = first + row * slices + (i + 1) % slices;
        indices.push(a, a + slices, next, next, a + slices, next + slices);
      }
    }
    const center = positions.length / 3;
    positions.push(x, rings[rings.length - 1][1] * height, z);
    color.copy(crater ? grass : charcoal);
    colors.push(color.r, color.g, color.b);
    const inner = center - slices;
    for (let i = 0; i < slices; i++) indices.push(inner + i, center, inner + (i + 1) % slices);
  }

  const slices = IS_HANDHELD ? 84 : 144;
  addLandform(CRATER, 1, -122, 32, 24, 1.05, 1.7, slices);
  addLandform(ISLET, 36, -126, 6.5, 7.2, 1.90, 2.9, 36);
  addLandform(ISLET, 46, -138, 9.3, 8.7, 1.39, 4.1, 36);
  addLandform(ISLET, -77, -145, 18, 12, 1.14, 1.1, 48);
  addLandform(ISLET, -99, -151, 15, 13, 1.43, 3.5, 48);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  return geometry;
}

function cliffGrain(shader: THREE.WebGLProgramParametersWithUniforms) {
  shader.vertexShader = `varying vec3 vJejuRock;\n${shader.vertexShader}`
    .replace('#include <begin_vertex>', '#include <begin_vertex>\nvJejuRock = position;');
  shader.fragmentShader = `
    varying vec3 vJejuRock;
    float jejuHash(vec3 p) {
      p = fract(p * 0.1031);
      p += dot(p, p.yzx + 33.33);
      return fract((p.x + p.y) * p.z);
    }
    float jejuRockNoise(vec3 p) {
      vec3 i = floor(p), f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(mix(mix(jejuHash(i), jejuHash(i + vec3(1,0,0)), f.x),
                     mix(jejuHash(i + vec3(0,1,0)), jejuHash(i + vec3(1,1,0)), f.x), f.y),
                 mix(mix(jejuHash(i + vec3(0,0,1)), jejuHash(i + vec3(1,0,1)), f.x),
                     mix(jejuHash(i + vec3(0,1,1)), jejuHash(i + vec3(1,1,1)), f.x), f.y), f.z);
    }
    ${shader.fragmentShader}
  `.replace('#include <color_fragment>', `#include <color_fragment>
    vec3 p = vJejuRock;
    float warp = jejuRockNoise(p * vec3(0.39, 0.29, 0.46));
    float bedding = p.y - p.x * 0.088 + p.z * 0.05 + (warp - 0.5) * 1.09;
    float layers = jejuRockNoise(vec3(p.x * 0.31, bedding * 6.2, p.z * 0.35));
    float fracture = jejuRockNoise((p + vec3(p.y * 0.21 + warp * 0.93, 0.0, -p.y * 0.18)) * vec3(3.22, 0.92, 2.76));
    float grain = jejuRockNoise(p * 13.1);
    float detail = 1.0 - smoothstep(0.12, 0.38, length(fwidth(p)));
    float wall = smoothstep(0.2, 1.5, p.y);
    float fissure = (1.0 - smoothstep(0.14, 0.31, fracture)) * wall;
    float exposure = jejuRockNoise(p * vec3(0.29, 0.51, 0.34)) * 0.72 + fracture * 0.28;
    float ashBand = smoothstep(0.55, 0.78, layers + warp * 0.17)
      * smoothstep(0.39, 0.72, exposure)
      * smoothstep(1.6, 3.8, p.y) * (1.0 - smoothstep(5.5, 7.3, p.y))
      * (1.0 - smoothstep(13.0, 25.0, p.x));
    float relief = 0.63 + warp * 0.34 + layers * 0.32 + (grain - 0.5) * 0.25 * detail;
    diffuseColor.rgb = diffuseColor.rgb * relief * (1.0 - fissure * 0.36) + vec3(0.19, 0.21, 0.23) * ashBand;
    float stoneHeight = (0.054 + exposure * 0.092) * layers - 0.10 * fissure + (0.043 * grain + 0.067 * fracture) * detail;
  `).replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
    vec3 stoneDx = dFdx(-vViewPosition);
    vec3 stoneDy = dFdy(-vViewPosition);
    vec3 alongX = cross(stoneDy, normal);
    vec3 alongY = cross(normal, stoneDx);
    float det = dot(stoneDx, alongX) * faceDirection;
    vec3 gradient = sign(det) * (alongX * dFdx(stoneHeight) + alongY * dFdy(stoneHeight)) / max(abs(det), 0.00000001);
    normal = normalize(normal - gradient * min(0.59, 0.34 / max(length(gradient), 0.001)));
  `);
}

export function JejuOffshoreCliffs() {
  const geometry = useMemo(shapeCliffs, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh name="jeju-offshore-cliffs" geometry={geometry} userData={{ noCastShadow: true }}>
    <meshStandardMaterial vertexColors roughness={0.93} onBeforeCompile={cliffGrain} />
  </mesh>;
}
