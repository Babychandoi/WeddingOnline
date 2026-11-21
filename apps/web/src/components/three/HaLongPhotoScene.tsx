'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import {
  BackSide, BufferGeometry, Color, DoubleSide, Float32BufferAttribute, MeshBasicMaterial, Shape, SRGBColorSpace,
  ShaderMaterial, TextureLoader, Vector3,
} from 'three';
import { usePhSurface } from './phAssets';
import { HA_LONG_PHOTO_REFERENCE } from './HaLongPhotoReference';

const SEA_LEVEL = -1.18;
const ROCK_PHOTO = '/venues/references/halong/karst-faces.webp';
const FOCAL_LENGTH = 1370;
const IMAGE_CENTER_X = 640;
const IMAGE_CENTER_Y = 741;
const PHOTO_CROP_Y = 392;
const PHOTO_CROP_HEIGHT = 388;
const LENS_POSITION = new Vector3(...HA_LONG_PHOTO_REFERENCE.camera.position);
const VIEW = new Vector3(...HA_LONG_PHOTO_REFERENCE.camera.target).sub(LENS_POSITION).normalize();
const CAMERA_UP = new Vector3(0, -VIEW.z, VIEW.y);
type ProfilePoint = [x: number, top: number, base: number];

interface KarstProfile {
  profile: ProfilePoint[];
  distance: number;
  depth: number;
}

// Profiles are the edges of individually observed islands in the source photograph.
// Each cliff uses an independently placed, closed volume with relief in depth.
const LAND: KarstProfile[] = [
  { distance: 290, depth: 18, profile: [
    [-104, 747, 753], [-80, 720, 753], [-58, 678, 753], [-38, 661, 753], [-21, 632, 753],
    [0, 620, 753], [25, 619, 753], [50, 631, 753], [72, 619, 753], [90, 617, 753], [118, 630, 753],
    [155, 638, 753], [184, 640, 753], [218, 641, 752], [252, 624, 752], [277, 633, 752],
    [299, 637, 752], [345, 627, 752], [395, 643, 752], [443, 652, 752], [505, 645, 752],
    [567, 628, 752], [615, 640, 752], [657, 634, 752], [685, 642, 752], [702, 637, 752], [728, 644, 752],
    [748, 654, 749], [770, 643, 748], [810, 640, 748], [886, 621, 747], [933, 632, 747], [982, 633, 747],
    [1017, 617, 744], [1044, 614, 744], [1059, 620, 744], [1083, 622, 742], [1105, 612, 741],
    [1180, 599, 740], [1230, 604, 738], [1278, 622, 736], [1304, 653, 736], [1335, 682, 735], [1361, 728, 735],
  ] },
  { distance: 212, depth: 38, profile: [
    [1121, 642, 741], [1130, 625, 741], [1142, 615, 740], [1154, 609, 740], [1172, 606, 739],
    [1193, 607, 739], [1200, 629, 738], [1212, 614, 738], [1230, 604, 738], [1244, 601, 737],
    [1260, 615, 737], [1278, 648, 737], [1302, 692, 737], [1323, 723, 736], [1340, 735, 736],
  ] },
  { distance: 183, depth: 32, profile: [
    [718, 740, 752], [737, 653, 751], [756, 645, 750], [779, 642, 749], [804, 640, 748],
    [824, 626, 747], [843, 599, 746], [853, 584, 745], [866, 567, 745], [886, 561, 744],
    [899, 568, 744], [916, 572, 743], [932, 572, 743], [945, 586, 742], [953, 610, 742],
    [974, 629, 741], [988, 620, 741], [999, 607, 741], [1008, 608, 741], [1018, 622, 741],
    [1030, 654, 740], [1054, 671, 740], [1091, 692, 739], [1133, 706, 739], [1162, 730, 738],
  ] },
  { distance: 137, depth: 38, profile: [
    [137, 746, 769], [158, 714, 770], [176, 692, 770], [194, 675, 771], [211, 646, 771], [232, 636, 771],
    [249, 617, 771], [263, 607, 771], [277, 600, 771], [286, 564, 771], [293, 555, 771], [310, 559, 771],
    [324, 556, 771], [332, 566, 770], [336, 476, 770], [343, 453, 770], [357, 433, 769], [372, 422, 769],
    [393, 411, 768], [411, 405, 768], [434, 408, 768], [450, 414, 768], [469, 410, 767], [491, 413, 767],
    [509, 409, 766], [533, 414, 766], [554, 424, 765], [573, 438, 765], [596, 456, 764], [610, 482, 764],
    [618, 509, 764], [623, 546, 763], [635, 577, 763], [645, 598, 762], [658, 607, 761], [670, 633, 760],
    [685, 638, 759], [700, 654, 759], [716, 678, 758], [730, 667, 758], [741, 681, 757], [752, 708, 757], [761, 743, 756],
  ] },
  { distance: 103, depth: 14, profile: [
    [0, 760, 776], [13, 715, 776], [30, 688, 776], [48, 675, 775], [65, 660, 775], [82, 652, 774],
    [97, 653, 774], [110, 663, 773], [123, 689, 772], [135, 708, 772], [146, 739, 772], [155, 765, 771],
  ] },
];

function imagePoint(x: number, y: number, depth: number) {
  return LENS_POSITION.clone()
    .addScaledVector(VIEW, depth)
    .addScaledVector(CAMERA_UP, (IMAGE_CENTER_Y - y) * depth / FOCAL_LENGTH)
    .addScaledVector(new Vector3(1, 0, 0), (x - IMAGE_CENTER_X) * depth / FOCAL_LENGTH);
}

function cliffGeometry({ profile, distance, depth }: KarstProfile, island: number) {
  const positions: number[] = [];
  const colors: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const left = profile[0][0];
  const right = profile[profile.length - 1][0];
  const columns = Math.max(18, Math.ceil((right - left) / 5));
  const tiers = 10;
  const sideCount = (columns + 1) * (tiers + 1);
  for (let side = 0; side < 2; side++) {
    let segment = 0;
    for (let column = 0; column <= columns; column++) {
      const progress = column / columns;
      const x = left + progress * (right - left);
      while (segment < profile.length - 2 && x > profile[segment + 1][0]) segment++;
      const a = profile[segment];
      const b = profile[segment + 1];
      const fraction = (x - a[0]) / (b[0] - a[0]);
      const edge = Math.sin(Math.PI * progress);
      const top = a[1] + (b[1] - a[1]) * fraction + 1.9 * Math.sin(x * 1.44) * edge;
      const base = a[2] + (b[2] - a[2]) * fraction;
      for (let tier = 0; tier <= tiers; tier++) {
        const height = tier / tiers;
        const y = base + (top - base) * height;
        const strata = Math.sin(progress * 45 + island) * 0.09 + Math.cos(height * 8 + progress * 26) * 0.07;
        const thickness = depth * edge * (0.42 + 0.45 * Math.sin(Math.PI * height) + strata);
        const ridge = imagePoint(x, y, distance - thickness * 0.29);
        const shorelineBlend = Math.max(0, 1 - height * 4) ** 2;
        ridge.y += (SEA_LEVEL - 0.14 - ridge.y) * shorelineBlend;
        if (side === 1) {
          ridge.z -= 2 * thickness;
          ridge.y -= Math.max(0, ridge.y - SEA_LEVEL) * 0.19 * Math.sin(Math.PI * progress);
        }
        positions.push(ridge.x, ridge.y, ridge.z);
        // Keep the photographed waterline and the foreground boat's rigging out of the rock texture.
        const photoX = x < 0 ? -x * 0.69 : x > 1208 ? 1208 - (x - 1208) * 0.28 : x;
        const shoreline = island < 3 ? (x > 1130 ? 704 : 721) : island === 3 && x > 225 && x < 415 ? 729 : base - 7;
        const photoY = Math.min(y, shoreline);
        uvs.push(photoX / 1280, 1 - (photoY - PHOTO_CROP_Y) / PHOTO_CROP_HEIGHT);
        const exposure = side === 0 ? 1 : 0.58 + 0.19 * edge + 0.06 * strata;
        colors.push(exposure, exposure, exposure);
        if (column !== 0 && tier !== 0) {
          const point = side * sideCount + column * (tiers + 1) + tier;
          const previous = point - tiers - 1;
          indices.push(previous - 1, previous, point, previous - 1, point, point - 1);
        }
      }
    }
  }
  for (let column = 1; column <= columns; column++) {
    const front = column * (tiers + 1) + tiers;
    const previous = front - tiers - 1;
    indices.push(previous, front, front + sideCount, previous, front + sideCount, previous + sideCount);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  return geometry;
}

function PhotoKarst() {
  const photo = useLoader(TextureLoader, ROCK_PHOTO);
  const material = useMemo(() => {
    photo.colorSpace = SRGBColorSpace;
    photo.anisotropy = 4;
    return new MeshBasicMaterial({ map: photo, side: DoubleSide, vertexColors: true, fog: false, toneMapped: false });
  }, [photo]);
  const geometry = useMemo(() => LAND.map(cliffGeometry), []);
  useEffect(() => () => geometry.forEach((ridge) => ridge.dispose()), [geometry]);
  useEffect(() => () => material.dispose(), [material]);
  return <group>{geometry.map((ridge, i) => <mesh key={i} geometry={ridge} material={material} userData={{ noCastShadow: true }} />)}</group>;
}

const WORLD_VERTEX = /* glsl */ `
  varying vec3 vWorld;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;
const SKY_FRAGMENT = /* glsl */ `
  uniform vec3 uZenith, uHorizon, uLateLight;
  varying vec3 vWorld;
  void main() {
    vec3 sight = normalize(vWorld - cameraPosition);
    float elevation = clamp(sight.y, 0.0, 1.0);
    float up = pow(1.0 - exp(-elevation * 7.5), 0.85);
    float right = smoothstep(-0.45, 0.78, sight.x) * exp(-elevation * 4.9);
    vec3 sky = mix(mix(uHorizon, uZenith, up), uLateLight, right * 0.72);
    gl_FragColor = vec4(sky, 1.0);
    #include <colorspace_fragment>
  }
`;
const WATER_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform vec3 uDeep, uBlue, uSky;
  varying vec3 vWorld;
  float hash(vec2 p) {
    vec3 q = fract(vec3(p.xyx) * 0.1031);
    q += dot(q, q.yzx + 33.33);
    return fract((q.x + q.y) * q.z);
  }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + 1.0), f.x), f.y);
  }
  void main() {
    vec3 viewDir = normalize(cameraPosition - vWorld);
    vec2 p = vWorld.xz;
    float depth = length(cameraPosition - vWorld);
    float t = uTime * 0.82;
    float gust = noise(p * vec2(0.16, 0.32) + vec2(t * 0.13, 0.0));
    vec2 ripple = p * vec2(4.6, 11.8) + vec2(gust * 3.0, t * 2.4);
    float facets = noise(ripple) * 1.26 + noise(ripple.yx * 0.43 - t * 0.6) * 0.74 - 1.0;
    float swell = sin(dot(p, vec2(0.82, 4.05)) + t + gust * 9.0) * 0.38;
    float slope = facets + swell;
    float detail = 1.0 / (1.0 + fwidth(p.y) * 5.0 + fwidth(p.x) * 4.3);
    depth = smoothstep(20.0, 310.0, depth);
    float fresnel = pow(1.0 - clamp(viewDir.y + slope * 0.15 * detail, 0.0, 1.0), 4.0);
    float glint = smoothstep(0.18, 0.72, slope);
    float sky = clamp(0.08 + depth * 0.25 + fresnel * 0.17 + glint * detail * 0.39, 0.0, 1.0);
    vec3 water = mix(mix(uDeep, uBlue, 0.38 + 0.22 * gust + 0.17 * swell), uSky, sky);
    water *= 1.0 - detail * max(-slope, 0.0) * 0.30;
    gl_FragColor = vec4(water, 1.0);
    #include <colorspace_fragment>
  }
`;

function BayWater() {
  const material = useMemo(() => new ShaderMaterial({
    vertexShader: WORLD_VERTEX,
    fragmentShader: WATER_FRAGMENT,
    uniforms: {
      uTime: { value: 0 },
      uDeep: { value: new Color('#113f60') },
      uBlue: { value: new Color('#4088b0') },
      uSky: { value: new Color('#9ac1d3') },
    },
    toneMapped: false,
  }), []);
  useFrame(({ clock }) => { material.uniforms.uTime.value = clock.elapsedTime; });
  useEffect(() => () => material.dispose(), [material]);
  return (
    <mesh position-y={SEA_LEVEL} rotation-x={-Math.PI / 2} material={material} userData={{ noCastShadow: true }}>
      <planeGeometry args={[1800, 1800]} />
    </mesh>
  );
}

function ReferenceSky() {
  const material = useMemo(() => new ShaderMaterial({
    vertexShader: WORLD_VERTEX,
    fragmentShader: SKY_FRAGMENT,
    uniforms: {
      uZenith: { value: new Color('#81afe5') },
      uHorizon: { value: new Color('#cceaf3') },
      uLateLight: { value: new Color('#f1f6df') },
    },
    side: BackSide,
    depthWrite: false,
    toneMapped: false,
  }), []);
  useEffect(() => () => material.dispose(), [material]);
  return <mesh material={material} renderOrder={-10}><sphereGeometry args={[550, 24, 14]} /></mesh>;
}

const RAIL_STEEL = '#657375';
const RAIL_WOOD = '#725244';
const NIGHT_GLASS = '#14324a';
const SHIP_PAINT = '#e0e5df';
const POSTS = [-5.4, -3.6, -1.53, 0.34, 2.17, 4.08, 5.8];

function Railings() {
  return (
    <group position={[0, 0, 0.74]} rotation-y={-0.044}>
      {POSTS.map((x) => <mesh key={x} position={[x, 0.52, 0]}>
        <boxGeometry args={[0.083, 1.08, 0.09]} />
        <meshStandardMaterial color={RAIL_STEEL} metalness={0.62} roughness={0.26} />
      </mesh>)}
      {[0.32, 0.62, 0.91].map((y) => <mesh key={y} position={[0, y, 0]} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.021, 0.021, 11.9, 10]} />
        <meshStandardMaterial color="#8a9285" metalness={0.62} roughness={0.24} />
      </mesh>)}
      <mesh position={[0, 1.11, 0]} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.043, 0.043, 12, 14]} />
        <meshStandardMaterial color={RAIL_WOOD} metalness={0.2} roughness={0.23} />
      </mesh>
    </group>
  );
}

function Lifebuoy() {
  return (
    <group position={[-1.0, 0.76, 0.79]} rotation={[0.02, -0.06, -0.15]}>
      <mesh>
        <torusGeometry args={[0.43, 0.104, 14, 60]} />
        <meshStandardMaterial color="#ec4e21" roughness={0.48} />
      </mesh>
      {[0.57, 2.12, 3.73, 5.31].map((angle) => (
        <mesh key={angle} rotation-z={angle}>
          <torusGeometry args={[0.43, 0.106, 12, 10, 0.25]} />
          <meshStandardMaterial color="#ded8be" roughness={0.6} />
        </mesh>
      ))}
      <mesh position-z={0.024}>
        <torusGeometry args={[0.556, 0.012, 8, 50]} />
        <meshStandardMaterial color="#a5875b" roughness={0.9} />
      </mesh>
    </group>
  );
}

function Deck() {
  const texture = usePhSurface('wood', 12);
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 4.25]}>
        <planeGeometry args={[12, 7.2]} />
        <meshStandardMaterial
          color={texture ? '#c1ab91' : '#6f5544'}
          map={texture?.map}
          normalMap={texture?.normalMap}
          roughnessMap={texture?.roughnessMap}
          roughness={0.65}
        />
      </mesh>
      <mesh position={[0, -0.075, 0.64]}>
        <boxGeometry args={[12.05, 0.18, 0.18]} />
        <meshStandardMaterial color="#d6d2bd" roughness={0.58} />
      </mesh>
      <Railings />
      <Lifebuoy />
      <group position={[2.13, 0.76, 1.09]} rotation-z={-0.62}>
        <mesh>
          <boxGeometry args={[0.40, 3.4, 0.24]} />
          <meshStandardMaterial color="#d4d9d9" roughness={0.36} metalness={0.10} />
        </mesh>
        <mesh position={[-0.16, 0, 0.126]}>
          <boxGeometry args={[0.053, 3.36, 0.024]} />
          <meshStandardMaterial color="#dce5e4" roughness={0.30} metalness={0.20} />
        </mesh>
      </group>
    </group>
  );
}

function CruiseBoat() {
  return (
    <group position={[-19.3, SEA_LEVEL, -75]} rotation-y={0.09} scale={1.04}>
      <mesh position={[-0.40, 0.31, 0]}>
        <boxGeometry args={[14.4, 0.87, 3.45]} />
        <meshStandardMaterial color="#24353c" roughness={0.68} />
      </mesh>
      <mesh position={[7.06, 0.31, -0.20]} rotation-y={Math.PI / 4} scale={[1.17, 1, 1]}>
        <boxGeometry args={[2.25, 0.85, 2.23]} />
        <meshStandardMaterial color="#26383e" roughness={0.68} />
      </mesh>
      <mesh position={[-0.42, 0.82, 0]}>
        <boxGeometry args={[15.3, 0.23, 3.58]} />
        <meshStandardMaterial color={SHIP_PAINT} roughness={0.49} />
      </mesh>
      <mesh position={[-0.25, 1.35, 0]}>
        <boxGeometry args={[11.9, 0.92, 2.95]} />
        <meshStandardMaterial color={SHIP_PAINT} roughness={0.48} />
      </mesh>
      <mesh position={[-0.5, 1.91, 0]}>
        <boxGeometry args={[12.8, 0.16, 3.32]} />
        <meshStandardMaterial color="#d1dcd6" roughness={0.52} />
      </mesh>
      <mesh position={[-0.51, 2.35, 0]}>
        <boxGeometry args={[9.7, 0.72, 2.66]} />
        <meshStandardMaterial color="#d3e0db" roughness={0.48} />
      </mesh>
      <mesh position={[-1.04, 2.8, 0]}>
        <boxGeometry args={[11.3, 0.18, 3.03]} />
        <meshStandardMaterial color="#dae3db" roughness={0.52} />
      </mesh>
      {[-1, 1].map((side) => <group key={side}>
        {Array.from({ length: 10 }, (_, i) => <mesh key={i} position={[-5.55 + i * 1.11, 1.37, side * 1.483]}>
          <boxGeometry args={[0.86, 0.37, 0.025]} />
          <meshBasicMaterial color={i % 4 === 0 ? '#375268' : NIGHT_GLASS} />
        </mesh>)}
        {Array.from({ length: 8 }, (_, i) => <mesh key={i} position={[-4.65 + i * 1.13, 2.34, side * 1.338]}>
          <boxGeometry args={[0.98, 0.37, 0.026]} />
          <meshBasicMaterial color={i % 3 === 0 ? '#354b56' : '#1b2b35'} />
        </mesh>)}
      </group>)}
      {[-3.48, 0.1].map((x) => <mesh key={x} position={[x, 4.24, 0.17]}>
        <cylinderGeometry args={[0.025, 0.048, 3.07, 5]} />
        <meshStandardMaterial color="#c9b78f" roughness={0.8} />
      </mesh>)}
      <mesh position={[3.42, 3.28, 0.08]}>
        <cylinderGeometry args={[0.029, 0.029, 0.88, 6]} />
        <meshStandardMaterial color="#9a8a78" />
      </mesh>
      <mesh position={[3.55, 3.65, 0.08]}>
        <boxGeometry args={[0.28, 0.21, 0.014]} />
        <meshStandardMaterial color="#b14a24" roughness={0.82} />
      </mesh>
    </group>
  );
}

function Bay() {
  return <><BayWater /><PhotoKarst /><CruiseBoat /></>;
}

const HULL_OUTLINE = new Shape()
  .moveTo(-15.6, -14.4)
  .quadraticCurveTo(-15.6, -17.4, -11.6, -17.6)
  .lineTo(11.6, -17.6)
  .quadraticCurveTo(15.6, -17.4, 15.6, -14.4)
  .lineTo(15.6, 13.2)
  .quadraticCurveTo(15.6, 19.0, 0, 23.6)
  .quadraticCurveTo(-15.6, 19.0, -15.6, 13.2)
  .closePath();
const HULL_DEPTH = { depth: 1.16, bevelEnabled: false, curveSegments: 16 };
const DECK_RAILS = [
  { x: -15.12, z: 0, yaw: Math.PI / 2 },
  { x: 15.12, z: 0, yaw: Math.PI / 2 },
  { x: 0, z: -15.12, yaw: 0 },
  { x: 0, z: 15.12, yaw: 0 },
];

/** The playable room keeps its walkable floor and wedding objects. */
export function HaLongHallScenery() {
  return (
    <>
      <group position-y={-SEA_LEVEL - 0.82}><Bay /></group>
      <mesh position-y={-1.23} rotation-x={-Math.PI / 2} receiveShadow>
        <extrudeGeometry args={[HULL_OUTLINE, HULL_DEPTH]} />
        <meshStandardMaterial color="#ede4cf" roughness={0.6} />
      </mesh>
      {DECK_RAILS.map(({ x, z, yaw }) => (
        <group key={`${x},${z}`} position={[x, 0, z]} rotation-y={yaw}>
          <mesh position-y={1.05}>
            <boxGeometry args={[30.27, 0.08, 0.10]} />
            <meshStandardMaterial color={RAIL_WOOD} roughness={0.36} />
          </mesh>
          {[0.35, 0.69].map((y) => <mesh key={y} position-y={y}>
            <boxGeometry args={[30.25, 0.045, 0.041]} />
            <meshStandardMaterial color="#c9c9bb" metalness={0.42} roughness={0.38} />
          </mesh>)}
          {Array.from({ length: 13 }, (_, i) => <mesh key={i} position={[(i - 6) * 2.52, 0.51, 0]}>
            <boxGeometry args={[0.077, 1.02, 0.085]} />
            <meshStandardMaterial color={RAIL_STEEL} metalness={0.4} roughness={0.4} />
          </mesh>)}
        </group>
      ))}
    </>
  );
}

/** Fixed first frame from the photograph, with movable camera and separate physical layers. */
export function HaLongPhotoScene() {
  return (
    <>
      <ReferenceSky />
      <hemisphereLight args={['#b6d3f4', '#635344', 2.2]} />
      <directionalLight position={[12, 11, -4]} color="#fff1d1" intensity={2.38} />
      <Bay />
      <Deck />
    </>
  );
}
