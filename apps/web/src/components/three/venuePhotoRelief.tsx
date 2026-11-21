'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Splat } from '@react-three/drei';
import * as THREE from 'three';

export const RELIEF_FOV = 43;
export const RELIEF_CAMERA = {
  position: [0, 0, 0] as [number, number, number],
  target: [0, 0, -10] as [number, number, number],
};

interface ReliefAssets {
  source: THREE.Texture;
  depthTex: THREE.Texture;
  geometry: THREE.BufferGeometry;
}

/**
 * Edge-preserving bilateral depth smoothing + high-density 3D camera-ray relief mesh.
 * Smooths out 8-bit quantization stair-stepping while keeping architectural and foliage silhouettes crisp.
 */
function reliefGeometry(depth: HTMLImageElement, aspect: number) {
  const grid = document.createElement('canvas');
  grid.width = 224;
  grid.height = Math.min(260, Math.max(112, Math.round(224 / aspect)));
  const sampler = grid.getContext('2d', { willReadFrequently: true });
  if (!sampler) throw new Error('No canvas for the depth texture');
  sampler.drawImage(depth, 0, 0, grid.width, grid.height);
  const pixels = sampler.getImageData(0, 0, grid.width, grid.height).data;
  const w = grid.width;
  const h = grid.height;

  // Extract normalized depth [0..1] and run a 2-pass edge-preserving bilateral filter
  const raw = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    raw[i] = pixels[i * 4] / 255;
  }
  const filtered = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const center = raw[y * w + x];
      let sum = 0;
      let weightSum = 0;
      for (let dy = -2; dy <= 2; dy++) {
        const ny = Math.min(h - 1, Math.max(0, y + dy));
        for (let dx = -2; dx <= 2; dx++) {
          const nx = Math.min(w - 1, Math.max(0, x + dx));
          const sample = raw[ny * w + nx];
          const spatial = Math.exp(-(dx * dx + dy * dy) * 0.35);
          const range = Math.exp(-((sample - center) * (sample - center)) * 38.0);
          const wt = spatial * range;
          sum += sample * wt;
          weightSum += wt;
        }
      }
      filtered[y * w + x] = weightSum > 0 ? sum / weightSum : center;
    }
  }

  const mesh = new THREE.PlaneGeometry(1, 1, w - 1, h - 1);
  const vertices = mesh.getAttribute('position');
  const uv = mesh.getAttribute('uv');
  const focal = Math.tan(THREE.MathUtils.degToRad(RELIEF_FOV * 0.5));
  for (let i = 0; i < vertices.count; i++) {
    const u = uv.getX(i);
    const v = uv.getY(i);
    const x = Math.round(u * (w - 1));
    const y = Math.round((1 - v) * (h - 1));
    const shift = filtered[y * w + x];
    const distance = THREE.MathUtils.lerp(16.2, 7.1, shift);
    vertices.setXYZ(i, (u * 2 - 1) * focal * distance * aspect, (v * 2 - 1) * focal * distance, -distance);
  }
  mesh.computeVertexNormals();
  mesh.computeBoundingSphere();
  return mesh;
}

type LoadState = 'loading' | 'ready' | 'failed';

export function VenuePhotoRelief({
  image,
  depth,
  aspect,
  splatUrl,
  onStatus,
}: {
  image: string;
  depth: string;
  aspect: number;
  /** Optional 3D Gaussian Splatting (.splat) scene URL */
  splatUrl?: string;
  onStatus: (status: LoadState) => void;
}) {
  const [assets, setAssets] = useState<ReliefAssets | null>(null);
  useEffect(() => {
    let active = true;
    let colorTexture: THREE.Texture | undefined;
    let depthTexture: THREE.Texture | undefined;
    let geometry: THREE.BufferGeometry | undefined;
    onStatus('loading');

    const loadColor = new THREE.TextureLoader().loadAsync(image).then((texture) => {
      if (!active) texture.dispose();
      else colorTexture = texture;
      return texture;
    });
    const loadDepth = new THREE.ImageLoader().loadAsync(depth);
    Promise.all([loadColor, loadDepth])
      .then(([source, depthImage]) => {
        if (!active) return;
        source.colorSpace = THREE.SRGBColorSpace;
        source.anisotropy = 8;
        source.minFilter = THREE.LinearMipmapLinearFilter;
        source.magFilter = THREE.LinearFilter;
        depthTexture = new THREE.Texture(depthImage);
        depthTexture.needsUpdate = true;
        geometry = reliefGeometry(depthImage, aspect);
        setAssets({ source, depthTex: depthTexture, geometry });
        onStatus('ready');
      })
      .catch(() => {
        if (active) onStatus('failed');
      });

    return () => {
      active = false;
      colorTexture?.dispose();
      depthTexture?.dispose();
      geometry?.dispose();
    };
  }, [image, depth, aspect, onStatus]);

  if (!assets) return null;
  return (
    <group>
      <ReliefSurface assets={assets} />
      <DepthAtmosphereParticles aspect={aspect} />
      {splatUrl && <Splat src={splatUrl} position={[0, 0, -10]} scale={1} />}
    </group>
  );
}

function ReliefSurface({ assets }: { assets: ReliefAssets }) {
  const uniforms = useMemo(
    () => ({
      uMap: { value: assets.source },
      uDepth: { value: assets.depthTex },
      uTime: { value: 0 },
    }),
    [assets.source, assets.depthTex],
  );

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms,
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          varying vec3 vNormal;
          varying vec3 vViewPos;
          void main() {
            vUv = uv;
            vNormal = normalize(normalMatrix * normal);
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            vViewPos = -mvPosition.xyz;
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform sampler2D uMap;
          uniform sampler2D uDepth;
          uniform float uTime;
          varying vec2 vUv;
          varying vec3 vNormal;
          varying vec3 vViewPos;

          void main() {
            vec3 viewDir = normalize(vViewPos);
            float d = texture2D(uDepth, vUv).r;
            // Subtle micro-parallax shift proportional to local depth & viewing angle
            vec2 parallaxUv = clamp(vUv + viewDir.xy * (d - 0.45) * 0.0085, 0.001, 0.999);
            vec4 texel = texture2D(uMap, parallaxUv);

            // Gentle natural rim & sun-glint breathing so water, leaves, and silk feel alive
            vec3 lightDir = normalize(vec3(sin(uTime * 0.35) * 0.25 + 0.3, 0.72, 0.6));
            float spec = pow(max(dot(reflect(-lightDir, vNormal), viewDir), 0.0), 24.0);
            float luma = dot(texel.rgb, vec3(0.299, 0.587, 0.114));
            vec3 glint = vec3(1.0, 0.96, 0.88) * spec * smoothstep(0.55, 0.95, luma) * 0.14;

            gl_FragColor = vec4(texel.rgb + glint, 1.0);
            #include <colorspace_fragment>
          }
        `,
        toneMapped: false,
      }),
    [uniforms],
  );

  useFrame(({ clock }) => {
    uniforms.uTime.value = clock.elapsedTime;
  });

  useEffect(() => () => material.dispose(), [material]);
  return <mesh name="venue-reference-relief" geometry={assets.geometry} material={material} dispose={null} />;
}

/**
 * Soft 3D floating warm bokeh / dust motes suspended at true 3D depth planes (-7.5m to -14.5m)
 * so camera movement creates genuine foreground-to-background optical parallax.
 */
function DepthAtmosphereParticles({ aspect }: { aspect: number }) {
  const pointsRef = useRef<THREE.Points>(null);
  const { geometry, material, basePositions } = useMemo(() => {
    const count = 64;
    const pos = new Float32Array(count * 3);
    const base = new Float32Array(count * 3);
    const focal = Math.tan(THREE.MathUtils.degToRad(RELIEF_FOV * 0.5));
    for (let i = 0; i < count; i++) {
      const s1 = Math.sin(i * 127.1 + 311.7) * 43758.5453;
      const s2 = Math.sin(i * 269.5 + 183.3) * 43758.5453;
      const s3 = Math.sin(i * 419.2 + 71.9) * 43758.5453;
      const rx = (s1 - Math.floor(s1)) * 2 - 1;
      const ry = (s2 - Math.floor(s2)) * 2 - 1;
      const rz = s3 - Math.floor(s3);
      const dist = THREE.MathUtils.lerp(7.8, 13.8, rz);
      const x = rx * focal * dist * aspect * 0.82;
      const y = ry * focal * dist * 0.78;
      const z = -dist;
      pos[i * 3] = base[i * 3] = x;
      pos[i * 3 + 1] = base[i * 3 + 1] = y;
      pos[i * 3 + 2] = base[i * 3 + 2] = z;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: '#fff4dc',
      size: 0.055,
      transparent: true,
      opacity: 0.32,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return { geometry: geo, material: mat, basePositions: base };
  }, [aspect]);

  useFrame(({ clock }) => {
    const pts = pointsRef.current;
    if (!pts) return;
    const t = clock.elapsedTime;
    const attr = pts.geometry.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < basePositions.length / 3; i++) {
      const bx = basePositions[i * 3];
      const by = basePositions[i * 3 + 1];
      const bz = basePositions[i * 3 + 2];
      attr.setXYZ(
        i,
        bx + Math.sin(t * 0.35 + i * 1.7) * 0.14,
        by + Math.cos(t * 0.28 + i * 2.3) * 0.1,
        bz + Math.sin(t * 0.22 + i) * 0.08,
      );
    }
    attr.needsUpdate = true;
  });

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  return <points ref={pointsRef} geometry={geometry} material={material} />;
}

export function PhotoLoading() {
  return <Html center><span className="whitespace-nowrap rounded-full bg-stone-950/80 px-4 py-2 text-sm text-white">Đang dựng góc ảnh 3D…</span></Html>;
}
