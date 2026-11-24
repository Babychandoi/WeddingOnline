'use client';

import { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { IS_HANDHELD } from './deviceTier';
import { detailNormal, detailRoughness } from './pbr';
import { PhScatter, usePhReady, type ScatterItem } from './phAssets';
import { Forest, WindClock, type TreeSpot } from './realNature';
import { InstancedSet } from './realProps';
import { painted, wood } from './realMaterials';

type Vec3 = [number, number, number];
type Part = { position: Vec3; scale: Vec3; rotation?: Vec3; color?: string };
type House = { x: number; z: number; yaw: number; width: number; height: number; depth: number; color: string };
type Lantern = { position: Vec3; size: number; color: string; length: number; drop: boolean };

const BOX = new THREE.BoxGeometry(1, 1, 1);
const TILE = new THREE.CylinderGeometry(0.5, 0.5, 1, 9, 1, false, 0, Math.PI);
const CAP = new THREE.CylinderGeometry(1, 1.13, 1, 12);
const BULB = new THREE.SphereGeometry(1, 8, 6);
const WOOD = wood('#c8a388', 0.19);
const STONE = painted('#c5b6a4', 0.83);
const GLAZING = new THREE.MeshBasicMaterial({ color: '#ffffff' });
const TILE_MATERIAL = new THREE.MeshStandardMaterial({ color: '#c5aba1', roughness: 0.93, side: THREE.DoubleSide });
const SILK = new THREE.MeshBasicMaterial({ vertexColors: true });
const BRASS = new THREE.MeshStandardMaterial({ color: '#b8a18c', roughness: 0.58, metalness: 0.4 });
const CABLE = new THREE.MeshStandardMaterial({ color: '#252222', roughness: 0.92 });
const FAIRY = new THREE.MeshBasicMaterial({ color: new THREE.Color(3.3, 2.08, 0.93), toneMapped: false });
const ASSET_ROOT = '/assets/venues/hoi-an';
const STREET_WIDTH = 11.4;
const STREET_LENGTH = 91;
const STREET_Z = -25;

function random(seed: number) {
  const value = Math.sin(seed * 12.9898 + 43.211) * 43758.5453;
  return value - Math.floor(value);
}

function silkGeometry(drop: boolean) {
  const stations: THREE.Vector2[] = [];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    const arch = Math.sin(t * Math.PI);
    const side = drop ? arch ** 0.68 * (0.47 + 0.76 * t) : arch ** 0.84 * (0.83 + 0.22 * t);
    const neck = drop ? 0.075 + 0.075 * t : 0.17;
    stations.push(new THREE.Vector2(neck + 0.81 * side, t - 0.5));
  }
  const mesh = new THREE.LatheGeometry(stations, IS_HANDHELD ? 36 : 48);
  const position = mesh.attributes.position;
  const colors = new Float32Array(position.count * 3);
  for (let i = 0; i < position.count; i++) {
    const angle = Math.atan2(position.getX(i), position.getZ(i));
    const y = position.getY(i);
    const ribs = Math.abs(Math.cos(angle * 6));
    const fabric = 0.976 - 0.048 * (1 - ribs ** 0.35);
    position.setXYZ(i, position.getX(i) * fabric, y, position.getZ(i) * fabric);
    const gradient = Math.cos(y * Math.PI) ** 0.57;
    const filament = 0.19 + 1.13 * gradient - 0.31 * gradient * ribs ** 16;
    colors.set([filament, filament * (1 - 0.08 * y), filament * (1 - 0.06 * y)], i * 3);
  }
  mesh.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  mesh.computeVertexNormals();
  return mesh;
}

const SILK_BODY = silkGeometry(false);
const SILK_DROP = silkGeometry(true);

function useLocalTexture(file: string, x = 1, y = 1) {
  const [texture, setTexture] = useState<THREE.Texture>();
  useEffect(() => {
    let alive = true;
    const loaded = new THREE.TextureLoader().load(`${ASSET_ROOT}/${file}`, (result) => {
      if (!alive) return;
      result.colorSpace = THREE.SRGBColorSpace;
      result.wrapS = result.wrapT = THREE.MirroredRepeatWrapping;
      result.repeat.set(x, y);
      result.anisotropy = IS_HANDHELD ? 2 : 8;
      result.needsUpdate = true;
      setTexture(result);
    }, undefined, () => setTexture(undefined));
    return () => {
      alive = false;
      loaded.dispose();
    };
  }, [file, x, y]);
  return texture;
}

function lamp(color: string, position: Vec3, size: number, length = 1.2, drop = false): Lantern {
  return { color, position, size, length, drop };
}

const AMBER = '#ffbd49';
const CORAL = '#ed532f';
const PINK = '#f62144';
const BLUE = '#289cf5';
const CREAM = '#ffe0a1';
const CLOSE_ROWS = [
  [BLUE, CREAM, BLUE, BLUE, BLUE, BLUE, BLUE],
  [CORAL, BLUE, AMBER, CORAL, BLUE, AMBER, CORAL, BLUE, BLUE],
  [PINK, AMBER, CORAL, PINK, CREAM, AMBER, PINK, BLUE, BLUE],
  [AMBER, CORAL, CORAL, AMBER, CREAM, PINK, AMBER, BLUE],
];

function buildStreetLanterns() {
  const lanes: Lantern[] = [];
  const wires: THREE.Curve<THREE.Vector3>[] = [];
  const colors = [CREAM, CORAL, PINK, AMBER, BLUE, AMBER];
  for (let row = 0; row < 13; row++) {
    const z = 9.3 - row * (row < 4 ? 3.52 : 4.18);
    const height = 4.62 + 0.34 * Math.sin(row * 1.89);
    const wireLength = 6.05 - (row % 3) * 0.11;
    const sag = 0.32 + random(row) * 0.26;
    const cross = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-wireLength, height + 0.1, z + 0.29),
      new THREE.Vector3(0.08, height - sag * 2.0, z),
      new THREE.Vector3(wireLength, height + 0.39, z - 0.17),
    );
    wires.push(cross);
    const rowColors = CLOSE_ROWS[row] ?? colors;
    for (let i = 0; i < rowColors.length; i++) {
      const s = (i + 0.55 + random(row * 67 + i) * 0.27) / rowColors.length;
      const point = cross.getPoint(s);
      const color = rowColors[i];
      const size = 0.25 + random(i * 21 + row * 70) * 0.13 + (row === 0 ? 0.075 : 0);
      const drop = (row + i * 2) % 4 === 1 || (i >= rowColors.length - 3 && (row + i) % 3 !== 0);
      const length = (drop ? 1.66 : 1.12) + random(i * 53 + row) * 0.34;
      lanes.push(lamp(color, [point.x, point.y - size * (0.12 + length * 0.5), point.z], size, length, drop));
    }
  }
  return { lanes, wires };
}

const STREET_LANTERNS = buildStreetLanterns();

function LanternBatches({ lamps }: { lamps: Lantern[] }) {
  const { bodies, drops, caps, strings } = useMemo(() => {
    const bodies: Part[] = [];
    const drops: Part[] = [];
    const caps: Part[] = [];
    const strings: Part[] = [];
    for (const { position, size, color, length, drop } of lamps) {
      const [x, y, z] = position;
      const height = size * length;
      (drop ? drops : bodies).push({ position, color, scale: [size, height, size] });
      caps.push({ position: [x, y + height * 0.53, z], scale: [size * 0.22, size * 0.073, size * 0.22] });
      caps.push({ position: [x, y - height * 0.53, z], scale: [size * 0.20, size * 0.086, size * 0.20] });
      strings.push({ position: [x, y + height * 0.64, z], scale: [0.006, size * 0.42, 0.006] });
      strings.push({ position: [x, y - height * 0.70, z], scale: [0.013, size * 0.45, 0.013] });
    }
    return { bodies, drops, caps, strings };
  }, [lamps]);

  return (
    <>
      <InstancedSet geometry={SILK_BODY} material={SILK} items={bodies} castShadow={false} />
      {drops.length > 0 && <InstancedSet geometry={SILK_DROP} material={SILK} items={drops} castShadow={false} />}
      <InstancedSet geometry={CAP} material={BRASS} items={caps} castShadow={false} />
      <InstancedSet geometry={CAP} material={CABLE} items={strings} castShadow={false} />
    </>
  );
}

function makeHouses(live: boolean) {
  const houses: House[] = [];
  const warm = ['#bd823e', '#764f33', '#b9874d', '#92704b', '#aa8a59', '#996442'];
  function sideHouses(side: number, front: number, count: number) {
    let z = live ? 13.5 : 16;
    for (let i = 0; i < count; i++) {
      const seed = i + (side === -1 ? 67 : 9);
      const width = 3.55 + random(seed + 37) * 1.65;
      houses.push({
        x: side * (front + random(seed + 51) * 0.73),
        z: z - width * 0.5,
        yaw: -side * Math.PI / 2,
        width,
        height: 4.1 + random(seed + 129) * 1.45,
        depth: 4 + random(seed + 49) * 1.8,
        color: warm[seed % warm.length],
      });
      z -= width + 0.13 + random(seed + 71) * 0.16;
    }
  }
  sideHouses(-1, live ? 17.33 : 6.4, live ? 6 : 17);
  sideHouses(1, live ? 17.33 : 6.4, live ? 6 : 17);
  for (let i = 0; i < 7; i++) {
    houses.push({ x: (i - 3) * 4.6, z: live ? -17.65 : -60.4, yaw: 0, width: 4.4, height: 4.25 + random(i + 50) * 1.4, depth: 4.4, color: warm[(i + 2) % warm.length] });
  }
  return houses;
}

const STREET_HOUSES = makeHouses(false);
const HALL_HOUSES = makeHouses(true);

function buildTown(houses: House[], live: boolean) {
  const walls: Part[] = [];
  const foundation: Part[] = [];
  const lintels: Part[] = [];
  const doors: Part[] = [];
  const windows: Part[] = [];
  const roof: Part[] = [];
  const roofTiles: Part[] = [];
  const lamps: Lantern[] = [];

  houses.forEach((house, i) => {
    const { x, z, yaw, width, height, depth, color } = house;
    const cos = Math.cos(yaw);
    const sin = Math.sin(yaw);
    const point = (px: number, py: number, pz: number): Vec3 => [x + px * cos + pz * sin, py, z - px * sin + pz * cos];
    const put = (out: Part[], px: number, py: number, pz: number, scale: Vec3, tint: string, tilt = 0) => {
      out.push({ position: point(px, py, pz), rotation: [tilt, yaw, 0], scale, color: tint });
    };
    const ash = i % 3 === 0 ? '#555054' : '#595153';
    const woodwork = i % 5 === 2 ? '#4d5150' : i % 5 === 4 ? '#65452f' : '#4a352b';
    const roofColor = i % 4 === 1 ? '#603f33' : '#49433e';
    const widthWithEave = width + 0.28;

    put(walls, 0, height * 0.5, -depth * 0.5, [width, height, depth], color);
    put(foundation, 0, 0.17, 0.11, [width + 0.03, 0.34, 0.27], ash);
    put(foundation, 0, 0.13, 0.37, [width * 0.91, 0.15, 0.48], '#9a8b78');
    put(lintels, 0, 2.59, 0.14, [width + 0.1, 0.17, 0.35], woodwork);
    put(lintels, 0, height - 0.27, 0.085, [width + 0.09, 0.12, 0.22], woodwork);
    put(lintels, 0, height - 0.07, 0.11, [width + 0.22, 0.14, 0.37], ash);

    for (const side of [-1, 1]) {
      put(lintels, side * width * 0.46, 1.40, 0.088, [0.14, 2.37, 0.18], woodwork);
      const upperWidth = width * 0.22;
      const upperHeight = height * 0.24;
      const upperX = side * width * 0.23;
      put(lintels, upperX, height * 0.72, 0.10, [upperWidth + 0.13, upperHeight + 0.1, 0.18], woodwork);
      put(doors, upperX, height * 0.72, 0.205, [upperWidth, upperHeight, 0.035], i % 3 ? '#4e4d41' : '#766143');
      if (i % 3 === 0) put(windows, upperX, height * 0.74, 0.227, [upperWidth * 0.75, upperHeight * 0.76, 0.014], '#775a38');
      const slats = IS_HANDHELD ? 4 : 7;
      for (let j = 1; j < slats; j++) {
        put(lintels, upperX, height * 0.72 + upperHeight * (j / slats - 0.5), 0.237, [upperWidth, 0.035, 0.055], '#413c32');
      }
      put(foundation, upperX, height * 0.71 - upperHeight * 0.57, 0.16, [upperWidth + 0.22, 0.088, 0.21], '#7c756b');
    }

    const open = i % 4 === 0 || i % 7 === 0;
    put(lintels, 0, 1.43, 0.11, [width * 0.63 + 0.18, 2.30, 0.24], woodwork);
    put(doors, 0, 1.43, 0.252, [width * 0.61, 2.15, 0.045], '#332a24');
    if (open) {
      put(windows, 0, 1.51, 0.278, [width * 0.49, 1.83, 0.023], i % 4 === 0 ? '#996634' : '#346886');
      put(doors, 0, 0.96, 0.32, [width * 0.60, 0.11, 0.15], '#66523d');
    }
    for (const pane of [-1, 0, 1]) {
      if (pane !== 0 || !open) put(lintels, pane * width * 0.19, 1.44, 0.29, [0.069, 2.17, 0.11], woodwork);
    }

    const shadeSlope = -0.14 - random(i + 151) * 0.11;
    put(roof, 0, 2.69, 0.41, [widthWithEave, 0.09, 0.91], roofColor, shadeSlope);
    put(roof, 0, height + 0.22, -0.69, [widthWithEave, 0.11, 2.3], roofColor, shadeSlope - 0.13);
    put(roof, 0, height + 0.50, -2.41, [widthWithEave, 0.11, 1.88], roofColor, 0.27);
    put(lintels, 0, 2.57, 0.88, [widthWithEave, 0.10, 0.095], woodwork);
    put(lintels, 0, height + 0.32, -1.57, [widthWithEave, 0.14, 0.14], '#50473d');

    const count = IS_HANDHELD ? 7 : 15;
    for (let rib = 0; rib < count; rib++) {
      const px = ((rib + 0.5) / count - 0.5) * widthWithEave;
      const vein = i % 3 ? '#68554a' : '#846958';
      const rotation = [Math.PI * 0.5 + shadeSlope, yaw, 0] as Vec3;
      roofTiles.push({ position: point(px, 2.745, 0.44), rotation, scale: [0.118, 0.89, 0.10], color: vein });
    }

    const hanging = live ? 2 : i % 3 === 2 ? 1 : 3;
    for (let j = 0; j < hanging; j++) {
      const px = (j - (hanging - 1) / 2) * width * 0.26;
      const color = [AMBER, PINK, CREAM, CORAL, CREAM][(i + j) % 5];
      lamps.push(lamp(color, point(px, 2.40 - random(i * 12 + j) * 0.12, 0.70), 0.17 + random(i * 17 + j) * 0.046));
    }
  });
  return { walls, foundation, lintels, doors, windows, roof, roofTiles, lamps };
}

function TownFrontages({ live = false }: { live?: boolean }) {
  const plaster = useLocalTexture('aged-plaster.webp');
  const town = useMemo(() => buildTown(live ? HALL_HOUSES : STREET_HOUSES, live), [live]);
  const material = useMemo(() => new THREE.MeshStandardMaterial({
    color: plaster ? '#fff4dc' : '#b1a08e',
    map: plaster,
    normalMap: detailNormal('stone'),
    normalScale: new THREE.Vector2(0.23, 0.23),
    roughness: 0.94,
  }), [plaster]);
  useEffect(() => () => material.dispose(), [material]);

  return (
    <>
      <InstancedSet geometry={BOX} material={material} items={town.walls} castShadow={false} />
      <InstancedSet geometry={BOX} material={STONE} items={town.foundation} castShadow={false} />
      <InstancedSet geometry={BOX} material={WOOD} items={town.lintels} castShadow={false} />
      <InstancedSet geometry={BOX} material={WOOD} items={town.doors} castShadow={false} />
      <InstancedSet geometry={BOX} material={GLAZING} items={town.windows} castShadow={false} />
      <InstancedSet geometry={BOX} material={TILE_MATERIAL} items={town.roof} castShadow={false} />
      <InstancedSet geometry={TILE} material={TILE_MATERIAL} items={town.roofTiles} castShadow={false} />
      <LanternBatches lamps={town.lamps} />
    </>
  );
}

function treeRows(live: boolean): TreeSpot[] {
  return [-1, 1].flatMap((side) => Array.from({ length: live ? 5 : 9 }, (_, i) => {
    const seed = i * 81 + side * 7;
    return {
      position: [side * ((live ? 19.35 : 5.56) + (random(seed) - 0.5) * 0.73), 0.13, 11.9 - i * (live ? 6.25 : 7.55) + side * 0.83] as Vec3,
      height: 7.5 + random(seed + 7) * 4.9,
      rotation: random(seed + 9) * Math.PI * 2,
    };
  }));
}

const STREET_TREES = treeRows(false);
const HALL_TREES = treeRows(true);

function StreetTrees({ live = false }: { live?: boolean }) {
  const ready = usePhReady('island_tree_01');
  const spots = live ? HALL_TREES : STREET_TREES;
  const scans = useMemo<ScatterItem[]>(() => spots.map(({ position, height, rotation }) => ({ position, rotationY: rotation, scale: (height ?? 9) / 9 })), [spots]);
  return ready
    ? <PhScatter id="island_tree_01" items={scans} height={9} leafAlphaCutoff={0.44} castShadow={false} />
    : <Forest kind="broadleaf" spots={spots} leafColor="#546449" seed={766} castShadow={false} />;
}

function OverheadLights() {
  const { wires, bulbs } = useMemo(() => {
    const bulbs: Part[] = [];
    const lines = [...STREET_LANTERNS.wires];
    STREET_TREES.filter((_, index) => index % 9 < 6).forEach(({ position }, i) => {
      const [x, , z] = position;
      const wraps = 6.2 + random(i + 61) * 3.1;
      const pts: THREE.Vector3[] = [];
      for (let j = 0; j <= 48; j++) {
        const t = j / 48;
        const angle = t * wraps * 2 * Math.PI;
        const radius = 0.36 - t * 0.10;
        pts.push(new THREE.Vector3(x + Math.cos(angle) * radius + t * 0.15, 1.05 + t * 3.97, z + Math.sin(angle) * radius));
      }
      lines.push(new THREE.CatmullRomCurve3(pts));
      for (let b = 0; b < (IS_HANDHELD ? 25 : 51); b++) {
        const t = b / (IS_HANDHELD ? 25 : 51);
        const angle = t * wraps * 2 * Math.PI;
        const radius = 0.37 - t * 0.10;
        bulbs.push({ position: [x + Math.cos(angle) * radius + t * 0.15, 1.05 + t * 3.97, z + Math.sin(angle) * radius], scale: [0.018, 0.018, 0.018] });
      }
    });
    const pieces = lines.map((line, i) => new THREE.TubeGeometry(line, i < STREET_LANTERNS.wires.length ? 28 : 96, 0.006, 4));
    const wires = mergeGeometries(pieces);
    pieces.forEach((piece) => piece.dispose());
    return { wires, bulbs };
  }, []);
  useEffect(() => () => wires.dispose(), [wires]);
  return (
    <>
      <mesh geometry={wires} material={CABLE} userData={{ noCastShadow: true }} />
      <InstancedSet geometry={BULB} material={FAIRY} items={bulbs} castShadow={false} />
      <LanternBatches lamps={STREET_LANTERNS.lanes} />
    </>
  );
}

const SHEEN = new THREE.ShaderMaterial({
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  uniforms: { warm: { value: new THREE.Color('#ec8d39') }, cool: { value: new THREE.Color('#5790c9') } },
  vertexShader: `varying vec2 vUvPatch; void main(){ vUvPatch = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `
    varying vec2 vUvPatch;
    uniform vec3 warm;
    uniform vec3 cool;
    float lightPatch(vec2 p, vec2 center, vec2 spread) {
      vec2 delta = (p-center) / spread;
      return exp(-dot(delta, delta));
    }
    void main() {
      float ripple = sin(vUvPatch.y * 1017.0 + vUvPatch.x * 176.0) * sin(vUvPatch.x * 151.0 + vUvPatch.y * 1789.0);
      float west = lightPatch(vUvPatch, vec2(.18, .33), vec2(.155, .12)) + .43 * lightPatch(vUvPatch, vec2(.19, .59), vec2(.12, .22));
      float east = lightPatch(vUvPatch, vec2(.82, .35), vec2(.175, .12)) + .59 * lightPatch(vUvPatch, vec2(.72, .64), vec2(.26, .07));
      vec3 color = (warm * west + cool * east) * (0.75 + ripple * .25);
      gl_FragColor = vec4(color, .35);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `,
});

function StreetPaving() {
  const asphalt = useLocalTexture('after-dark-asphalt.webp', 5, 18);
  const { sidewalks, curbs, seams } = useMemo(() => {
    const sidewalks: Part[] = [];
    const curbs: Part[] = [];
    const seams: Part[] = [];
    for (const side of [-1, 1]) {
      sidewalks.push({ position: [side * 5.60, 0.045, STREET_Z], scale: [2.12, 0.19, STREET_LENGTH], color: '#737069' });
      for (let i = 0; i < 109; i++) {
        const z = 16.5 - i * 0.77;
        const shift = random(i * 3 + 74) * 0.041;
        curbs.push({ position: [side * (4.61 + shift), 0.098, z], scale: [0.16, 0.23, 0.737], color: ['#7f7b72', '#908578', '#6c685f'][i % 3] });
        if (!IS_HANDHELD || i % 3 !== 1) seams.push({ position: [side * 5.52, 0.144, z + 0.15], scale: [1.88, 0.008, 0.025], color: '#4b4944' });
      }
    }
    return { sidewalks, curbs, seams };
  }, []);

  return (
    <>
      <mesh position={[0, 0.01, STREET_Z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[STREET_WIDTH, STREET_LENGTH]} />
        <meshPhysicalMaterial color={asphalt ? '#494c53' : '#34343a'} map={asphalt} roughness={0.73} clearcoat={0.22} clearcoatRoughness={0.42} normalMap={detailNormal('stone')} roughnessMap={detailRoughness('stone')} normalScale={new THREE.Vector2(0.08, 0.08)} />
      </mesh>
      <mesh position={[0, 0.014, STREET_Z]} rotation={[-Math.PI / 2, 0, 0]} material={SHEEN} userData={{ noCastShadow: true }}>
        <planeGeometry args={[STREET_WIDTH, STREET_LENGTH]} />
      </mesh>
      <InstancedSet geometry={BOX} material={STONE} items={sidewalks} castShadow={false} />
      <InstancedSet geometry={BOX} material={STONE} items={curbs} castShadow={false} />
      <InstancedSet geometry={BOX} material={STONE} items={seams} castShadow={false} />
      <mesh position={[0, -0.13, STREET_Z]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[90, 134]} />
        <meshStandardMaterial color="#302a24" roughness={0.95} />
      </mesh>
    </>
  );
}

/** Framing from the street photograph, with walkable 3D surfaces and full building depth. */
export function HoiAnPhotoScene() {
  return (
    <>
      <color attach="background" args={['#0a101a']} />
      <fog attach="fog" args={['#0d1824', 22, 108]} />
      <hemisphereLight args={['#bacbe7', '#513326', 1.05]} />
      <directionalLight color="#aabbe6" intensity={0.65} position={[0, 7.5, 1]} />
      <pointLight position={[-4.85, 2.73, 0.65]} color="#ffb65d" intensity={42} distance={12} decay={2} />
      <pointLight position={[4.75, 2.45, -6.8]} color="#6aaaff" intensity={53} distance={13} decay={2} />
      <pointLight position={[-4.85, 2.82, -17.4]} color="#ffc579" intensity={45} distance={14} decay={2} />
      <pointLight position={[4.15, 2.57, -29.3]} color="#ffc376" intensity={39} distance={14} decay={2} />
      <pointLight position={[0.22, 3.15, -52]} color="#ffe1ab" intensity={66} distance={15} decay={2} />
      <WindClock />
      <TownFrontages />
      <StreetPaving />
      <StreetTrees />
      <OverheadLights />
    </>
  );
}

const HOI_AN_PLANTERS: ScatterItem[] = [
  { position: [-15.8, 0.13, -10], rotationY: 0, scale: 1 },
  { position: [15.8, 0.13, -10], rotationY: Math.PI, scale: 1 },
  { position: [-15.8, 0.13, 2], rotationY: 0, scale: 1 },
  { position: [15.8, 0.13, 2], rotationY: Math.PI, scale: 1 },
];
const HOI_AN_BENCHES: ScatterItem[] = [
  { position: [-16.0, 0.13, -4], rotationY: Math.PI / 2, scale: 1 },
  { position: [16.0, 0.13, -4], rotationY: -Math.PI / 2, scale: 1 },
  { position: [-16.0, 0.13, 8], rotationY: Math.PI / 2, scale: 1 },
  { position: [16.0, 0.13, 8], rotationY: -Math.PI / 2, scale: 1 },
];
const HOI_AN_LANTERNS: ScatterItem[] = [
  { position: [-16.2, 3.2, -12], rotationY: 0, scale: 1 },
  { position: [16.2, 3.2, -12], rotationY: 0.8, scale: 1 },
  { position: [-16.2, 3.2, 0], rotationY: 1.6, scale: 1 },
  { position: [16.2, 3.2, 0], rotationY: 2.4, scale: 1 },
];

/** Perimeter only. Eaves, foliage trunks and lights stay clear of the 30 m hall footprint. */
export function HoiAnHallScenery() {
  return (
    <>
      <TownFrontages live />
      <StreetTrees live />
      <PhScatter id="potted_plant_02" items={HOI_AN_PLANTERS} height={1.45} handheld />
      <PhScatter id="painted_wooden_bench" items={HOI_AN_BENCHES} height={0.88} />
      <PhScatter id="wooden_lantern_01" items={HOI_AN_LANTERNS} height={0.85} handheld />
    </>
  );
}
