/**
 * Physically based materials for real-world finishes, created once per colour and shared:
 * woven fabric with sheen, satin, carpet pile, polished gold and silver, glass that refracts,
 * glazed porcelain, wax, marble, lacquered wood, rose petals and leaves.
 */

import * as THREE from 'three';
import { detailNormal, detailRoughness } from './pbr';
import { IS_HANDHELD } from './deviceTier';

/**
 * Real refraction (transmission) costs a whole extra render of the scene every frame. Phones
 * get the classic see-through version instead: transparent, glossy, still reflecting the room.
 */
function seeThrough(transmission: number, opacity: number): Partial<THREE.MeshPhysicalMaterialParameters> {
  return IS_HANDHELD ? { transparent: true, opacity, depthWrite: false } : { transmission };
}

const cache = new Map<string, THREE.Material>();
function cached<T extends THREE.Material>(key: string, build: () => T): T {
  let m = cache.get(key) as T | undefined;
  if (!m) {
    m = build();
    cache.set(key, m);
  }
  return m;
}

const v2 = (s: number) => new THREE.Vector2(s, s);

/** Woven cotton / linen: soft sheen at grazing angles, matt face, visible weave */
export function fabric(color: string, kind: 'linen' | 'satin' | 'velvet' = 'linen'): THREE.MeshPhysicalMaterial {
  return cached(`fabric_${kind}_${color}`, () => {
    const c = new THREE.Color(color);
    const m = new THREE.MeshPhysicalMaterial({
      color: c,
      roughness: kind === 'satin' ? 0.42 : kind === 'velvet' ? 0.95 : 0.88,
      sheen: 1,
      sheenColor: kind === 'velvet' ? c.clone().lerp(new THREE.Color('#ffffff'), 0.35) : new THREE.Color('#ffffff').lerp(c, 0.4),
      sheenRoughness: kind === 'satin' ? 0.3 : kind === 'velvet' ? 0.55 : 0.75,
      normalMap: detailNormal(kind === 'satin' ? 'satin' : 'fabric'),
      normalScale: v2(kind === 'velvet' ? 0.2 : 0.3),
      roughnessMap: detailRoughness(kind === 'satin' ? 'satin' : 'fabric'),
      side: THREE.DoubleSide,
    });
    if (kind === 'satin') {
      m.anisotropy = 0.6;
    }
    return m;
  });
}

/** Sheer organza (chair sashes, overlays): thin, slightly translucent, glossy */
export function organza(color: string): THREE.MeshPhysicalMaterial {
  return cached(`organza_${color}`, () => new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.4,
    sheen: 1,
    sheenColor: new THREE.Color('#ffffff'),
    sheenRoughness: 0.3,
    ...seeThrough(0.25, 0.8),
    thickness: 0.002,
    side: THREE.DoubleSide,
  }));
}

/** Wool carpet pile */
export function carpet(color: string): THREE.MeshPhysicalMaterial {
  return cached(`carpet_${color}`, () => new THREE.MeshPhysicalMaterial({
    color,
    roughness: 1,
    sheen: 0.8,
    sheenColor: new THREE.Color(color).lerp(new THREE.Color('#ffffff'), 0.3),
    sheenRoughness: 0.8,
    normalMap: detailNormal('carpet'),
    normalScale: v2(0.9),
    roughnessMap: detailRoughness('carpet'),
  }));
}

/** Real gold (brass / gilding): full metal, slightly brushed */
export function gold(tone: 'yellow' | 'rose' | 'champagne' = 'yellow'): THREE.MeshStandardMaterial {
  return cached(`gold_${tone}`, () => new THREE.MeshStandardMaterial({
    color: tone === 'rose' ? '#e8a88a' : tone === 'champagne' ? '#e6cf9c' : '#e3b65c',
    metalness: 1,
    roughness: 0.24,
    normalMap: detailNormal('micro'),
    normalScale: v2(0.15),
    roughnessMap: detailRoughness('micro'),
    envMapIntensity: 1.5,
  }));
}

export function silver(): THREE.MeshStandardMaterial {
  return cached('silver', () => new THREE.MeshStandardMaterial({ color: '#e8eaec', metalness: 1, roughness: 0.18, envMapIntensity: 1.4 }));
}

/** Clear glass that refracts what is behind it */
export function glass(tint = '#ffffff'): THREE.MeshPhysicalMaterial {
  return cached(`glass_${tint}`, () => new THREE.MeshPhysicalMaterial({
    color: tint,
    metalness: 0,
    roughness: 0.03,
    ...seeThrough(1, 0.25),
    thickness: 0.004,
    ior: 1.5,
    specularIntensity: 1,
    envMapIntensity: 1.3,
    side: THREE.DoubleSide,
  }));
}

/** Liquid (wine, champagne) */
export function liquid(color: string): THREE.MeshPhysicalMaterial {
  return cached(`liquid_${color}`, () => new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.05,
    ...seeThrough(0.75, 0.85),
    thickness: 0.05,
    ior: 1.34,
    attenuationColor: new THREE.Color(color),
    attenuationDistance: 0.05,
  }));
}

/** Glazed porcelain plates and vases */
export function porcelain(color = '#fbfaf7'): THREE.MeshPhysicalMaterial {
  return cached(`porcelain_${color}`, () => new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.35,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
  }));
}

/** Candle wax: soft, slightly translucent */
export function wax(color = '#fbf3e4'): THREE.MeshPhysicalMaterial {
  return cached(`wax_${color}`, () => new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.55,
    sheen: 0.5,
    sheenColor: new THREE.Color('#fff4e0'),
    emissive: new THREE.Color('#ffb46b'),
    emissiveIntensity: 0.08,
  }));
}

/** Flame and other light sources: hotter than white so bloom catches them */
export function flameGlow(color = '#ffb347', strength = 6): THREE.MeshBasicMaterial {
  return cached(`flame_${color}_${strength}`, () => new THREE.MeshBasicMaterial({
    color: new THREE.Color(color).multiplyScalar(strength),
    toneMapped: false,
  }));
}

/** Polished marble with a lacquer-like clear coat */
export function marble(color = '#f4f1ea'): THREE.MeshPhysicalMaterial {
  return cached(`marble_${color}`, () => new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.3,
    clearcoat: 0.7,
    clearcoatRoughness: 0.1,
    normalMap: detailNormal('stone'),
    normalScale: v2(0.08),
    roughnessMap: detailRoughness('stone'),
  }));
}

/** Satin-lacquered or oiled wood */
export function wood(color = '#6b4423', gloss = 0.4): THREE.MeshPhysicalMaterial {
  return cached(`wood_${color}_${gloss}`, () => new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.55,
    clearcoat: gloss,
    clearcoatRoughness: 0.25,
    normalMap: detailNormal('wood'),
    normalScale: v2(0.3),
    roughnessMap: detailRoughness('wood'),
  }));
}

/** Rose petals: velvety, light passes through the thin edges */
export function petals(): THREE.MeshPhysicalMaterial {
  return cached('petals', () => new THREE.MeshPhysicalMaterial({
    color: '#ffffff',
    roughness: 0.62,
    sheen: 1,
    sheenRoughness: 0.4,
    sheenColor: new THREE.Color('#fff0f3'),
    normalMap: detailNormal('petal'),
    normalScale: v2(0.4),
    side: THREE.DoubleSide,
  }));
}

export function leaves(color = '#3d5a2a'): THREE.MeshStandardMaterial {
  return cached(`leaves_${color}`, () => new THREE.MeshStandardMaterial({
    color,
    roughness: 0.55,
    normalMap: detailNormal('leaf'),
    normalScale: v2(0.6),
    side: THREE.DoubleSide,
  }));
}

export function bark(color = '#5b4636'): THREE.MeshStandardMaterial {
  return cached(`bark_${color}`, () => new THREE.MeshStandardMaterial({
    color,
    roughness: 0.95,
    normalMap: detailNormal('bark'),
    normalScale: v2(1.2),
  }));
}

/** Painted / resin surface (white Chiavari chairs, plaster) */
export function painted(color: string, roughness = 0.45): THREE.MeshPhysicalMaterial {
  return cached(`painted_${color}_${roughness}`, () => new THREE.MeshPhysicalMaterial({
    color,
    roughness,
    clearcoat: 0.3,
    clearcoatRoughness: 0.3,
    normalMap: detailNormal('micro'),
    normalScale: v2(0.15),
  }));
}
