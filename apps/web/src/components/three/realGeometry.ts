/**
 * Geometry for real-world wedding furniture and decor, built once and shared: draped
 * tablecloths with folds, roses petal by petal, Chiavari chairs, plates and glassware
 * turned on a lathe, pleated curtains, fluted columns and urns. Real-world sizes in metres.
 */

import * as THREE from 'three';
import { IS_HANDHELD } from './deviceTier';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const cache = new Map<string, THREE.BufferGeometry>();
function cached(key: string, build: () => THREE.BufferGeometry): THREE.BufferGeometry {
  let g = cache.get(key);
  if (!g) {
    g = build();
    cache.set(key, g);
  }
  return g;
}

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Uniform attribute set so any of our geometries can be merged together */
function clean(g: THREE.BufferGeometry): THREE.BufferGeometry {
  const out = g;
  for (const name of Object.keys(out.attributes)) {
    if (name !== 'position' && name !== 'normal' && name !== 'uv') out.deleteAttribute(name);
  }
  if (!out.attributes.uv) {
    out.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array((out.attributes.position.count) * 2), 2));
  }
  if (!out.index) {
    const idx = Array.from({ length: out.attributes.position.count }, (_, i) => i);
    out.setIndex(idx);
  }
  return out;
}

function merge(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const g = mergeGeometries(parts.map(clean), false)!;
  g.computeBoundingSphere();
  return g;
}

function placed(g: THREE.BufferGeometry, pos: [number, number, number], rot: [number, number, number] = [0, 0, 0], scale: [number, number, number] = [1, 1, 1]) {
  const m = new THREE.Matrix4().compose(
    new THREE.Vector3(...pos),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)),
    new THREE.Vector3(...scale),
  );
  return g.clone().applyMatrix4(m);
}

/* ───────────────────────── Fabric ───────────────────────── */

/**
 * Floor-length round tablecloth: flat top, rounded edge, then a skirt that flares slightly
 * and falls into soft vertical folds that deepen towards the floor.
 */
export function drapedCloth(radius: number, height: number): THREE.BufferGeometry {
  return cached(`cloth_${radius}_${height}`, () => {
    const pts: THREE.Vector2[] = [];
    pts.push(new THREE.Vector2(0, height));
    for (let i = 0; i <= 6; i++) pts.push(new THREE.Vector2((radius - 0.02) * (i / 6), height + 0.004));
    // Rounded table edge
    for (let i = 0; i <= 8; i++) {
      const a = (i / 8) * (Math.PI / 2);
      pts.push(new THREE.Vector2(radius - 0.02 + Math.sin(a) * 0.024, height - 0.02 + Math.cos(a) * 0.024));
    }
    // Skirt down to the floor, flaring into a little pool at the hem
    const steps = 22;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const y = (height - 0.02) * (1 - t);
      const r = radius + 0.004 + Math.pow(t, 2.2) * radius * 0.07;
      pts.push(new THREE.Vector2(r, Math.max(0.004, y)));
    }
    pts.push(new THREE.Vector2(radius * 1.075, 0.002));
    // Profile reversed so the top and the skirt face outward: the AO pre-pass draws front faces
    // only, and an inward-facing cloth let it see through the table (a glowing, ghostly cloth)
    const g = new THREE.LatheGeometry(pts.reverse(), 160);
    const pos = g.attributes.position as THREE.BufferAttribute;
    const v = new THREE.Vector3();
    const r = rng(17);
    const phases = Array.from({ length: 6 }, () => r() * Math.PI * 2);
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const below = height - 0.03 - v.y;
      if (below <= 0) continue;
      const t = Math.min(1, below / (height - 0.03));
      const ang = Math.atan2(v.z, v.x);
      // Irregular folds: a dominant pleat count plus two detuned ones
      const fold =
        Math.sin(ang * 14 + phases[0]) * 0.6 +
        Math.sin(ang * 23 + phases[1] + t * 1.5) * 0.3 +
        Math.sin(ang * 7 + phases[2]) * 0.25;
      const amp = Math.pow(t, 1.3) * 0.035;
      const rad = Math.hypot(v.x, v.z);
      const nr = rad + fold * amp;
      pos.setXYZ(i, (v.x / rad) * nr, v.y, (v.z / rad) * nr);
    }
    g.computeVertexNormals();
    return g;
  });
}

/** A pleated stage curtain hanging from a rod, gathered into deep folds */
export function pleatedCurtain(width: number, height: number, pleats = 26): THREE.BufferGeometry {
  return cached(`curtain_${width}_${height}_${pleats}`, () => {
    const g = new THREE.PlaneGeometry(width, height, pleats * 10, 24);
    const pos = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const t = 1 - (y + height / 2) / height; // 0 at the rod, 1 at the floor
      const u = (x / width + 0.5) * pleats * Math.PI * 2;
      const depth = 0.07 + t * 0.03;
      pos.setZ(i, Math.sin(u) * depth + Math.sin(u * 0.37 + 1.3) * 0.02 * t);
      // Hem kicks out a little where it pools on the floor
      if (t > 0.97) pos.setZ(i, pos.getZ(i) + (t - 0.97) * 1.5);
    }
    g.computeVertexNormals();
    return g;
  });
}

/** Swag valance: fabric gathered in drooping arcs across the top of a backdrop */
export function swagValance(width: number, swags = 4): THREE.BufferGeometry {
  return cached(`swag_${width}_${swags}`, () => {
    const g = new THREE.PlaneGeometry(width, 0.6, swags * 24, 12);
    const pos = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const u = ((x / width + 0.5) * swags) % 1;
      const sag = Math.sin(u * Math.PI) * 0.32;
      const t = (0.3 - y) / 0.6;
      pos.setY(i, y - sag * (0.35 + t * 0.65));
      pos.setZ(i, Math.sin(u * Math.PI) * 0.12 + Math.sin(t * Math.PI * 5 + u * 8) * 0.012);
    }
    g.computeVertexNormals();
    return g;
  });
}

/* ───────────────────────── Flowers ───────────────────────── */

function petal(width: number, length: number, cup: number, curl: number, phase: number): THREE.BufferGeometry {
  const g = new THREE.PlaneGeometry(width, length, IS_HANDHELD ? 2 : 4, IS_HANDHELD ? 3 : 4);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const u = uv.getX(i) * 2 - 1;
    const t = uv.getY(i);
    const edge = Math.abs(u);
    const upper = t ** 3;
    const span = 0.10 + 0.92 * Math.sin(Math.PI * (0.10 + t * 0.76)) ** 0.79;
    const wave = Math.sin(u * 5.9 + phase) * 0.030 + Math.cos(u * 11.6 - phase) * 0.016;
    const x = width * (0.5 * u * span + upper * Math.sin(phase) * 0.067);
    const y = length * (t + upper * (wave - edge ** 2 * 0.063));
    const z = width * (1 - edge ** 1.8) * cup * Math.sin(Math.PI * t) * 0.15
      + length * upper * (curl + wave + edge ** 2 * 0.13);
    pos.setXYZ(i, x, y, z);
  }
  g.computeVertexNormals();
  return g;
}

/** Two florist roses with asymmetric layers and a shaded throat visible at eye level. */
export function roseHead(cupped = false): THREE.BufferGeometry {
  return cached(cupped ? 'rose-cupped' : 'rose-open', () => {
    const parts: THREE.BufferGeometry[] = [];
    const colors: number[] = [];
    const random = rng(cupped ? 219 : 538);
    const layers = [
      { count: 3, radius: 0.002, length: 0.024, width: 0.018, angle: 0.09, curl: -0.11 },
      { count: 4, radius: 0.005, length: 0.027, width: 0.025, angle: 0.26, curl: -0.07 },
      { count: 5, radius: 0.009, length: 0.033, width: 0.033, angle: 0.54, curl: 0.03 },
      { count: 6, radius: 0.014, length: 0.040, width: 0.041, angle: 0.83, curl: 0.12 },
      { count: 6, radius: 0.017, length: 0.043, width: 0.045, angle: 1.16, curl: 0.18 },
    ];
    for (const [ring, layer] of layers.entries()) {
      for (let i = 0; i < layer.count; i++) {
        const azimuth = (i / layer.count) * Math.PI * 2 + ring * 0.82 + (random() - 0.5) * 0.31;
        const phase = random() * Math.PI * 2;
        const p = petal(layer.width * (0.86 + 0.29 * random()), layer.length * (0.88 + 0.23 * random()), 0.72 + 0.48 * random(), layer.curl, phase);
        const uv = p.attributes.uv;
        for (let v = 0; v < uv.count; v++) {
          const depth = uv.getY(v);
          const lip = THREE.MathUtils.smoothstep(depth, 0.70, 1);
          const shade = 0.53 + 0.08 * ring + 0.21 * depth + lip * (0.018 + 0.025 * Math.sin(phase + uv.getX(v) * 9));
          colors.push(shade, shade * (0.91 + 0.08 * depth), shade * (0.94 + 0.035 * depth));
        }
        const opening = layer.angle * (cupped ? 0.73 : 1) + (random() - 0.5) * 0.24;
        p.rotateZ((random() - 0.5) * 0.25);
        p.rotateX(opening);
        p.rotateY(-azimuth + Math.PI / 2);
        p.translate(Math.cos(azimuth) * layer.radius, 0.012 - ring * 0.0028, Math.sin(azimuth) * layer.radius);
        parts.push(p);
      }
    }
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const s = petal(0.009, 0.023, 0.4, -0.13, a);
      s.rotateX(1.81);
      s.rotateY(-a + Math.PI / 2);
      s.translate(Math.cos(a) * 0.006, -0.005, Math.sin(a) * 0.006);
      parts.push(s);
      for (let v = 0; v < s.attributes.position.count; v++) colors.push(0.34, 0.49, 0.25);
    }
    const g = merge(parts);
    parts.forEach((part) => part.dispose());
    g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    const size = cupped ? 0.57 : 0.63;
    g.scale(size, cupped ? 0.67 : 0.61, size);
    return g;
  });
}

/** Rose leaf / greenery: serrated-looking pointed oval with a centre fold */
export function leafBlade(): THREE.BufferGeometry {
  return cached('leaf', () => {
    const g = new THREE.PlaneGeometry(0.05, 0.09, 6, 8);
    const pos = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i) + 0.045;
      const t = y / 0.09;
      const w = Math.sin(t * Math.PI) * (1 + Math.sin(t * 40) * 0.04);
      const nx = x * w;
      pos.setXYZ(i, nx, y, Math.abs(nx) * 0.35 - t * t * 0.02);
    }
    g.computeVertexNormals();
    return g;
  });
}

/** Points on the upper part of a sphere (Fibonacci lattice), for packing flowers in a dome */
export function domePoints(count: number, radius: number, minY = -0.15): Array<{ p: THREE.Vector3; n: THREE.Vector3 }> {
  const out: Array<{ p: THREE.Vector3; n: THREE.Vector3 }> = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  const total = Math.round(count / ((1 - minY) / 2));
  for (let i = 0; i < total && out.length < count; i++) {
    const y = 1 - (i / (total - 1)) * 2;
    if (y < minY) break;
    const rr = Math.sqrt(1 - y * y);
    const th = golden * i;
    const n = new THREE.Vector3(Math.cos(th) * rr, y, Math.sin(th) * rr);
    out.push({ p: n.clone().multiplyScalar(radius), n });
  }
  return out;
}

/* ───────────────────────── Tableware ───────────────────────── */

export function dinnerPlate(): THREE.BufferGeometry {
  return cached('plate', () => {
    const pts = [
      [0, 0],
      [0.07, 0.0],
      [0.08, 0.006],
      [0.1, 0.012],
      [0.13, 0.018],
      [0.135, 0.02],
      [0.131, 0.021],
      [0.1, 0.015],
      [0.075, 0.009],
      [0, 0.008],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    return new THREE.LatheGeometry(pts, 40);
  });
}

export function chargerPlate(): THREE.BufferGeometry {
  return cached('charger', () => {
    const pts = [
      [0, 0],
      [0.15, 0],
      [0.165, 0.008],
      [0.168, 0.012],
      [0.16, 0.012],
      [0.15, 0.006],
      [0, 0.005],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    return new THREE.LatheGeometry(pts, 48);
  });
}

/** Thin-walled wine glass: foot, stem, bowl */
export function wineGlass(): THREE.BufferGeometry {
  return cached('wineglass', () => {
    const outer = [
      [0, 0],
      [0.036, 0.0],
      [0.036, 0.003],
      [0.008, 0.008],
      [0.004, 0.02],
      [0.0035, 0.1],
      [0.012, 0.11],
      [0.036, 0.135],
      [0.042, 0.165],
      [0.037, 0.2],
      [0.0355, 0.2],
      [0.04, 0.165],
      [0.034, 0.137],
      [0.01, 0.115],
      [0, 0.114],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    return new THREE.LatheGeometry(outer, 32);
  });
}

/** Wine sitting in the bowl of the glass above */
export function wineFill(): THREE.BufferGeometry {
  return cached('winefill', () => {
    const pts = [
      [0, 0.116],
      [0.01, 0.117],
      [0.032, 0.137],
      [0.037, 0.15],
      [0, 0.15],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    return new THREE.LatheGeometry(pts, 24);
  });
}

/** Champagne coupe for a tower */
export function coupeGlass(): THREE.BufferGeometry {
  return cached('coupe', () => {
    const pts = [
      [0, 0],
      [0.04, 0],
      [0.04, 0.003],
      [0.006, 0.01],
      [0.004, 0.085],
      [0.02, 0.092],
      [0.055, 0.105],
      [0.058, 0.118],
      [0.056, 0.118],
      [0.052, 0.107],
      [0.02, 0.095],
      [0, 0.094],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    return new THREE.LatheGeometry(pts, 32);
  });
}

export function coupeFill(): THREE.BufferGeometry {
  return cached('coupefill', () => {
    const pts = [
      [0, 0.095],
      [0.02, 0.096],
      [0.05, 0.106],
      [0.053, 0.112],
      [0, 0.112],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    return new THREE.LatheGeometry(pts, 24);
  });
}

/** Napkin folded into a soft rectangle, laid across the plate */
export function foldedNapkin(): THREE.BufferGeometry {
  return cached('napkin', () => {
    const g = new THREE.BoxGeometry(0.11, 0.014, 0.2, 8, 2, 12);
    const pos = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      // Pillowy centre, crisp folded edges
      const puff = (1 - Math.pow(Math.abs(x) / 0.055, 4)) * (1 - Math.pow(Math.abs(z) / 0.1, 4));
      if (pos.getY(i) > 0) pos.setY(i, pos.getY(i) + puff * 0.006);
    }
    g.computeVertexNormals();
    return g;
  });
}

/** Fork and knife pair either side of a place, merged */
export function cutlery(): THREE.BufferGeometry {
  return cached('cutlery', () => {
    const knife = new THREE.BoxGeometry(0.012, 0.003, 0.2);
    const fork = new THREE.BoxGeometry(0.01, 0.003, 0.18);
    return merge([placed(knife, [0.17, 0.002, 0]), placed(fork, [-0.17, 0.002, 0]), placed(fork, [-0.19, 0.002, 0.01])]);
  });
}

/* ───────────────────────── Furniture ───────────────────────── */

/**
 * Chiavari ballroom chair, the classic wedding chair: splayed bamboo-turned legs, stretchers,
 * a seat rail and a ladder back of spindle rows. Local +z faces the table.
 */
export function chiavariFrame(): THREE.BufferGeometry {
  return cached('chiavari', () => {
    const parts: THREE.BufferGeometry[] = [];
    const leg = new THREE.CylinderGeometry(0.012, 0.014, 0.45, 8);
    const seatY = 0.45;
    const hw = 0.19;
    const front = 0.17;
    const back = -0.17;
    // Legs (rear legs continue up as back posts, raked back slightly)
    for (const sx of [-1, 1]) {
      parts.push(placed(leg, [sx * hw, seatY / 2, front], [0.03, 0, sx * -0.03]));
      const post = new THREE.CylinderGeometry(0.012, 0.014, 0.95, 8);
      parts.push(placed(post, [sx * (hw - 0.01), 0.475, back - 0.03], [-0.08, 0, 0]));
      // Bamboo-style rings on the legs
      for (const y of [0.15, 0.3]) parts.push(placed(new THREE.TorusGeometry(0.014, 0.003, 6, 12), [sx * hw, y, front], [Math.PI / 2, 0, 0]));
    }
    // Stretchers
    const rail = (len: number) => new THREE.CylinderGeometry(0.007, 0.007, len, 6);
    parts.push(placed(rail(hw * 2), [0, 0.16, front], [0, 0, Math.PI / 2]));
    parts.push(placed(rail(hw * 2), [0, 0.16, back - 0.01], [0, 0, Math.PI / 2]));
    for (const sx of [-1, 1]) parts.push(placed(rail(0.34), [sx * hw, 0.12, 0], [Math.PI / 2, 0, 0]));
    // Seat frame
    const seatRail = new THREE.BoxGeometry(hw * 2 + 0.02, 0.03, 0.025);
    parts.push(placed(seatRail, [0, seatY - 0.015, front]));
    parts.push(placed(seatRail, [0, seatY - 0.015, back]));
    for (const sx of [-1, 1]) parts.push(placed(new THREE.BoxGeometry(0.025, 0.03, 0.36), [sx * hw, seatY - 0.015, 0]));
    // Ladder back: top rail plus three rows of spindles
    const topY = 0.93;
    const backZ = back - 0.065;
    parts.push(placed(new THREE.BoxGeometry(hw * 2 - 0.01, 0.05, 0.02), [0, topY, backZ], [-0.08, 0, 0]));
    for (const y of [0.58, 0.7, 0.82]) {
      parts.push(placed(rail(hw * 2 - 0.02), [0, y, backZ + (topY - y) * 0.08], [0, 0, Math.PI / 2]));
      for (let i = -3; i <= 3; i++) {
        parts.push(placed(new THREE.SphereGeometry(0.009, 8, 6), [i * 0.045, y, backZ + (topY - y) * 0.08]));
      }
    }
    return merge(parts);
  });
}

/** Padded seat cushion with a piped rounded edge */
export function seatCushion(): THREE.BufferGeometry {
  return cached('cushion', () => {
    const shape = new THREE.Shape();
    const w = 0.2;
    const d = 0.18;
    const r = 0.04;
    shape.moveTo(-w + r, -d);
    shape.lineTo(w - r, -d);
    shape.quadraticCurveTo(w, -d, w, -d + r);
    shape.lineTo(w, d - r);
    shape.quadraticCurveTo(w, d, w - r, d);
    shape.lineTo(-w + r, d);
    shape.quadraticCurveTo(-w, d, -w, d - r);
    shape.lineTo(-w, -d + r);
    shape.quadraticCurveTo(-w, -d, -w + r, -d);
    const g = new THREE.ExtrudeGeometry(shape, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 4, curveSegments: 6 });
    g.rotateX(-Math.PI / 2);
    g.translate(0, 0.462, 0);
    // Slight dome in the middle where the padding is
    const pos = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      if (pos.getY(i) > 0.49) pos.setY(i, pos.getY(i) + 0.012 * (1 - (x * x) / (w * w)) * (1 - (z * z) / (d * d)));
    }
    g.computeVertexNormals();
    return g;
  });
}

/** Organza sash tied around the chair back with a bow and trailing tails */
export function chairSash(): THREE.BufferGeometry {
  return cached('sash', () => {
    const parts: THREE.BufferGeometry[] = [];
    const band = new THREE.CylinderGeometry(0.205, 0.205, 0.07, 32, 1, true);
    band.scale(1, 1, 0.12);
    parts.push(placed(band, [0, 0.72, -0.235]));
    // Bow loops
    for (const sx of [-1, 1]) {
      const loop = new THREE.TorusGeometry(0.045, 0.014, 8, 20);
      loop.scale(1, 0.6, 0.4);
      parts.push(placed(loop, [sx * 0.045, 0.72, -0.27], [0, 0, sx * 0.3]));
      const tail = new THREE.PlaneGeometry(0.05, 0.28, 2, 8);
      const p = tail.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getY(i) * 14) * 0.008);
      tail.computeVertexNormals();
      parts.push(placed(tail, [sx * 0.03, 0.57, -0.272], [0.05, 0, sx * 0.12]));
    }
    parts.push(placed(new THREE.SphereGeometry(0.02, 10, 8), [0, 0.72, -0.272], [0, 0, 0], [1.2, 1, 0.6]));
    return merge(parts);
  });
}

/* ───────────────────────── Architecture ───────────────────────── */

/** Classical fluted column on a moulded base with a simple capital */
export function flutedColumn(height: number, radius: number): THREE.BufferGeometry {
  return cached(`column_${height}_${radius}`, () => {
    const r = radius;
    const prof: Array<[number, number]> = [
      [0, 0],
      [r * 1.45, 0],
      [r * 1.45, height * 0.035],
      [r * 1.3, height * 0.045],
      [r * 1.3, height * 0.06],
      [r * 1.12, height * 0.075],
      [r * 1.04, height * 0.085],
    ];
    const shaftSteps = 18;
    for (let i = 0; i <= shaftSteps; i++) {
      const t = i / shaftSteps;
      // Entasis: a slight swelling then taper of the shaft
      const swell = 1 + Math.sin(t * Math.PI * 0.8) * 0.025 - t * 0.12;
      prof.push([r * swell, height * (0.09 + t * 0.78)]);
    }
    prof.push(
      [r * 0.95, height * 0.88],
      [r * 1.08, height * 0.895],
      [r * 1.08, height * 0.905],
      [r * 1.2, height * 0.93],
      [r * 1.45, height * 0.96],
      [r * 1.55, height * 0.965],
      [r * 1.55, height],
      [0, height],
    );
    const g = new THREE.LatheGeometry(
      prof.map(([x, y]) => new THREE.Vector2(x, y)),
      96,
    );
    // 20 concave flutes along the shaft
    const pos = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      if (y < height * 0.095 || y > height * 0.865) continue;
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const a = Math.atan2(z, x);
      const rad = Math.hypot(x, z);
      const flute = Math.pow(Math.abs(Math.sin(a * 10)), 0.5);
      const nr = rad - (1 - flute) * r * 0.06;
      pos.setXYZ(i, (x / rad) * nr, y, (z / rad) * nr);
    }
    g.computeVertexNormals();
    return g;
  });
}

/** Footed pedestal urn that holds a flower arrangement */
export function urn(): THREE.BufferGeometry {
  return cached('urn', () => {
    const pts = [
      [0, 0],
      [0.14, 0],
      [0.14, 0.03],
      [0.08, 0.06],
      [0.06, 0.14],
      [0.1, 0.17],
      [0.2, 0.24],
      [0.25, 0.32],
      [0.26, 0.37],
      [0.29, 0.4],
      [0.27, 0.41],
      [0.22, 0.37],
      [0, 0.36],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    return new THREE.LatheGeometry(pts, 48);
  });
}

/** Pillar candle with a slightly melted top */
export function pillarCandle(height: number): THREE.BufferGeometry {
  return cached(`candle_${height}`, () => {
    const pts = [
      [0, 0],
      [0.035, 0],
      [0.036, height - 0.01],
      [0.033, height],
      [0.02, height - 0.006],
      [0, height - 0.004],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    return new THREE.LatheGeometry(pts, 24);
  });
}

/** Teardrop flame */
export function flame(): THREE.BufferGeometry {
  return cached('flame', () => {
    const pts: THREE.Vector2[] = [];
    for (let i = 0; i <= 12; i++) {
      const t = i / 12;
      pts.push(new THREE.Vector2(Math.sin(t * Math.PI) * 0.009 * (1 - t * 0.6), t * 0.035));
    }
    return new THREE.LatheGeometry(pts, 12);
  });
}

/** Rounded-edge slab (stage deck, steps) */
export function roundedSlab(w: number, h: number, d: number, r = 0.03): THREE.BufferGeometry {
  return cached(`slab_${w}_${h}_${d}_${r}`, () => {
    const shape = new THREE.Shape();
    const hw = w / 2 - r;
    const hd = d / 2 - r;
    shape.moveTo(-hw, -hd - r);
    shape.lineTo(hw, -hd - r);
    shape.absarc(hw, -hd, r, -Math.PI / 2, 0, false);
    shape.lineTo(hw + r, hd);
    shape.absarc(hw, hd, r, 0, Math.PI / 2, false);
    shape.lineTo(-hw, hd + r);
    shape.absarc(-hw, hd, r, Math.PI / 2, Math.PI, false);
    shape.lineTo(-hw - r, -hd);
    shape.absarc(-hw, -hd, r, Math.PI, Math.PI * 1.5, false);
    const g = new THREE.ExtrudeGeometry(shape, { depth: h - r * 2, bevelEnabled: true, bevelThickness: r, bevelSize: 0, bevelSegments: 3, curveSegments: 6 });
    g.rotateX(-Math.PI / 2);
    g.translate(0, r - h / 2, 0);
    return g;
  });
}

/** Ornate picture frame moulding (bevelled extrusion of a rectangle with a window) */
export function pictureFrame(w: number, h: number, border: number): THREE.BufferGeometry {
  return cached(`frame_${w}_${h}_${border}`, () => {
    const s = new THREE.Shape();
    s.moveTo(-w / 2, -h / 2);
    s.lineTo(w / 2, -h / 2);
    s.lineTo(w / 2, h / 2);
    s.lineTo(-w / 2, h / 2);
    s.lineTo(-w / 2, -h / 2);
    const hole = new THREE.Path();
    const iw = w / 2 - border;
    const ih = h / 2 - border;
    hole.moveTo(-iw, -ih);
    hole.lineTo(-iw, ih);
    hole.lineTo(iw, ih);
    hole.lineTo(iw, -ih);
    hole.lineTo(-iw, -ih);
    s.holes.push(hole);
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.02, bevelEnabled: true, bevelThickness: 0.018, bevelSize: border * 0.45, bevelSegments: 5 });
    g.translate(0, 0, -0.01);
    return g;
  });
}

/* ───────────────────────── Lanterns ───────────────────────── */

/**
 * Ribbed lantern body. 'silk' is the Hội An / Mekong style: a bulging silk body stretched
 * over bamboo ribs; 'paper' is a round rice-paper lantern with fine horizontal ribs.
 */
export function lanternBody(kind: 'silk' | 'paper'): THREE.BufferGeometry {
  return cached(`lantern_${kind}`, () => {
    const pts: THREE.Vector2[] = [];
    const steps = 32;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const y = (t - 0.5) * (kind === 'silk' ? 0.5 : 0.56);
      const r = kind === 'silk' ? 0.08 + Math.sin(t * Math.PI) * 0.17 : Math.max(0.05, Math.sin(t * Math.PI) * 0.28);
      pts.push(new THREE.Vector2(r, y));
    }
    const g = new THREE.LatheGeometry(pts, 96);
    const pos = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const a = Math.atan2(z, x);
      const rad = Math.hypot(x, z);
      let k = 1;
      if (kind === 'silk') {
        // Fabric sags between 12 vertical ribs
        k = 1 - (1 - Math.pow(Math.abs(Math.cos(a * 6)), 0.35)) * 0.06;
      } else {
        // Paper puckers between thin horizontal hoops
        k = 1 - Math.pow(Math.abs(Math.sin(y * 70)), 6) * 0.015;
      }
      pos.setXYZ(i, (x / (rad || 1)) * rad * k, y, (z / (rad || 1)) * rad * k);
    }
    g.computeVertexNormals();
    return g;
  });
}

/** Tassel: a bundle of threads under a lantern */
export function tassel(): THREE.BufferGeometry {
  return cached('tassel', () => {
    const parts: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      parts.push(placed(new THREE.CylinderGeometry(0.003, 0.002, 0.22, 3), [Math.cos(a) * 0.018, -0.11, Math.sin(a) * 0.018], [Math.sin(a) * 0.06, 0, Math.cos(a) * 0.06]));
    }
    parts.push(placed(new THREE.SphereGeometry(0.025, 10, 8), [0, 0.01, 0]));
    return merge(parts);
  });
}
