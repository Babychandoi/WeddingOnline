'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { IS_HANDHELD } from './deviceTier';
import { detailNormal } from './pbr';

type Profile = ReadonlyArray<readonly [radius: number, height: number]>;

function stoneProfile(profile: Profile) {
  return new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), IS_HANDHELD ? 40 : 72);
}

const lowerBasin = stoneProfile([
  [0, 0.04], [1.77, 0.04], [1.86, 0.11], [1.87, 0.17], [1.97, 0.24], [2.00, 0.53], [2.04, 0.59],
  [2.03, 0.66], [1.98, 0.69], [1.88, 0.69], [1.83, 0.65], [1.82, 0.58], [1.74, 0.31], [0, 0.31],
]);
const pedestal = stoneProfile([
  [0, 0.29], [0.44, 0.29], [0.44, 0.36], [0.36, 0.42], [0.27, 0.54], [0.16, 0.67],
  [0.15, 0.84], [0.21, 0.98], [0.27, 1.02], [0, 1.02],
]);
const upperBowl = stoneProfile([
  [0, 0.97], [0.23, 0.97], [0.37, 1.01], [0.63, 1.13], [0.72, 1.24], [0.73, 1.29],
  [0.71, 1.32], [0.64, 1.32], [0.60, 1.28], [0.55, 1.18], [0.39, 1.12], [0, 1.12],
]);
const lowerWater = new THREE.CircleGeometry(1.84, 72).rotateX(-Math.PI / 2);
const upperWater = new THREE.CircleGeometry(0.655, 40).rotateX(-Math.PI / 2);
const fallingWater = new THREE.CylinderGeometry(0.009, 0.012, 1, 6);
const spills: [number, number][] = [[0.43, 0.57], [-0.58, 0.42], [0.67, -0.27]];
const LOWER_WATER_LEVEL = 0.592;
const UPPER_WATER_LEVEL = 1.282;
const limestone = new THREE.MeshStandardMaterial({
  color: '#d5c2a0',
  roughness: 0.93,
  normalMap: detailNormal('stone'),
  normalScale: new THREE.Vector2(0.21, 0.21),
});
limestone.onBeforeCompile = (shader) => {
  shader.vertexShader = 'varying vec3 vStonePoint;\n' + shader.vertexShader
    .replace('#include <begin_vertex>', '#include <begin_vertex>\nvStonePoint = position;');
  shader.fragmentShader = 'varying vec3 vStonePoint;\n' + shader.fragmentShader
    .replace('#include <color_fragment>', `#include <color_fragment>
      vec3 p = vStonePoint;
      float weather = 0.86 + 0.08 * sin(p.x * 21.0 + sin(p.z * 15.0)) * sin(p.y * 17.0 + p.z * 9.0);
      float verticalStain = smoothstep(0.43, 0.52, sin(21.0 * p.x + 12.0 * p.z)) * (1.0 - smoothstep(0.39, 0.68, p.y));
      diffuseColor.rgb *= weather - 0.10 * verticalStain;
    `);
};

const waterVertex = /* glsl */ `
  varying vec2 vWaterPoint;
  varying vec3 vWaterWorld;
  #include <fog_pars_vertex>
  void main() {
    vWaterPoint = position.xz;
    vWaterWorld = (modelMatrix * vec4(position, 1.0)).xyz;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;

const waterFragment = /* glsl */ `
  uniform float time;
  uniform float radius;
  uniform float upper;
  uniform vec3 olive;
  uniform vec3 sediment;
  uniform vec2 spills[3];
  varying vec2 vWaterPoint;
  varying vec3 vWaterWorld;
  #include <fog_pars_fragment>

  vec2 ripple(vec2 p, vec2 center, float phase) {
    vec2 delta = p - center;
    float d = length(delta);
    float spread = exp(-d * 1.58) * smoothstep(0.01, 0.06, d);
    return delta / max(0.008, d) * cos(d * 41.0 - time * 8.6 + phase) * spread;
  }

  void main() {
    vec2 p = vWaterPoint;
    float edge = length(p) / radius;
    vec2 gradient = vec2(
      cos(p.x * 18.0 + p.y * 11.0 + time * 1.7) * 0.022,
      cos(p.y * 27.0 - p.x * 7.0 - time * 1.12) * 0.019
    );
    float impact = 0.0;
    if (upper > 0.5) {
      gradient += ripple(p, vec2(0.0), 0.4) * 0.09;
    } else {
      for (int i = 0; i < 3; i++) {
        gradient += ripple(p, spills[i], float(i) * 1.65) * 0.044;
        float d = length(p - spills[i]);
        impact += exp(-d * 24.0) * (0.65 + 0.35 * cos(time * 14.0 + float(i) * 4.0));
      }
    }
    vec3 N = normalize(vec3(-gradient.x, 1.0, -gradient.y));
    vec3 V = normalize(cameraPosition - vWaterWorld);
    vec3 R = reflect(-V, N);
    float fresnel = 0.14 + 0.77 * pow(1.0 - max(dot(N, V), 0.0), 3.6);
    float canopy = smoothstep(0.18, 0.72, R.y + 0.12 * sin(R.x * 15.0 + R.z * 7.0));
    vec3 reflected = mix(vec3(0.042, 0.064, 0.018), vec3(0.35, 0.45, 0.42), canopy);
    float depth = 1.0 - smoothstep(0.46, 0.97, edge);
    float streak = sin(p.x * 29.5 + 2.3 * sin(p.y * 14.1 + time * 0.36))
      * sin(p.y * 32.1 + 2.8 * cos(p.x * 11.3 - time * 0.51));
    float caustic = pow(max(streak, 0.0), 5.0) * 0.071 * (1.0 - 0.72 * depth);
    vec3 base = mix(sediment, olive, 0.42 + 0.58 * depth) + caustic * vec3(0.65, 0.72, 0.32);
    base *= 1.0 - 0.18 * smoothstep(0.93, 1.0, edge);
    float glint = pow(max(dot(R, normalize(vec3(-0.52, 0.88, 0.27))), 0.0), 49.0) * 0.43;
    vec3 color = mix(base, reflected, fresnel) + vec3(1.0, 0.94, 0.74) * (glint + impact * 0.21);
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    #include <fog_fragment>
  }
`;

export function AndalusiaFountain() {
  const streams = useRef<THREE.MeshStandardMaterial>(null);
  const materials = useMemo(() => [1.84, 0.655].map((radius, level) => new THREE.ShaderMaterial({
    vertexShader: waterVertex,
    fragmentShader: waterFragment,
    fog: true,
    uniforms: {
      ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
      time: { value: 0 },
      radius: { value: radius },
      upper: { value: level },
      olive: { value: new THREE.Color('#464e25') },
      sediment: { value: new THREE.Color('#6d693a') },
      spills: { value: spills.map(([x, z]) => new THREE.Vector2(x, z)) },
    },
  })), []);
  useEffect(() => () => materials.forEach((material) => material.dispose()), [materials]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    for (const material of materials) material.uniforms.time.value = t;
    if (streams.current) streams.current.opacity = 0.57 + 0.12 * Math.sin(t * 13.0) * Math.cos(t * 7.6);
  });

  const drop = UPPER_WATER_LEVEL - LOWER_WATER_LEVEL;
  return (
    <group name="andalusia-fountain" position={[0, 0.014, -18.7]} dispose={null}>
      <mesh geometry={lowerBasin} material={limestone} receiveShadow castShadow />
      <mesh geometry={pedestal} material={limestone} receiveShadow castShadow />
      <mesh geometry={upperBowl} material={limestone} receiveShadow castShadow />
      <mesh name="andalusia-water-lower" geometry={lowerWater} material={materials[0]} position-y={LOWER_WATER_LEVEL} userData={{ noCastShadow: true }} />
      <mesh geometry={upperWater} material={materials[1]} position-y={UPPER_WATER_LEVEL} userData={{ noCastShadow: true }} />
      <group userData={{ noCastShadow: true }}>
        {spills.map(([x, z], index) => (
          <mesh key={x} geometry={fallingWater} position={[x, LOWER_WATER_LEVEL + drop / 2, z]} scale={[1, drop - 0.03 * index, 1]} userData={{ noCastShadow: true }}>
            <meshStandardMaterial ref={index === 0 ? streams : undefined} color="#f6ebbd" transparent opacity={0.62 - index * 0.10} depthWrite={false} roughness={0.19} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
