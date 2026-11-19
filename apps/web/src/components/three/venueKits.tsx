'use client';

/**
 * Low-poly kits that build each venue theme's world around the shared hall floor plan.
 * The hall is 30 m × 30 m centred on the origin; the stage sits at the back (−z), the
 * reception gate at the front (+z). Scenery is placed beyond the hall edges so it never
 * blocks the walkable grid.
 */

import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { BackdropKit, CanopyKit, CenterpieceKit, PerimeterKit, VenueColors, VenueMood, VenueTheme } from '@dco/shared';
import { SURFACE_ROUGHNESS, surfaceFor, useSurfaceMaps } from './surfaceTextures';
import { detailNormal, detailRoughness } from './pbr';
import { BallroomWalls, CrystalChandelier, FloralArch, LightPost, SilkLantern, StringLights, naturalTone } from './realProps';
import { flutedColumn } from './realGeometry';
import { gold, marble } from './realMaterials';
import { CoconutLeafGate, DistantTreeline, Forest, WindClock } from './realNature';
import { IS_HANDHELD } from './deviceTier';
import { PhScatter, ringScatter, usePhReady, usePhSurface, type ScatterItem } from './phAssets';

type Vec3 = [number, number, number];

/**
 * Floor or ground material. Uses textures photographed from the real material (Poly Haven)
 * once they load, with the procedural version (lawn, sand, planks, flagstone, marble…) as
 * the stand-in. Large grounds blend two texture scales so the tiling never shows.
 */
export function SurfaceMaterial({ color: swatch, theme, role, size }: { color: string; theme: VenueTheme; role: 'floor' | 'ground'; size: number }) {
  const kind = surfaceFor(swatch, theme, role);
  const { map, normalMap, roughnessMap } = useSurfaceMaps(kind, size);
  const photo = usePhSurface(kind, size);
  // Real lawn is a duller, olive green than any theme swatch
  const color = kind === 'grass' ? naturalGrass(swatch) : swatch;
  // A photographed surface already has its true colour: only hint at the theme
  const photoTint = useMemo(() => {
    // Poly Haven's ground photos are dry meadow: shift them to a watered lawn green
    if (kind === 'grass') return '#b9e08f';
    // The sand scan is a grey, damp sand: lean well towards the venue's own sand colour
    if (kind === 'sand') return `#${new THREE.Color('#ffffff').lerp(new THREE.Color(swatch), 0.55).multiplyScalar(1.12).getHexString()}`;
    return `#${new THREE.Color('#ffffff').lerp(new THREE.Color(swatch), kind === 'snow' ? 0.08 : 0.22).getHexString()}`;
  }, [swatch, kind]);
  const normalScale = useMemo(() => new THREE.Vector2(0.8, 0.8), []);
  const big = size > 100;
  // Polished floors get a clear lacquer coat so they mirror chandeliers and the stage
  const polished = kind === 'marble' || kind === 'tile' || (kind === 'wood' && role === 'floor');
  // Photographed maps only where the photo matches the venue. The sand scan is cracked, damp
  // sand (grey, glossy enough to mirror the sky); 'stone' is the catch-all for any colour that
  // is not lawn, sand or planks (beach dunes, red earth, paving…), and a grey paving photo would
  // override it. Both keep the procedural surface tinted with the venue's own colour.
  const usePhoto = photo !== null && kind !== 'sand' && kind !== 'stone';
  const maps = usePhoto && photo ? photo : { map, normalMap, roughnessMap };
  const tint = usePhoto ? photoTint : color;
  const roughness = usePhoto ? 1 : SURFACE_ROUGHNESS[kind];
  return polished ? (
    <meshPhysicalMaterial
      key={usePhoto ? 'photo' : 'proc'}
      color={tint}
      map={maps.map}
      normalMap={maps.normalMap}
      normalScale={normalScale}
      roughnessMap={maps.roughnessMap}
      roughness={roughness}
      clearcoat={usePhoto ? 0.3 : kind === 'wood' ? 0.35 : 0.4}
      clearcoatRoughness={0.22}
      // Polished stone mirrors the bright windows of the room at grazing angles; at full strength
      // that sheen read as a milky fog over the floor
      envMapIntensity={0.4}
    />
  ) : (
    <meshStandardMaterial
      key={usePhoto ? 'photo' : 'proc'}
      color={tint}
      map={maps.map}
      normalMap={maps.normalMap}
      normalScale={normalScale}
      roughnessMap={maps.roughnessMap}
      roughness={roughness}
      onBeforeCompile={big && usePhoto ? antiTile : undefined}
    />
  );
}

/** Blend the colour map at two scales plus a slow brightness drift, hiding repetition */
function antiTile(shader: THREE.WebGLProgramParametersWithUniforms) {
  shader.fragmentShader = shader.fragmentShader.replace(
    '#include <map_fragment>',
    `#ifdef USE_MAP
      vec2 uvA = vMapUv;
      vec2 uvB = vec2(vMapUv.y, -vMapUv.x) * 0.37 + vec2(0.31, 0.17);
      vec4 sampledDiffuseColor = mix(texture2D(map, uvA), texture2D(map, uvB), 0.45);
      float drift = texture2D(map, vMapUv * 0.031).g / max(0.05, texture2D(map, vMapUv * 0.031 + 0.5).g);
      sampledDiffuseColor.rgb *= clamp(mix(1.0, drift, 0.35), 0.75, 1.25);
      diffuseColor *= sampledDiffuseColor;
    #endif`,
  );
}

/** Deterministic pseudo-random in [0, 1) so scenery is identical on every render */
function rand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Standard surface with micro relief so nothing reads as flat plastic. Anything asked to be
 * even slightly metallic is treated as real metal (gold leaf, brass): metalness 1, polished.
 */
function Std({ color, ...rest }: { color: string; roughness?: number; metalness?: number; emissive?: string; emissiveIntensity?: number; transparent?: boolean; opacity?: number; side?: THREE.Side; toneMapped?: boolean }) {
  const metal = (rest.metalness ?? 0) >= 0.25;
  const roughness = metal ? Math.min(0.32, rest.roughness ?? 0.3) : Math.max(0.35, rest.roughness ?? 0.7);
  const normalMap = detailNormal(metal ? 'micro' : roughness > 0.8 ? 'stone' : 'micro');
  const roughnessMap = detailRoughness('micro');
  return (
    <meshStandardMaterial
      color={color}
      normalMap={normalMap}
      normalScale={NORMAL_SCALE}
      roughnessMap={roughnessMap}
      envMapIntensity={metal ? 1.4 : 1}
      {...rest}
      metalness={metal ? 1 : rest.metalness ?? 0}
      roughness={roughness}
    />
  );
}
const NORMAL_SCALE = new THREE.Vector2(0.35, 0.35);

/** A light source (bulb, flame, lantern glow): brighter than white so the bloom pass picks it up */
function Glow({ color, intensity = 2.4 }: { color: string; intensity?: number }) {
  const value = useMemo(() => new THREE.Color(color).multiplyScalar(intensity), [color, intensity]);
  return <meshBasicMaterial color={value} toneMapped={false} />;
}

/** Lantern / shade: lit from inside — emissive past 1 so it glows */
function Lit({ color, glow = 1.6 }: { color: string; glow?: number }) {
  return <meshStandardMaterial color={color} emissive={color} emissiveIntensity={glow} roughness={0.6} toneMapped={false} />;
}

const EDGE_Z = [-12, -4, 4, 12];

/* ───────────────────────────── Perimeter ───────────────────────────── */

function Perimeter({ kind, colors }: { kind: PerimeterKit; colors: VenueColors }) {
  const k = colors.k;
  switch (kind) {
    case 'classic-pillars':
      return (
        <group>
          {[-14.5, 14.5].map((x) =>
            EDGE_Z.map((z) => (
              <group key={`${x}_${z}`} position={[x, 0, z]}>
                <mesh geometry={flutedColumn(6.6, 0.36)} material={marble(k ?? '#f3eee5')} />
                {/* Gilded astragal rings at the base and below the capital */}
                {[0.62, 5.78].map((y) => (
                  <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]} material={gold('yellow')}>
                    <torusGeometry args={[0.38, 0.03, 8, 40]} />
                  </mesh>
                ))}
              </group>
            ))
          )}
        </group>
      );
    case 'lacquer-pillars':
      return (
        <group>
          {[-14.8, 14.8].map((x) => (
            <group key={x}>
              {EDGE_Z.map((z) => (
                <group key={z} position={[x, 0, z]}>
                  <mesh position={[0, 2.9, 0]}>
                    <cylinderGeometry args={[0.32, 0.36, 5.8, 12]} />
                    <Std color={k ?? '#991b1b'} roughness={0.45} />
                  </mesh>
                  {[0.6, 5.2].map((y) => (
                    <mesh key={y} position={[0, y, 0]}>
                      <cylinderGeometry args={[0.4, 0.4, 0.16, 12]} />
                      <Std color={colors.a} metalness={0.3} roughness={0.4} />
                    </mesh>
                  ))}
                </group>
              ))}
              {/* Timber beam and a strip of eave along each side */}
              <mesh position={[x, 5.9, 0]}>
                <boxGeometry args={[0.5, 0.4, 26]} />
                <Std color={k ?? '#7f1d1d'} roughness={0.55} />
              </mesh>
              <mesh position={[x * 1.02, 6.25, 0]} rotation={[0, 0, x > 0 ? -0.35 : 0.35]}>
                <boxGeometry args={[1.2, 0.12, 26.6]} />
                <Std color="#57534e" roughness={0.8} />
              </mesh>
            </group>
          ))}
        </group>
      );
    case 'palms':
      return (
        <Forest
          kind="palm"
          leafColor={k ?? '#4f7a32'}
          seed={11}
          spots={[-15.5, 15.5].flatMap((x) => [-12, -2, 8, 15].map((z, i) => ({ position: [x + (i % 2 ? 0.6 : -0.4), 0, z] as Vec3, height: 6 + ((i * 7) % 4) })))}
        />
      );
    case 'pines':
      return (
        <Forest
          kind="pine"
          leafColor={k ?? '#2f5a2c'}
          seed={21}
          spots={[-17, -11, 11, 17].flatMap((x) => [-16, -6, 6, 16].map((z, i) => ({ position: [x + ((i * 3) % 2) * 0.7, 0, z + (x % 3)] as Vec3, height: 5.5 + ((i * 5 + Math.abs(x)) % 4) })))}
        />
      );
    case 'round-trees':
    case 'blossom-trees': {
      const blossom = kind === 'blossom-trees';
      const spots = [-16.6, 16.6].flatMap((x) => EDGE_Z.map((z) => ({ position: [x, 0, z] as Vec3 })));
      return (
        <ScannedTrees
          ids={blossom ? ['jacaranda_tree'] : ['island_tree_01', 'island_tree_02', 'tree_small_02']}
          spots={spots}
          height={blossom ? 7.5 : 6.5}
          fallback={<Forest kind={blossom ? 'blossom' : 'broadleaf'} leafColor={k ?? (blossom ? '#f6b8cf' : '#4d6b2a')} seed={blossom ? 31 : 37} spots={spots} />}
        />
      );
    }
    case 'cypress':
      return (
        <Forest
          kind="cypress"
          leafColor={k ?? '#27432a'}
          seed={41}
          spots={[-16.2, 16.2].flatMap((x) => [-14, -9, -4, 1, 6, 11].map((z) => ({ position: [x, 0, z] as Vec3 })))}
        />
      );
    case 'bamboo':
      return (
        <group>
          {[-16, 16].map((x) =>
            [-13, -7, -1, 5, 11].map((z) => (
              <group key={`${x}_${z}`} position={[x, 0, z]}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <mesh
                    key={i}
                    position={[Math.cos(i * 1.3) * 0.5, 3.4, Math.sin(i * 1.3) * 0.5]}
                    rotation={[Math.sin(i) * 0.08, 0, Math.cos(i) * 0.08]}
                  >
                    <cylinderGeometry args={[0.07, 0.09, 6.8 - i * 0.4, 6]} />
                    <Std color={k ?? (i % 2 ? '#65a30d' : '#4d7c0f')} />
                  </mesh>
                ))}
                <mesh position={[0, 6.2, 0]}>
                  <sphereGeometry args={[1.1, 8, 6]} />
                  <Std color={k ? lighten(k, 0.15) : '#84cc16'} roughness={0.85} />
                </mesh>
              </group>
            ))
          )}
        </group>
      );
    case 'arches':
      return (
        <group>
          {[-15.4, 15.4].map((x) =>
            [-12, -6, 0, 6, 12].map((z) => (
              <group key={`${x}_${z}`} position={[x, 0, z]} rotation={[0, Math.PI / 2, 0]}>
                {[-1.25, 1.25].map((dx) => (
                  <mesh key={dx} position={[dx, 1.7, 0]}>
                    <boxGeometry args={[0.45, 3.4, 0.45]} />
                    <Std color={k ?? '#f5f5f4'} roughness={0.6} />
                  </mesh>
                ))}
                <mesh position={[0, 3.4, 0]}>
                  <torusGeometry args={[1.25, 0.22, 8, 16, Math.PI]} />
                  <Std color={k ?? '#f5f5f4'} roughness={0.6} />
                </mesh>
                <mesh position={[0, 4.85, 0]}>
                  <boxGeometry args={[3.2, 0.35, 0.6]} />
                  <Std color={colors.a} roughness={0.5} />
                </mesh>
              </group>
            ))
          )}
        </group>
      );
    case 'torches':
      return (
        <group>
          {[-15.3, 15.3].map((x) =>
            [-13, -8, -3, 2, 7, 12].map((z) => (
              <group key={`${x}_${z}`} position={[x, 0, z]}>
                <mesh position={[0, 1.1, 0]}>
                  <cylinderGeometry args={[0.06, 0.08, 2.2, 6]} />
                  <Std color="#78350f" />
                </mesh>
                <mesh position={[0, 2.35, 0]}>
                  <coneGeometry args={[0.16, 0.45, 8]} />
                  <Glow color="#fb923c" intensity={3} />
                </mesh>
                <mesh position={[0, 2.25, 0]}>
                  <sphereGeometry args={[0.12, 8, 8]} />
                  <Glow color="#fde047" intensity={3} />
                </mesh>
              </group>
            ))
          )}
        </group>
      );
    case 'stone-lanterns':
      return (
        <group>
          {[-15.4, 15.4].map((x) =>
            [-12, -6, 0, 6, 12].map((z) => (
              <group key={`${x}_${z}`} position={[x, 0, z]}>
                <mesh position={[0, 0.25, 0]}>
                  <boxGeometry args={[0.8, 0.5, 0.8]} />
                  <Std color={k ?? '#a8a29e'} roughness={0.9} />
                </mesh>
                <mesh position={[0, 1.05, 0]}>
                  <cylinderGeometry args={[0.16, 0.2, 1.1, 8]} />
                  <Std color={k ?? '#a8a29e'} roughness={0.9} />
                </mesh>
                <mesh position={[0, 1.85, 0]}>
                  <boxGeometry args={[0.6, 0.5, 0.6]} />
                  <Lit color="#fbbf24" glow={1.8} />
                </mesh>
                <mesh position={[0, 2.35, 0]} rotation={[0, Math.PI / 4, 0]}>
                  <coneGeometry args={[0.65, 0.5, 4]} />
                  <Std color={k ?? '#78716c'} roughness={0.9} />
                </mesh>
              </group>
            ))
          )}
        </group>
      );
    case 'hedges':
      return (
        <group>
          {[-15.8, 15.8].map((x) => (
            <group key={x}>
              <mesh position={[x, 0.55, 0]}>
                <boxGeometry args={[0.9, 1.1, 28]} />
                <Std color={k ?? '#3f6212'} roughness={0.9} />
              </mesh>
              {[-12, -6, 0, 6, 12].map((z) => (
                <mesh key={z} position={[x, 1.6, z]}>
                  <sphereGeometry args={[0.6, 10, 8]} />
                  <Std color={k ? lighten(k, 0.08) : '#4d7c0f'} roughness={0.9} />
                </mesh>
              ))}
            </group>
          ))}
        </group>
      );
    case 'birches':
      return (
        <Forest
          kind="birch"
          leafColor={k ?? '#7a9a3a'}
          seed={51}
          spots={[-16.4, -18.2, 16.4, 18.2].flatMap((x) => [-13, -7, -1, 5, 11].map((z) => ({ position: [x, 0, z + (x > 17 || x < -17 ? 2.5 : 0)] as Vec3 })))}
        />
      );
    case 'acacia':
      return (
        <Forest
          kind="acacia"
          leafColor={k ?? '#5a7a2a'}
          seed={61}
          spots={[
            [-19, -10],
            [-21, 4],
            [19, -6],
            [22, 8],
            [-17, 14],
            [18, 15],
          ].map(([x, z]) => ({ position: [x, 0, z] as Vec3 }))}
        />
      );
    case 'baobab':
      return (
        <group>
          {[
            [-19, -10],
            [-20, 4],
            [19, -4],
            [20, 10],
          ].map(([x, z]) => (
            <group key={`${x}_${z}`} position={[x, 0, z]}>
              <mesh position={[0, 3.4, 0]}>
                <cylinderGeometry args={[0.85, 1.25, 6.8, 10]} />
                <Std color="#a16207" roughness={0.9} />
              </mesh>
              {[0, 1, 2, 3, 4].map((i) => (
                <mesh key={i} position={[Math.cos(i * 1.25) * 1.1, 7.2, Math.sin(i * 1.25) * 1.1]} rotation={[Math.sin(i) * 0.6, 0, Math.cos(i) * 0.6]}>
                  <cylinderGeometry args={[0.1, 0.18, 1.6, 5]} />
                  <Std color="#854d0e" />
                </mesh>
              ))}
              <mesh position={[0, 7.9, 0]} scale={[1, 0.35, 1]}>
                <sphereGeometry args={[1.8, 10, 6]} />
                <Std color={k ?? '#65a30d'} roughness={0.9} />
              </mesh>
            </group>
          ))}
        </group>
      );
    case 'gers':
      return (
        <group>
          {[
            [-20, -9],
            [-21, 3],
            [20, -5],
            [21, 8],
          ].map(([x, z]) => (
            <group key={`${x}_${z}`} position={[x, 0, z]}>
              <mesh position={[0, 0.85, 0]}>
                <cylinderGeometry args={[1.8, 1.8, 1.7, 16]} />
                <Std color="#f5f5f4" roughness={0.9} />
              </mesh>
              <mesh position={[0, 2.25, 0]}>
                <coneGeometry args={[1.95, 1.1, 16]} />
                <Std color={k ?? '#e7e5e4'} roughness={0.9} />
              </mesh>
              <mesh position={[0, 0.7, x > 0 ? -1.78 : 1.78]}>
                <boxGeometry args={[0.7, 1.2, 0.08]} />
                <Std color="#ea580c" />
              </mesh>
            </group>
          ))}
        </group>
      );
    case 'none':
    default:
      return null;
  }
}

/* ───────────────────────────── Canopy ───────────────────────────── */

function Canopy({ kind, colors, mood }: { kind: CanopyKit; colors: VenueColors; mood: VenueMood }) {
  const glow = mood === 'night' ? 0.85 : 0.45;
  switch (kind) {
    case 'chandeliers':
      return (
        <group>
          {[-6, 4].map((z) => (
            <group key={z} position={[0, 5.6, z]}>
              <CrystalChandelier scale={1.15} />
            </group>
          ))}
        </group>
      );
    case 'fairy-lights':
      return (
        <group>
          {/* Timber posts along both sides, festoons of warm bulbs crossing the lawn */}
          {[-14.6, 14.6].map((x) => [-8, 0, 8].map((z) => <group key={`${x}_${z}`} position={[x, 0, z]}><LightPost height={5.4} /></group>))}
          {[-8, 0, 8].map((z) => (
            <StringLights key={z} from={[-14.6, 5.3, z]} to={[14.6, 5.3, z]} sag={0.9} color={colors.ca ?? '#ffd28a'} />
          ))}
          {[-8, 0].map((z) => (
            <StringLights key={`x${z}`} from={[-14.6, 5.3, z]} to={[14.6, 5.3, z + 8]} sag={1.1} color={colors.ca ?? '#ffd28a'} />
          ))}
        </group>
      );
    case 'silk-lanterns':
      return (
        <group>
          {[-10, 0, 10].map((z) => (
            <group key={z} position={[0, 5.4, z]}>
              {/* Lacquered timber beam wrapped in a swag of silk */}
              <mesh rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.09, 0.09, 28, 12]} />
                <meshPhysicalMaterial color="#5a2a1a" roughness={0.35} clearcoat={0.8} clearcoatRoughness={0.15} />
              </mesh>
              {[-9, -3, 3, 9].map((x) => (
                <group key={x} position={[x, -1.0, 0]}>
                  <SilkLantern color={colors.ca2 ?? '#dc2626'} glow={glow * 0.9} />
                </group>
              ))}
            </group>
          ))}
        </group>
      );
    case 'paper-lanterns':
      return (
        <group>
          {[-10, -6, -2, 2, 6, 10].map((x, i) =>
            [-9, -4, 1, 6].map((z, j) => {
              const y = 4.6 + rand(i * 7 + j) * 1.4;
              const color = (i + j) % 2 ? colors.ca2 ?? '#facc15' : colors.ca ?? '#ef4444';
              return (
                <group key={`${x}_${z}`} position={[x, y, z]}>
                  <SilkLantern kind="paper" color={color} glow={glow * 0.9} />
                </group>
              );
            })
          )}
        </group>
      );
    case 'drapes':
      return (
        <group position={[0, 0, -1]}>
          <mesh position={[0, 7.4, 0]}>
            <cylinderGeometry args={[0.6, 0.9, 0.5, 12]} />
            <Std color={colors.a} metalness={0.3} roughness={0.4} />
          </mesh>
          {Array.from({ length: 10 }, (_, i) => {
            const angle = (i / 10) * Math.PI * 2;
            return (
              <group key={i} rotation={[0, angle, 0]}>
                <mesh position={[0, 6.2, 7.2]} rotation={[0.17, 0, 0]}>
                  <boxGeometry args={[2.6, 0.06, 14.5]} />
                  <Std color={i % 2 ? colors.ca2 ?? '#fef3c7' : colors.ca ?? '#ffffff'} roughness={0.85} side={THREE.DoubleSide} />
                </mesh>
              </group>
            );
          })}
        </group>
      );
    case 'bunting': {
      const palette = [colors.ca ?? '#ef4444', colors.ca2 ?? '#3b82f6', '#facc15', '#22c55e', '#ec4899'];
      return (
        <group>
          {[-9, -3, 3, 9].map((z, row) => (
            <group key={z} position={[0, 5.4, z]}>
              {Array.from({ length: 23 }, (_, i) => {
                const x = -13.2 + i * 1.2;
                const sag = -Math.cos((x / 14) * 1.2) * 0.5;
                return (
                  <mesh key={i} position={[x, sag - 0.3, 0]} rotation={[0, 0, Math.PI]}>
                    <coneGeometry args={[0.32, 0.6, 3]} />
                    <Std color={palette[(i + row) % palette.length]} roughness={0.8} side={THREE.DoubleSide} />
                  </mesh>
                );
              })}
            </group>
          ))}
        </group>
      );
    }
    case 'garlands':
      return (
        <group>
          {[-9, -3, 3, 9].map((z) => (
            <group key={z} position={[0, 5.5, z]}>
              {Array.from({ length: 29 }, (_, i) => {
                const x = -14 + i;
                return (
                  <mesh key={i} position={[x, -Math.cos((x / 14) * 1.25) * 0.7, 0]}>
                    <sphereGeometry args={[0.17, 8, 6]} />
                    <Std color={i % 2 ? colors.ca2 ?? '#facc15' : colors.ca ?? '#f97316'} roughness={0.8} />
                  </mesh>
                );
              })}
            </group>
          ))}
          {/* Hanging strands at the hall edges */}
          {[-14.6, 14.6].map((x) =>
            [-10, -4, 2, 8].map((z) =>
              Array.from({ length: 7 }, (_, i) => (
                <mesh key={`${x}_${z}_${i}`} position={[x, 5.3 - i * 0.32, z]}>
                  <sphereGeometry args={[0.13, 6, 6]} />
                  <Std color={i % 2 ? colors.ca2 ?? '#facc15' : colors.ca ?? '#f97316'} />
                </mesh>
              ))
            )
          )}
        </group>
      );
    case 'stars':
      return null; // night moods already draw a real star field (venueAtmosphere)
    case 'sky-lanterns':
      return <SkyLanterns />;
    case 'balloons':
      return <Balloons />;
    case 'aurora':
      return <Aurora />;
    case 'none':
    default:
      return null;
  }
}

function SkyLanterns() {
  const ref = useRef<THREE.Group>(null);
  const lanterns = useMemo(
    () => Array.from({ length: 46 }, (_, i) => ({ x: (rand(i) - 0.5) * 70, z: -10 - rand(i + 40) * 60, y: 6 + rand(i + 80) * 26, s: 0.4 + rand(i + 9) * 0.4 })),
    []
  );
  useFrame((_, delta) => {
    ref.current?.children.forEach((child, i) => {
      child.position.y += delta * (0.25 + (i % 5) * 0.06);
      if (child.position.y > 36) child.position.y = 6;
    });
  });
  return (
    <group ref={ref}>
      {lanterns.map((l, i) => (
        <mesh key={i} position={[l.x, l.y, l.z]} scale={l.s}>
          <cylinderGeometry args={[0.5, 0.38, 0.9, 8]} />
          <meshBasicMaterial color={i % 4 ? '#fdba74' : '#fde68a'} fog={false} />
        </mesh>
      ))}
    </group>
  );
}

function Balloons() {
  const ref = useRef<THREE.Group>(null);
  const colors = ['#ef4444', '#f59e0b', '#3b82f6', '#22c55e', '#ec4899', '#facc15', '#8b5cf6'];
  const balloons = useMemo(
    () => Array.from({ length: 12 }, (_, i) => ({ x: (rand(i + 3) - 0.5) * 90, z: -30 - rand(i + 60) * 50, y: 12 + rand(i + 21) * 22, s: 1.4 + rand(i + 7) * 1.4 })),
    []
  );
  useFrame((state) => {
    ref.current?.children.forEach((child, i) => {
      child.position.y = balloons[i].y + Math.sin(state.clock.elapsedTime * 0.3 + i) * 0.8;
    });
  });
  return (
    <group ref={ref}>
      {balloons.map((b, i) => (
        <group key={i} position={[b.x, b.y, b.z]} scale={b.s}>
          <mesh scale={[1, 1.18, 1]}>
            <sphereGeometry args={[1.6, 14, 12]} />
            <Std color={colors[i % colors.length]} roughness={0.6} />
          </mesh>
          <mesh position={[0, -2.3, 0]}>
            <boxGeometry args={[0.5, 0.4, 0.5]} />
            <Std color="#78350f" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Soft vertical glow: transparent at the bottom, bright low, fading out at the top */
function useAuroraTexture(): THREE.Texture | null {
  return useMemo(() => {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 4;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const g = ctx.createLinearGradient(0, 128, 0, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.18, 'rgba(255,255,255,0.95)');
    g.addColorStop(0.55, 'rgba(255,255,255,0.35)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 4, 128);
    return new THREE.CanvasTexture(canvas);
  }, []);
}

function AuroraBand({ color, y, z, phase, texture }: { color: string; y: number; z: number; phase: number; texture: THREE.Texture | null }) {
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(150, 16, 80, 1);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      pos.setZ(i, Math.sin(x * 0.06 + phase) * 9 + Math.sin(x * 0.17 + phase * 2) * 2.5);
    }
    geo.computeVertexNormals();
    return geo;
  }, [phase]);
  return (
    <mesh geometry={geometry} position={[0, y, z]}>
      <meshBasicMaterial
        color={color}
        alphaMap={texture ?? undefined}
        transparent
        opacity={0.55}
        side={THREE.DoubleSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        fog={false}
      />
    </mesh>
  );
}

function Aurora() {
  const ref = useRef<THREE.Group>(null);
  const texture = useAuroraTexture();
  useFrame((state) => {
    ref.current?.children.forEach((child, i) => {
      const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
      mat.opacity = 0.42 + Math.sin(state.clock.elapsedTime * 0.4 + i * 1.7) * 0.14;
    });
  });
  return (
    <group ref={ref} position={[0, 0, -70]}>
      <AuroraBand color="#34d399" y={24} z={0} phase={0} texture={texture} />
      <AuroraBand color="#2dd4bf" y={29} z={-10} phase={2.1} texture={texture} />
      <AuroraBand color="#a78bfa" y={34} z={-18} phase={4.2} texture={texture} />
    </group>
  );
}

/* ───────────────────────────── Backdrop ───────────────────────────── */

function ForestBackdrop({ leafColor }: { leafColor: string }) {
  const spots = useMemo(
    () =>
      Array.from({ length: 70 }, (_, i) => i)
        .filter((i) => !IS_HANDHELD || i % 2 === 0)
        .map((i) => ({
          position: [-70 + (i % 35) * 4 + rand(i) * 2, 0, -32 - Math.floor(i / 35) * 7 - rand(i + 3) * 4] as Vec3,
          height: 7 + rand(i + 11) * 6,
        })),
    [],
  );
  return <Forest kind="pine" leafColor={leafColor} seed={71} spots={spots} castShadow={false} />;
}

function Backdrop({ kind, colors, mood }: { kind: BackdropKit; colors: VenueColors; mood: VenueMood }) {
  const sc = colors.sc;
  switch (kind) {
    case 'sea':
      return (
        <group>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -95]}>
            <planeGeometry args={[400, 140]} />
            <Std color={sc ?? '#0ea5e9'} roughness={0.25} metalness={0.1} />
          </mesh>
          {[-30, -12, 8, 26].map((x, i) => (
            <mesh key={x} position={[x, 0.05, -27 - i * 1.5]}>
              <boxGeometry args={[14, 0.05, 0.35]} />
              <meshBasicMaterial color="#f8fafc" />
            </mesh>
          ))}
        </group>
      );
    case 'lake':
      return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-10, 0.01, -48]}>
          <planeGeometry args={[150, 40]} />
          <Std color={sc ?? '#0e7490'} roughness={0.2} metalness={0.1} />
        </mesh>
      );
    case 'mountains':
    case 'snow-peaks': {
      const peaks = [
        [-70, -95, 26],
        [-42, -110, 34],
        [-15, -100, 24],
        [12, -115, 38],
        [40, -98, 28],
        [68, -108, 32],
        [-95, -70, 22],
        [95, -75, 24],
      ];
      return (
        <group>
          {peaks.map(([x, z, h], i) => (
            <group key={i} position={[x, 0, z]}>
              <mesh position={[0, h / 2, 0]}>
                <coneGeometry args={[h * 0.9, h, 7]} />
                <Std color={sc ?? '#64748b'} roughness={0.95} />
              </mesh>
              {kind === 'snow-peaks' && (
                <mesh position={[0, h * 0.84, 0]}>
                  <coneGeometry args={[h * 0.29, h * 0.33, 7]} />
                  <Std color="#f8fafc" roughness={0.8} />
                </mesh>
              )}
            </group>
          ))}
        </group>
      );
    }
    case 'hills':
      return (
        <group>
          {[
            [-60, -75, 30],
            [-15, -85, 38],
            [35, -70, 28],
            [80, -80, 34],
            [-95, -40, 26],
            [95, -35, 26],
          ].map(([x, z, r], i) => (
            <mesh key={i} position={[x, -2, z]} scale={[1, 0.32, 1]}>
              <sphereGeometry args={[r, 18, 10]} />
              <Std color={sc ?? colors.g} roughness={0.95} />
            </mesh>
          ))}
        </group>
      );
    case 'dunes':
      return (
        <group>
          {Array.from({ length: 10 }, (_, i) => {
            const angle = -Math.PI * 0.95 + (i / 9) * Math.PI * 0.9;
            const dist = 55 + rand(i) * 30;
            return (
              <mesh key={i} position={[Math.cos(angle) * dist, -1, Math.sin(angle) * dist]} scale={[1.6, 0.28, 1]}>
                <sphereGeometry args={[16 + rand(i + 5) * 10, 16, 8]} />
                <Std color={sc ?? '#d6b07a'} roughness={1} />
              </mesh>
            );
          })}
        </group>
      );
    case 'forest':
      // Two staggered rows of real pines behind the hall (same leaf cards as the perimeter trees)
      return <ForestBackdrop leafColor={sc ?? '#2f5a2c'} />;
    case 'terraces':
      return (
        <group>
          {[
            [-45, -60],
            [40, -70],
            [-5, -95],
          ].map(([x, z], hill) => (
            <group key={hill} position={[x, 0, z]}>
              {Array.from({ length: 7 }, (_, i) => (
                <mesh key={i} position={[0, i * 1.6 + 0.8, 0]}>
                  <cylinderGeometry args={[26 - i * 3.4, 26 - i * 3.4 + 0.6, 1.6, 28]} />
                  <Std color={i % 2 ? sc ?? '#84cc16' : lighten(sc ?? '#84cc16', -0.1)} roughness={0.95} />
                </mesh>
              ))}
            </group>
          ))}
        </group>
      );
    case 'red-rocks':
      return (
        <group>
          {[
            [-55, -70, 8, 18, 'mesa'],
            [-25, -85, 4, 22, 'spire'],
            [10, -75, 10, 14, 'mesa'],
            [42, -88, 4, 26, 'spire'],
            [70, -68, 9, 16, 'mesa'],
            [-80, -40, 4, 18, 'spire'],
            [85, -40, 4, 20, 'spire'],
          ].map(([x, z, w, h, shape], i) => (
            <mesh key={i} position={[x as number, (h as number) / 2, z as number]}>
              {shape === 'mesa' ? (
                <cylinderGeometry args={[w as number, (w as number) * 1.25, h as number, 8]} />
              ) : (
                <coneGeometry args={[w as number, h as number, 8]} />
              )}
              <Std color={sc ?? '#9a3412'} roughness={0.95} />
            </mesh>
          ))}
        </group>
      );
    case 'walls':
      return (
        <group>
          {(
            [
              { pos: [0, 5, -18.5], size: [40, 10, 0.6] },
              { pos: [-19.5, 5, 0], size: [0.6, 10, 38] },
              { pos: [19.5, 5, 0], size: [0.6, 10, 38] },
            ] as Array<{ pos: Vec3; size: Vec3 }>
          ).map((w, i) => (
            <mesh key={i} position={w.pos}>
              <boxGeometry args={w.size} />
              <Std color={sc ?? '#e7e5e4'} roughness={0.85} />
            </mesh>
          ))}
          {/* Arched windows and a cornice */}
          {[-12, -4, 4, 12].map((x) => (
            <mesh key={x} position={[x, 5.5, -18.15]}>
              <planeGeometry args={[2.6, 5]} />
              <meshBasicMaterial color={mood === 'night' ? '#fbbf24' : '#bae6fd'} transparent opacity={0.55} />
            </mesh>
          ))}
          {[-19.15, 19.15].map((x) =>
            [-10, 0, 10].map((z) => (
              <mesh key={`${x}_${z}`} position={[x, 5.5, z]} rotation={[0, x > 0 ? -Math.PI / 2 : Math.PI / 2, 0]}>
                <planeGeometry args={[2.6, 5]} />
                <meshBasicMaterial color={mood === 'night' ? '#fbbf24' : '#bae6fd'} transparent opacity={0.55} />
              </mesh>
            ))
          )}
          <mesh position={[0, 10.2, -18.2]}>
            <boxGeometry args={[40.5, 0.5, 1.2]} />
            <Std color={colors.a} roughness={0.5} />
          </mesh>
        </group>
      );
    case 'old-town': {
      const houses: Array<{ x: number; z: number; w: number; h: number; ry: number }> = [];
      for (let i = 0; i < 8; i++) {
        houses.push({ x: -22.5, z: -14 + i * 4, w: 3.6, h: 4 + rand(i) * 3, ry: Math.PI / 2 });
        houses.push({ x: 22.5, z: -14 + i * 4, w: 3.6, h: 4 + rand(i + 20) * 3, ry: -Math.PI / 2 });
      }
      for (let i = 0; i < 9; i++) houses.push({ x: -16 + i * 4, z: -24, w: 3.6, h: 5 + rand(i + 40) * 4, ry: 0 });
      const walls = sc ?? '#fde68a';
      return (
        <group>
          {houses.map((h, i) => (
            <group key={i} position={[h.x, 0, h.z]} rotation={[0, h.ry, 0]}>
              <mesh position={[0, h.h / 2, 0]}>
                <boxGeometry args={[h.w, h.h, 4]} />
                <Std color={i % 3 === 1 ? lighten(walls, 0.06) : walls} roughness={0.9} />
              </mesh>
              <mesh position={[0, h.h + 0.9, 0]} rotation={[0, Math.PI / 4, 0]}>
                <coneGeometry args={[2.95, 1.8, 4]} />
                <Std color={colors.k2 ?? (i % 2 ? '#7c2d12' : '#9a3412')} roughness={0.9} />
              </mesh>
              <mesh position={[0, 1.1, 2.02]}>
                <planeGeometry args={[0.9, 2.2]} />
                <meshBasicMaterial color={mood === 'night' ? '#fbbf24' : '#57534e'} />
              </mesh>
            </group>
          ))}
        </group>
      );
    }
    case 'castle': {
      const stone = sc ?? '#d6d3d1';
      return (
        <group position={[0, 0, -75]}>
          <mesh position={[0, 9, 0]}>
            <boxGeometry args={[26, 18, 12]} />
            <Std color={stone} roughness={0.9} />
          </mesh>
          {[-15, 15].map((x) =>
            [-7, 7].map((z) => (
              <group key={`${x}_${z}`} position={[x, 0, z]}>
                <mesh position={[0, 12, 0]}>
                  <cylinderGeometry args={[3, 3.2, 24, 12]} />
                  <Std color={stone} roughness={0.9} />
                </mesh>
                <mesh position={[0, 27, 0]}>
                  <coneGeometry args={[3.6, 6, 12]} />
                  <Std color="#1e3a8a" roughness={0.6} />
                </mesh>
              </group>
            ))
          )}
          <mesh position={[0, 24, 0]}>
            <cylinderGeometry args={[2.4, 2.6, 12, 12]} />
            <Std color={stone} roughness={0.9} />
          </mesh>
          <mesh position={[0, 33, 0]}>
            <coneGeometry args={[3, 7, 12]} />
            <Std color="#1e3a8a" roughness={0.6} />
          </mesh>
        </group>
      );
    }
    case 'fields': {
      const rowColor = sc ?? '#facc15';
      return (
        <group>
          {[-1, 1].map((side) =>
            Array.from({ length: 14 }, (_, i) => (
              <mesh key={`${side}_${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[side * 45, 0.02, -60 + i * 4.6]}>
                <planeGeometry args={[55, 2.4]} />
                <Std color={i % 2 ? rowColor : '#4d7c0f'} roughness={0.95} />
              </mesh>
            ))
          )}
        </group>
      );
    }
    case 'karst':
      return (
        <group>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -80]}>
            <planeGeometry args={[400, 110]} />
            <Std color="#0e7490" roughness={0.25} metalness={0.1} />
          </mesh>
          {Array.from({ length: 14 }, (_, i) => {
            const x = -85 + i * 13 + rand(i) * 6;
            const z = -45 - rand(i + 9) * 55;
            const h = 14 + rand(i + 2) * 18;
            const r = 3.5 + rand(i + 4) * 4;
            return (
              <group key={i} position={[x, 0, z]}>
                <mesh position={[0, h / 2, 0]}>
                  <cylinderGeometry args={[r * 0.8, r, h, 9]} />
                  <Std color={sc ?? '#4d7c6f'} roughness={0.95} />
                </mesh>
                <mesh position={[0, h, 0]} scale={[1, 0.6, 1]}>
                  <sphereGeometry args={[r * 0.8, 9, 7]} />
                  <Std color={lighten(sc ?? '#4d7c6f', 0.08)} roughness={0.95} />
                </mesh>
              </group>
            );
          })}
        </group>
      );
    case 'skyline':
      return (
        <group>
          {Array.from({ length: 30 }, (_, i) => {
            const x = -75 + i * 5.2 + rand(i) * 2;
            const z = -45 - rand(i + 30) * 25;
            const h = 8 + rand(i + 60) * 32;
            const w = 3 + rand(i + 90) * 3.5;
            return (
              <mesh key={i} position={[x, h / 2, z]}>
                <boxGeometry args={[w, h, w]} />
                <Std
                  color={sc ?? '#1e293b'}
                  roughness={0.6}
                  emissive={mood === 'night' ? (i % 3 ? '#fbbf24' : '#60a5fa') : '#000000'}
                  emissiveIntensity={mood === 'night' ? 0.18 : 0}
                />
              </mesh>
            );
          })}
        </group>
      );
    case 'stupas':
      return (
        <group>
          {Array.from({ length: 16 }, (_, i) => {
            const x = -80 + i * 10.5 + rand(i) * 5;
            const z = -40 - rand(i + 13) * 50;
            const s = 1 + rand(i + 5) * 1.6;
            return (
              <group key={i} position={[x, 0, z]} scale={s}>
                <mesh position={[0, 1, 0]}>
                  <boxGeometry args={[5, 2, 5]} />
                  <Std color={sc ?? '#9a3412'} roughness={0.95} />
                </mesh>
                <mesh position={[0, 3.3, 0]} scale={[1, 1.1, 1]}>
                  <sphereGeometry args={[2, 12, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
                  <Std color={sc ?? '#9a3412'} roughness={0.95} />
                </mesh>
                <mesh position={[0, 6.6, 0]}>
                  <coneGeometry args={[0.7, 3.6, 10]} />
                  <Std color={lighten(sc ?? '#9a3412', 0.08)} roughness={0.9} />
                </mesh>
              </group>
            );
          })}
        </group>
      );
    default:
      return null;
  }
}

/* ───────────────────────────── Centerpiece ───────────────────────────── */

/** Song Hỷ (囍) disc drawn on a canvas so no 3D font is needed */
function useHyTexture(): THREE.Texture | null {
  return useMemo(() => {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.fillStyle = '#b91c1c';
    ctx.beginPath();
    ctx.arc(128, 128, 124, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#facc15';
    ctx.stroke();
    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 170px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('囍', 128, 138);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);
}

function AncestralAltar({ colors }: { colors: VenueColors }) {
  const hy = useHyTexture();
  return (
    <group position={[0, 0, -16.8]}>
      <mesh position={[0, 3.6, 0]}>
        <boxGeometry args={[9, 7.2, 0.4]} />
        <Std color={colors.cu} roughness={0.6} />
      </mesh>
      <mesh position={[0, 7.35, 0.1]}>
        <boxGeometry args={[9.6, 0.4, 0.6]} />
        <Std color="#ca8a04" metalness={0.4} roughness={0.35} />
      </mesh>
      {hy && (
        <mesh position={[0, 5.3, 0.22]}>
          <circleGeometry args={[1.5, 32]} />
          <meshBasicMaterial map={hy} />
        </mesh>
      )}
      {/* Altar table, candles and incense stand rising above the stage curtain */}
      {[-3.2, 3.2].map((x) => (
        <group key={x} position={[x, 0, 0.9]}>
          <mesh position={[0, 2.4, 0]}>
            <cylinderGeometry args={[0.12, 0.18, 4.8, 8]} />
            <Std color="#ca8a04" metalness={0.4} roughness={0.35} />
          </mesh>
          <mesh position={[0, 5.05, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 0.5, 8]} />
            <Std color="#fef2f2" />
          </mesh>
          <mesh position={[0, 5.42, 0]}>
            <coneGeometry args={[0.08, 0.22, 6]} />
            <Glow color="#fb923c" intensity={3} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Centerpiece({ kind, colors }: { kind: CenterpieceKit; colors: VenueColors }) {
  const windmillRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (windmillRef.current) windmillRef.current.rotation.z += delta * 0.4;
  });

  switch (kind) {
    case 'ancestral-altar':
      return <AncestralAltar colors={colors} />;
    case 'tea-table':
      return (
        <group position={[-8, 0, -12.6]}>
          <mesh position={[0, 0.45, 0]}>
            <boxGeometry args={[2.2, 0.12, 1.2]} />
            <Std color="#991b1b" roughness={0.5} />
          </mesh>
          {[-0.95, 0.95].map((x) =>
            [-0.45, 0.45].map((z) => (
              <mesh key={`${x}_${z}`} position={[x, 0.2, z]}>
                <boxGeometry args={[0.1, 0.4, 0.1]} />
                <Std color="#7f1d1d" />
              </mesh>
            ))
          )}
          <mesh position={[0, 0.62, 0]}>
            <sphereGeometry args={[0.18, 10, 8]} />
            <Std color="#fef3c7" roughness={0.3} />
          </mesh>
          {[-0.5, -0.25, 0.25, 0.5].map((x) => (
            <mesh key={x} position={[x, 0.56, 0.25]}>
              <cylinderGeometry args={[0.06, 0.05, 0.1, 8]} />
              <Std color="#fef3c7" roughness={0.3} />
            </mesh>
          ))}
        </group>
      );
    case 'chuppah':
      return (
        <group position={[0, 0, -16.6]}>
          {[-3, 3].map((x) =>
            [-1.6, 1.6].map((z) => (
              <mesh key={`${x}_${z}`} position={[x, 3.4, z]}>
                <cylinderGeometry args={[0.12, 0.14, 6.8, 8]} />
                <Std color="#f5f5f4" roughness={0.5} />
              </mesh>
            ))
          )}
          <mesh position={[0, 6.9, 0]}>
            <boxGeometry args={[6.6, 0.12, 3.8]} />
            <Std color="#ffffff" roughness={0.85} />
          </mesh>
          {[-3, 3].map((x) => (
            <mesh key={x} position={[x, 6.4, 0]}>
              <boxGeometry args={[0.1, 1, 3.6]} />
              <Std color="#f8fafc" roughness={0.85} transparent opacity={0.85} />
            </mesh>
          ))}
          {[-2.4, -1.2, 0, 1.2, 2.4].map((x) => (
            <mesh key={x} position={[x, 7.05, 1.9]}>
              <sphereGeometry args={[0.32, 8, 8]} />
              <Std color={x === 0 ? colors.pe || '#fda4af' : '#ffffff'} roughness={0.7} />
            </mesh>
          ))}
        </group>
      );
    case 'mandap':
      return (
        <group position={[0, 0, -16.8]}>
          {[-3.2, 3.2].map((x) =>
            [-1.8, 1.8].map((z) => (
              <group key={`${x}_${z}`} position={[x, 0, z]}>
                <mesh position={[0, 3.4, 0]}>
                  <cylinderGeometry args={[0.28, 0.34, 6.8, 10]} />
                  <Std color={colors.a} metalness={0.25} roughness={0.45} />
                </mesh>
                {[1.5, 3.4, 5.3].map((y) => (
                  <mesh key={y} position={[0, y, 0]}>
                    <torusGeometry args={[0.36, 0.08, 6, 14]} />
                    <Std color="#f97316" roughness={0.8} />
                  </mesh>
                ))}
              </group>
            ))
          )}
          <mesh position={[0, 7, 0]}>
            <boxGeometry args={[7.2, 0.4, 4.4]} />
            <Std color={colors.a} metalness={0.25} roughness={0.45} />
          </mesh>
          <mesh position={[0, 7.2, 0]}>
            <sphereGeometry args={[2.1, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <Std color={colors.cu} roughness={0.6} />
          </mesh>
          <mesh position={[0, 9.5, 0]}>
            <coneGeometry args={[0.25, 0.9, 8]} />
            <Std color="#facc15" metalness={0.4} roughness={0.35} />
          </mesh>
        </group>
      );
    case 'floral-arch':
      return (
        <group position={[0, 0, -16.4]}>
          <mesh position={[0, 3.6, 0]}>
            <torusGeometry args={[3.6, 0.3, 10, 28, Math.PI]} />
            <Std color="#f5f5f4" roughness={0.6} />
          </mesh>
          {[-3.6, 3.6].map((x) => (
            <mesh key={x} position={[x, 1.8, 0]}>
              <cylinderGeometry args={[0.3, 0.32, 3.6, 10]} />
              <Std color="#f5f5f4" roughness={0.6} />
            </mesh>
          ))}
          {Array.from({ length: 15 }, (_, i) => {
            const a = (i / 14) * Math.PI;
            return (
              <mesh key={i} position={[Math.cos(a) * 3.6, 3.6 + Math.sin(a) * 3.6, 0.2]}>
                <sphereGeometry args={[0.42, 10, 8]} />
                <Std color={i % 3 === 0 ? '#ffffff' : colors.pe || '#fda4af'} roughness={0.75} />
              </mesh>
            );
          })}
        </group>
      );
    case 'torii':
      return (
        <group position={[0, 0, -17.8]}>
          {[-3.4, 3.4].map((x) => (
            <mesh key={x} position={[x, 4, 0]}>
              <cylinderGeometry args={[0.32, 0.38, 8, 12]} />
              <Std color="#dc2626" roughness={0.5} />
            </mesh>
          ))}
          <mesh position={[0, 6.4, 0]}>
            <boxGeometry args={[7.6, 0.4, 0.4]} />
            <Std color="#dc2626" roughness={0.5} />
          </mesh>
          <mesh position={[0, 7.9, 0]}>
            <boxGeometry args={[9.6, 0.55, 0.7]} />
            <Std color="#dc2626" roughness={0.5} />
          </mesh>
          <mesh position={[0, 8.3, 0]}>
            <boxGeometry args={[10.2, 0.3, 0.8]} />
            <Std color="#1c1917" roughness={0.6} />
          </mesh>
        </group>
      );
    case 'gazebo':
      return (
        <group position={[-21, 0, -7]}>
          <mesh position={[0, 0.15, 0]}>
            <cylinderGeometry args={[3.4, 3.6, 0.3, 6]} />
            <Std color="#e7e5e4" roughness={0.8} />
          </mesh>
          {Array.from({ length: 6 }, (_, i) => {
            const a = (i / 6) * Math.PI * 2;
            return (
              <mesh key={i} position={[Math.cos(a) * 3, 1.9, Math.sin(a) * 3]}>
                <cylinderGeometry args={[0.12, 0.14, 3.2, 8]} />
                <Std color="#fafaf9" roughness={0.6} />
              </mesh>
            );
          })}
          <mesh position={[0, 4.4, 0]}>
            <coneGeometry args={[4, 2.2, 6]} />
            <Std color={colors.a} roughness={0.7} />
          </mesh>
        </group>
      );
    case 'fountain':
      return (
        <group>
          {[-20, 20].map((x) => (
            <group key={x} position={[x, 0, -9]}>
              <mesh position={[0, 0.35, 0]}>
                <cylinderGeometry args={[2.4, 2.6, 0.7, 20]} />
                <Std color="#e7e5e4" roughness={0.7} />
              </mesh>
              <mesh position={[0, 0.72, 0]}>
                <cylinderGeometry args={[2.2, 2.2, 0.05, 20]} />
                <Std color="#38bdf8" roughness={0.15} transparent opacity={0.85} />
              </mesh>
              <mesh position={[0, 1.5, 0]}>
                <cylinderGeometry args={[0.25, 0.35, 1.6, 10]} />
                <Std color="#e7e5e4" roughness={0.7} />
              </mesh>
              <mesh position={[0, 2.35, 0]}>
                <cylinderGeometry args={[1, 0.6, 0.3, 16]} />
                <Std color="#e7e5e4" roughness={0.7} />
              </mesh>
              <mesh position={[0, 2.9, 0]}>
                <sphereGeometry args={[0.35, 10, 8]} />
                <Std color="#bae6fd" roughness={0.15} transparent opacity={0.7} />
              </mesh>
            </group>
          ))}
        </group>
      );
    case 'stone-circle':
      return (
        <group position={[-26, 0, -6]}>
          {Array.from({ length: 11 }, (_, i) => {
            const a = (i / 11) * Math.PI * 2;
            const h = 2.6 + rand(i) * 1.4;
            return (
              <mesh key={i} position={[Math.cos(a) * 6, h / 2, Math.sin(a) * 6]} rotation={[0, -a, rand(i + 3) * 0.08]}>
                <boxGeometry args={[1, h, 0.6]} />
                <Std color="#78716c" roughness={0.95} />
              </mesh>
            );
          })}
        </group>
      );
    case 'poruwa':
      return (
        <group position={[0, 0, -16.8]} scale={1.6}>
          <mesh position={[0, 0.4, 0]}>
            <boxGeometry args={[3.4, 0.8, 2.6]} />
            <Std color="#fef3c7" roughness={0.6} />
          </mesh>
          {[-1.5, 1.5].map((x) =>
            [-1.1, 1.1].map((z) => (
              <mesh key={`${x}_${z}`} position={[x, 2.1, z]}>
                <cylinderGeometry args={[0.1, 0.12, 2.6, 8]} />
                <Std color={colors.a} metalness={0.3} roughness={0.4} />
              </mesh>
            ))
          )}
          <mesh position={[0, 3.8, 0]} rotation={[0, Math.PI / 4, 0]}>
            <coneGeometry args={[2.6, 1.4, 4]} />
            <Std color={colors.a} metalness={0.3} roughness={0.4} />
          </mesh>
          {[-1.2, -0.4, 0.4, 1.2].map((x) => (
            <mesh key={x} position={[x, 3.25, 1.2]}>
              <sphereGeometry args={[0.2, 8, 8]} />
              <Std color="#ffffff" />
            </mesh>
          ))}
        </group>
      );
    case 'pelamin':
      return (
        <group position={[0, 0, -16.9]}>
          <mesh position={[0, 3.8, 0]}>
            <boxGeometry args={[9, 7.6, 0.4]} />
            <Std color={colors.cu} roughness={0.5} />
          </mesh>
          <mesh position={[0, 4.8, 0.25]}>
            <torusGeometry args={[3.2, 0.25, 10, 28, Math.PI]} />
            <Std color={colors.a} metalness={0.45} roughness={0.3} />
          </mesh>
          {[-4.3, 4.3].map((x) => (
            <mesh key={x} position={[x, 3.8, 0.3]}>
              <boxGeometry args={[0.4, 7.6, 0.3]} />
              <Std color={colors.a} metalness={0.45} roughness={0.3} />
            </mesh>
          ))}
          {[-1.8, 0, 1.8].map((x) => (
            <mesh key={x} position={[x, 7.9, 0.3]}>
              <sphereGeometry args={[0.35, 10, 8]} />
              <Std color={colors.a} metalness={0.45} roughness={0.3} />
            </mesh>
          ))}
        </group>
      );
    case 'split-gate':
      return (
        <group position={[0, 0, -17.8]}>
          {[-2.6, 2.6].map((x) => (
            <group key={x} position={[x, 0, 0]}>
              {Array.from({ length: 6 }, (_, i) => (
                <mesh key={i} position={[x > 0 ? i * 0.12 : -i * 0.12, 0.8 + i * 1.5, 0]}>
                  <boxGeometry args={[3.2 - i * 0.42, 1.5, 2.6 - i * 0.3]} />
                  <Std color={i % 2 ? '#78716c' : '#57534e'} roughness={0.95} />
                </mesh>
              ))}
            </group>
          ))}
        </group>
      );
    case 'maypole':
      return (
        <group position={[0, 0, -17.6]}>
          <mesh position={[0, 4.6, 0]}>
            <cylinderGeometry args={[0.16, 0.2, 9.2, 8]} />
            <Std color="#f5f5f4" roughness={0.6} />
          </mesh>
          <mesh position={[0, 7.4, 0]}>
            <boxGeometry args={[4.6, 0.2, 0.2]} />
            <Std color="#f5f5f4" roughness={0.6} />
          </mesh>
          {[-2.1, 2.1].map((x) => (
            <mesh key={x} position={[x, 6.3, 0]}>
              <torusGeometry args={[0.9, 0.16, 8, 18]} />
              <Std color="#4d7c0f" roughness={0.9} />
            </mesh>
          ))}
          {Array.from({ length: 10 }, (_, i) => (
            <mesh key={i} position={[0, 1 + i * 0.85, 0.2]}>
              <sphereGeometry args={[0.22, 8, 6]} />
              <Std color={i % 2 ? '#facc15' : '#ffffff'} />
            </mesh>
          ))}
        </group>
      );
    case 'windmill':
      return (
        <group position={[-24, 0, -22]}>
          <mesh position={[0, 5, 0]}>
            <cylinderGeometry args={[1.6, 2.6, 10, 8]} />
            <Std color="#78350f" roughness={0.85} />
          </mesh>
          <mesh position={[0, 10.8, 0]}>
            <coneGeometry args={[2, 2.4, 8]} />
            <Std color="#57534e" roughness={0.8} />
          </mesh>
          <group ref={windmillRef} position={[0, 9.5, 2.2]}>
            {[0, 1, 2, 3].map((i) => (
              <mesh key={i} rotation={[0, 0, (i * Math.PI) / 2]} position={[0, 0, 0]}>
                <boxGeometry args={[0.6, 11, 0.12]} />
                <Std color="#f5f5f4" roughness={0.7} />
              </mesh>
            ))}
          </group>
        </group>
      );
    case 'barn':
      return (
        <group position={[0, 0, -24]}>
          <mesh position={[0, 4, 0]}>
            <boxGeometry args={[14, 8, 9]} />
            <Std color="#b91c1c" roughness={0.85} />
          </mesh>
          <mesh position={[0, 9.4, 0]} rotation={[Math.PI / 2, 0, Math.PI / 2]} scale={[1, 1, 1]}>
            <cylinderGeometry args={[5.4, 5.4, 14.4, 3]} />
            <Std color="#44403c" roughness={0.85} />
          </mesh>
          <mesh position={[0, 3, 4.55]}>
            <planeGeometry args={[4, 6]} />
            <Std color="#fafaf9" roughness={0.8} />
          </mesh>
        </group>
      );
    case 'glasshouse':
      return (
        <group position={[-21.5, 0, -7]}>
          <mesh position={[0, 2.4, 0]}>
            <boxGeometry args={[6, 4.8, 8]} />
            <Std color="#e0f2fe" roughness={0.1} transparent opacity={0.28} />
          </mesh>
          <mesh position={[0, 5.6, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[3.4, 3.4, 8, 3]} />
            <Std color="#e0f2fe" roughness={0.1} transparent opacity={0.28} />
          </mesh>
          {[-2.6, 0, 2.6].map((z) =>
            [-1.8, 1.8].map((x) => (
              <mesh key={`${x}_${z}`} position={[x, 0.7, z]}>
                <sphereGeometry args={[0.7, 8, 6]} />
                <Std color={z === 0 ? '#c084fc' : '#4d7c0f'} roughness={0.8} />
              </mesh>
            ))
          )}
        </group>
      );
    case 'none':
    default:
      return null;
  }
}

/* ───────────────────────────── Gate ───────────────────────────── */

/** Reception gate drawn by the GATE_RECEPTION prefab (local coordinates, facing +z) */
export function VenueGate({ theme }: { theme: VenueTheme }) {
  const { colors } = theme;
  switch (theme.kits.g) {
    case 'coconut':
      return <CoconutLeafGate banner={colors.a} />;
    case 'lacquer':
      return (
        <group>
          {[-1.6, 1.6].map((x) => (
            <mesh key={x} position={[x, 1.5, 0]}>
              <cylinderGeometry args={[0.2, 0.24, 3, 10]} />
              <Std color={colors.k ?? '#b91c1c'} roughness={0.45} />
            </mesh>
          ))}
          <mesh position={[0, 2.95, 0]}>
            <boxGeometry args={[4.2, 0.28, 0.4]} />
            <Std color={colors.k ?? '#b91c1c'} roughness={0.45} />
          </mesh>
          {/* Small gabled tile roof: two slabs and a ridge */}
          {[-1, 1].map((side) => (
            <mesh key={side} position={[0, 3.3, side * 0.32]} rotation={[side * 0.38, 0, 0]}>
              <boxGeometry args={[4.8, 0.14, 0.78]} />
              <Std color="#44403c" roughness={0.8} />
            </mesh>
          ))}
          <mesh position={[0, 3.48, 0]}>
            <boxGeometry args={[5, 0.16, 0.18]} />
            <Std color="#292524" roughness={0.8} />
          </mesh>
          <mesh position={[0, 2.5, 0.2]}>
            <boxGeometry args={[1.3, 0.5, 0.1]} />
            <Std color="#ca8a04" metalness={0.35} roughness={0.35} />
          </mesh>
        </group>
      );
    case 'stone-arch':
      return (
        <group>
          {[-1.7, 1.7].map((x) => (
            <mesh key={x} position={[x, 1.3, 0]}>
              <boxGeometry args={[0.6, 2.6, 0.6]} />
              <Std color={colors.k ?? '#e7e5e4'} roughness={0.85} />
            </mesh>
          ))}
          <mesh position={[0, 2.6, 0]}>
            <torusGeometry args={[1.7, 0.3, 8, 18, Math.PI]} />
            <Std color={colors.k ?? '#e7e5e4'} roughness={0.85} />
          </mesh>
          <mesh position={[0, 4.35, 0.05]}>
            <boxGeometry args={[0.5, 0.45, 0.65]} />
            <Std color={colors.a} roughness={0.5} />
          </mesh>
        </group>
      );
    case 'palm-arch':
      return (
        <group>
          {[-1.6, 1.6].map((x) => (
            <mesh key={x} position={[x, 1.4, 0]} rotation={[0, 0, x > 0 ? -0.06 : 0.06]}>
              <cylinderGeometry args={[0.12, 0.16, 2.8, 8]} />
              <Std color="#a16207" roughness={0.85} />
            </mesh>
          ))}
          <mesh position={[0, 2.85, 0]}>
            <boxGeometry args={[3.6, 0.18, 0.2]} />
            <Std color="#a16207" roughness={0.85} />
          </mesh>
          {[-1.6, -0.8, 0, 0.8, 1.6].map((x, i) => (
            <mesh key={x} position={[x, 3.1, 0]} rotation={[0.3, 0, (i - 2) * -0.35]}>
              <boxGeometry args={[0.28, 1.3, 0.06]} />
              <Std color="#16a34a" />
            </mesh>
          ))}
          {[-1.25, 1.25].map((x) => (
            <mesh key={x} position={[x, 2.1, 0.12]}>
              <boxGeometry args={[0.6, 1.5, 0.03]} />
              <Std color="#ffffff" roughness={0.9} transparent opacity={0.85} />
            </mesh>
          ))}
        </group>
      );
    case 'bamboo':
      return (
        <group>
          {[-1.6, 1.6].map((x) =>
            [-0.12, 0.12].map((dx) => (
              <mesh key={`${x}_${dx}`} position={[x + dx, 1.5, 0]}>
                <cylinderGeometry args={[0.08, 0.09, 3, 6]} />
                <Std color="#65a30d" />
              </mesh>
            ))
          )}
          {[2.7, 2.95].map((y) => (
            <mesh key={y} position={[0, y, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.08, 0.08, 3.8, 6]} />
              <Std color="#4d7c0f" />
            </mesh>
          ))}
          {[-1.2, -0.4, 0.4, 1.2].map((x) => (
            <mesh key={x} position={[x, 2.45, 0.1]}>
              <sphereGeometry args={[0.18, 8, 6]} />
              <Std color={colors.ca ?? colors.a} />
            </mesh>
          ))}
        </group>
      );
    case 'floral':
    default: {
      const petal = colors.pe || naturalTone(colors.a, 0.45, 0.35);
      const flowers = [naturalTone(petal, 0.1, 0.2), naturalTone(colors.a, 0.3, 0.3), '#f7f1e6', '#f3d7dc', naturalTone(petal, 0.35, 0.3)];
      return <FloralArch width={3.2} height={3.1} flowers={flowers} seed={hashSeed(theme.id)} />;
    }
  }
}

/* ───────────────────────────── Environment & lighting ───────────────────────────── */

export function VenueEnvironment({ theme }: { theme: VenueTheme }) {
  const { colors, kits, mood } = theme;
  return (
    <group>
      {/* Ground beyond the 30 m hall */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        {/* Reaches the horizon so the photographed sky never shows below it */}
        <planeGeometry args={[2400, 2400]} />
        <SurfaceMaterial color={colors.g} theme={theme} role="ground" size={2400} />
      </mesh>

      {/* Hall floor border */}
      {(
        [
          { pos: [0, 0.03, -15], size: [30.3, 0.06, 0.25] },
          { pos: [0, 0.03, 15], size: [30.3, 0.06, 0.25] },
          { pos: [-15, 0.03, 0], size: [0.25, 0.06, 30.3] },
          { pos: [15, 0.03, 0], size: [0.25, 0.06, 30.3] },
        ] as Array<{ pos: Vec3; size: Vec3 }>
      ).map((edge, idx) => (
        <mesh key={idx} position={edge.pos}>
          <boxGeometry args={edge.size} />
          {/* Stone kerb edging the floor, not a painted stripe */}
          <Std color="#a39d92" roughness={0.85} />
        </mesh>
      ))}

      {kits.b.map((b) => (
        <Backdrop key={b} kind={b} colors={colors} mood={mood} />
      ))}
      <WindClock />
      {mood !== 'indoor' && <GroundCover theme={theme} />}
      {mood !== 'indoor' && kits.b.length === 0 && !snowyOrDesert(theme) && (
        <DistantTreeline leafColor={lighten(colors.g, -0.08)} kind={kits.p === 'pines' ? 'pine' : kits.p === 'palms' ? 'palm' : 'broadleaf'} />
      )}
      {mood === 'indoor' && <BallroomWalls wallColor={naturalTone(colors.f, 0.15, 0.3)} drape={naturalTone(colors.c, 0, 0.15)} />}
      <Perimeter kind={kits.p} colors={colors} />
      <Canopy kind={kits.c} colors={colors} mood={mood} />
      <Centerpiece kind={kits.ce} colors={colors} />
    </group>
  );
}

function naturalGrass(hex: string): string {
  const c = new THREE.Color(hex);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  c.setHSL(Math.min(Math.max(hsl.h, 0.2), 0.3), Math.min(hsl.s, 0.38), Math.min(hsl.l, 0.4));
  return `#${c.getHexString()}`;
}

/** Photo-scanned trees at the given spots, the procedural trees standing in until they load */
function ScannedTrees({ ids, spots, height, fallback }: { ids: string[]; spots: Array<{ position: Vec3 }>; height: number; fallback: React.ReactNode }) {
  const ready = usePhReady(ids[0]);
  const byId = useMemo(
    () =>
      ids.map((id, k) =>
        spots
          .filter((_, i) => i % ids.length === k)
          .map((sp, i) => ({ position: sp.position, rotationY: rand(i * 13 + k) * Math.PI * 2, scale: 0.85 + rand(i * 7 + k) * 0.35 })),
      ),
    [ids, spots],
  );
  if (!ready) return <>{fallback}</>;
  return (
    <group>
      {ids.map((id, k) => (
        <PhScatter key={id} id={id} items={byId[k]} height={height} />
      ))}
    </group>
  );
}

/**
 * The land around an outdoor hall as it really looks: clumps of long grass, wildflowers,
 * shrubs, ferns and mossy rocks (all photo-scanned), thick at the hall's edge and thinning
 * out into the distance.
 */
function GroundCover({ theme }: { theme: VenueTheme }) {
  const kind = surfaceFor(theme.colors.g, theme, 'ground');
  const open = theme.kits.b.length === 0;
  const outer = open ? 44 : 19;
  const sets = useMemo(() => {
    const out: Array<{ id: string; items: ScatterItem[] }> = [];
    if (kind === 'grass') {
      out.push({ id: 'grass_medium_01', items: ringScatter(open ? 300 : 110, 15.7, outer, 11, [0.7, 1.3]) });
      out.push({ id: 'grass_medium_02', items: ringScatter(open ? 220 : 80, 15.7, outer, 12, [0.8, 1.4]) });
      out.push({ id: 'flower_gazania', items: ringScatter(open ? 90 : 40, 15.8, Math.min(outer, 30), 13, [0.8, 1.2]) });
      out.push({ id: 'fern_02', items: ringScatter(open ? 60 : 20, 16.5, outer, 14, [0.8, 1.3]) });
      out.push({ id: 'shrub_02', items: ringScatter(open ? 36 : 10, 17.5, outer, 15, [0.8, 1.3]) });
      out.push({ id: 'shrub_04', items: ringScatter(open ? 50 : 14, 16.2, outer, 16, [1.2, 2]) });
      if (open) out.push({ id: 'rock_moss_set_01', items: ringScatter(16, 20, outer, 17, [0.7, 1.2]) });
    } else if (kind === 'sand') {
      out.push({ id: 'grass_medium_02', items: ringScatter(open ? 120 : 40, 16, outer, 21, [0.7, 1.2]) });
      if (open) out.push({ id: 'rock_moss_set_01', items: ringScatter(10, 20, outer, 22, [0.6, 1]) });
    } else if (kind === 'snow') {
      if (open) out.push({ id: 'rock_moss_set_01', items: ringScatter(10, 20, outer, 23, [0.6, 1]) });
    }
    return out;
  }, [kind, open, outer]);
  return (
    <group>
      {sets.map((s) => (
        <PhScatter key={s.id} id={s.id} items={s.items} variants castShadow={s.id.startsWith('shrub') || s.id.startsWith('rock')} />
      ))}
      {kind === 'grass' && open && (
        <PhScatter
          id="boulder_01"
          items={ringScatter(5, 24, 42, 18, [0.8, 1.4])}
        />
      )}
    </group>
  );
}

/** Venues on snow or sand have no woodland on the horizon */
function snowyOrDesert(theme: VenueTheme): boolean {
  const g = new THREE.Color(theme.colors.g);
  const hsl = { h: 0, s: 0, l: 0 };
  g.getHSL(hsl);
  return hsl.l > 0.7 || (hsl.h > 0.06 && hsl.h < 0.16 && hsl.s > 0.3);
}

function hashSeed(str: string): number {
  let h = 7;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h % 10000;
}

/** Lighten (amount > 0) or darken (amount < 0) a hex colour */
export function lighten(hex: string, amount: number): string {
  const c = new THREE.Color(hex);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  c.setHSL(hsl.h, hsl.s, Math.max(0, Math.min(1, hsl.l + amount)));
  return `#${c.getHexString()}`;
}
