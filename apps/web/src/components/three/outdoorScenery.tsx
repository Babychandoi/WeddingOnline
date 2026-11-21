'use client';

import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { IS_HANDHELD } from './deviceTier';

/** Keep the playable square level and blend shallow banks into the surrounding land. */
export function landscapeHeight(x: number, z: number): number {
  const distance = Math.max(Math.abs(x), Math.abs(z));
  const bank = THREE.MathUtils.smoothstep(distance, 16, 44) * (1 - THREE.MathUtils.smoothstep(distance, 84, 112));
  const rolls = Math.sin(x * 0.082 + Math.cos(z * 0.057)) * Math.cos(z * 0.071 - 0.6);
  const folds = Math.sin(x * 0.21 - z * 0.16) * Math.cos(z * 0.19);
  return bank * (1.35 + rolls * 0.94 + folds * 0.21);
}

export function useLandscapeGeometry(rolling: boolean): THREE.PlaneGeometry {
  const geometry = useMemo(() => {
    const segments = rolling ? (IS_HANDHELD ? 64 : 96) : 1;
    const mesh = new THREE.PlaneGeometry(224, 224, segments, segments);
    mesh.rotateX(-Math.PI / 2);
    if (rolling) {
      const positions = mesh.attributes.position;
      for (let i = 0; i < positions.count; i++) {
        positions.setY(i, landscapeHeight(positions.getX(i), positions.getZ(i)));
      }
      mesh.computeVertexNormals();
    }
    return mesh;
  }, [rolling]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return geometry;
}

const WATER_VERTEX = /* glsl */ `
  #include <fog_pars_vertex>
  varying vec2 vWater;
  void main() {
    vWater = (modelMatrix * vec4(position, 1.0)).xz;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;

// Shoreline and wet-sand colours use the same curve as the water geometry.
const WATER_FRAGMENT = /* glsl */ `
  #include <fog_pars_fragment>
  uniform vec3 uDeep;
  uniform vec3 uShallow;
  uniform vec3 uSky;
  uniform vec3 uFoam;
  uniform float uTime;
  uniform float uSea;
  varying vec2 vWater;
  void main() {
    vec2 xz = vWater;
    float shore = -25.0 + 1.05 * sin(xz.x * 0.088) + 0.34 * sin(xz.x * 0.31 + 1.1);
    float depth = max(0.0, shore - xz.y);
    float a = sin(xz.y * 2.7 + sin(xz.x * 0.55) * 1.25 + uTime * 0.95);
    float b = sin(xz.x * 3.2 + xz.y * 4.9 - uTime * 1.45);
    float c = sin(xz.x * 0.44 - xz.y * 0.68 + uTime * 0.55);
    float ripple = a * 0.56 + b * 0.21 + c * 0.23;
    vec3 toEye = normalize(cameraPosition - vec3(xz.x, 0.0, xz.y));
    float grazing = pow(1.0 - clamp(toEye.y + ripple * 0.07, 0.0, 1.0), 3.0);
    vec3 color = mix(uDeep, uShallow, uSea * exp(-depth * 0.14));
    color = mix(color, uSky, 0.08 + grazing * 0.51);
    color *= 0.94 + ripple * 0.11;
    float glints = smoothstep(0.66, 0.99, ripple) * (0.16 + grazing * 0.32);
    color = mix(color, uSky, glints);
    float surf = 0.95 + sin(xz.x * 0.49 + uTime * 1.1) * 0.33;
    float foam = (1.0 - smoothstep(0.07, 0.54, abs(depth - surf))) * smoothstep(-0.43, 0.32, ripple);
    float wash = (1.0 - smoothstep(0.02, 0.28, depth)) * (0.25 + 0.16 * a);
    color = mix(color, uFoam, uSea * (foam * 0.8 + wash));
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    #include <fog_fragment>
  }
`;

export function ShoreWater({ sea, color, sky, night }: { sea: boolean; color: string; sky: string; night: boolean }) {
  const geometry = useMemo(() => {
    const mesh = new THREE.PlaneGeometry(sea ? 400 : 150, sea ? 140 : 40, sea ? 128 : 1, 1);
    mesh.rotateX(-Math.PI / 2);
    if (sea) {
      mesh.translate(0, 0, -95);
      const positions = mesh.attributes.position;
      for (let i = 0; i < positions.count; i++) {
        if (positions.getZ(i) < -30) continue;
        const x = positions.getX(i);
        positions.setZ(i, -25 + 1.05 * Math.sin(x * 0.088) + 0.34 * Math.sin(x * 0.31 + 1.1));
      }
    } else {
      mesh.translate(-10, 0, -48);
    }
    return mesh;
  }, [sea]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  const uniforms = useMemo(() => ({
    ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
    uDeep: { value: new THREE.Color(color).lerp(new THREE.Color(night ? '#102330' : '#1a4349'), 0.68) },
    uShallow: { value: new THREE.Color(night ? '#3b5b5e' : '#79ac9d') },
    uSky: { value: new THREE.Color(sky).lerp(new THREE.Color(night ? '#4b5579' : '#b7d4db'), 0.58) },
    uFoam: { value: new THREE.Color(night ? '#71878b' : '#f1f0df') },
    uTime: { value: 0 },
    uSea: { value: sea ? 1 : 0 },
  }), [color, sky, sea, night]);
  useFrame(({ clock }) => { uniforms.uTime.value = clock.elapsedTime; });

  return (
    <mesh geometry={geometry} position-y={0.012} userData={{ noCastShadow: true }}>
      <shaderMaterial uniforms={uniforms} vertexShader={WATER_VERTEX} fragmentShader={WATER_FRAGMENT} fog />
    </mesh>
  );
}
