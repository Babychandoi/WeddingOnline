import fs from 'node:fs';
import path from 'node:path';

const OUT_DIR = path.join(process.cwd(), 'apps', 'web', 'public', 'models');

function hexToLinearRgb(hex) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const toLin = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return [toLin(r), toLin(g), toLin(b), 1.0];
}

function createBox(w, h, d, center = [0, 0, 0]) {
  const [cx, cy, cz] = center;
  const hw = w / 2;
  const hh = h / 2;
  const hd = d / 2;

  const faces = [
    // +Z front
    { n: [0, 0, 1], pts: [[-hw, -hh, hd], [hw, -hh, hd], [hw, hh, hd], [-hw, hh, hd]] },
    // -Z back
    { n: [0, 0, -1], pts: [[hw, -hh, -hd], [-hw, -hh, -hd], [-hw, hh, -hd], [hw, hh, -hd]] },
    // +X right
    { n: [1, 0, 0], pts: [[hw, -hh, hd], [hw, -hh, -hd], [hw, hh, -hd], [hw, hh, hd]] },
    // -X left
    { n: [-1, 0, 0], pts: [[-hw, -hh, -hd], [-hw, -hh, hd], [-hw, hh, hd], [-hw, hh, -hd]] },
    // +Y top
    { n: [0, 1, 0], pts: [[-hw, hh, hd], [hw, hh, hd], [hw, hh, -hd], [-hw, hh, -hd]] },
    // -Y bottom
    { n: [0, -1, 0], pts: [[-hw, -hh, -hd], [hw, -hh, -hd], [hw, -hh, hd], [-hw, -hh, hd]] },
  ];

  const positions = [];
  const normals = [];
  const indices = [];

  for (const face of faces) {
    const base = positions.length / 3;
    for (const [x, y, z] of face.pts) {
      positions.push(x + cx, y + cy, z + cz);
      normals.push(face.n[0], face.n[1], face.n[2]);
    }
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }

  return { positions, normals, indices };
}

function createCylinder(rt, rb, h, radialSegments = 16, center = [0, 0, 0]) {
  const [cx, cy, cz] = center;
  const hh = h / 2;
  const positions = [];
  const normals = [];
  const indices = [];

  const slope = (rb - rt) / h;

  // Side ring vertices
  const sideStart = 0;
  for (let i = 0; i <= radialSegments; i++) {
    const theta = (i / radialSegments) * Math.PI * 2;
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    const nx = cos;
    const ny = slope;
    const nz = sin;
    const len = Math.hypot(nx, ny, nz) || 1;

    // top ring
    positions.push(cx + rt * cos, cy + hh, cz + rt * sin);
    normals.push(nx / len, ny / len, nz / len);
    // bottom ring
    positions.push(cx + rb * cos, cy - hh, cz + rb * sin);
    normals.push(nx / len, ny / len, nz / len);
  }

  for (let i = 0; i < radialSegments; i++) {
    const a = sideStart + i * 2;
    const b = a + 1;
    const c = a + 2;
    const d = a + 3;
    indices.push(a, b, d, a, d, c);
  }

  // Top cap (if rt > 0)
  if (rt > 0.001) {
    const topCenterIdx = positions.length / 3;
    positions.push(cx, cy + hh, cz);
    normals.push(0, 1, 0);
    for (let i = 0; i <= radialSegments; i++) {
      const theta = (i / radialSegments) * Math.PI * 2;
      positions.push(cx + rt * Math.cos(theta), cy + hh, cz + rt * Math.sin(theta));
      normals.push(0, 1, 0);
    }
    for (let i = 0; i < radialSegments; i++) {
      indices.push(topCenterIdx, topCenterIdx + 1 + i + 1, topCenterIdx + 1 + i);
    }
  }

  // Bottom cap (if rb > 0)
  if (rb > 0.001) {
    const botCenterIdx = positions.length / 3;
    positions.push(cx, cy - hh, cz);
    normals.push(0, -1, 0);
    for (let i = 0; i <= radialSegments; i++) {
      const theta = (i / radialSegments) * Math.PI * 2;
      positions.push(cx + rb * Math.cos(theta), cy - hh, cz + rb * Math.sin(theta));
      normals.push(0, -1, 0);
    }
    for (let i = 0; i < radialSegments; i++) {
      indices.push(botCenterIdx, botCenterIdx + 1 + i, botCenterIdx + 1 + i + 1);
    }
  }

  return { positions, normals, indices };
}

function createSphere(radius, widthSeg = 12, heightSeg = 8, center = [0, 0, 0]) {
  const [cx, cy, cz] = center;
  const positions = [];
  const normals = [];
  const indices = [];

  for (let y = 0; y <= heightSeg; y++) {
    const v = y / heightSeg;
    const phi = v * Math.PI;
    for (let x = 0; x <= widthSeg; x++) {
      const u = x / widthSeg;
      const theta = u * Math.PI * 2;
      const nx = -Math.cos(theta) * Math.sin(phi);
      const ny = Math.cos(phi);
      const nz = Math.sin(theta) * Math.sin(phi);
      positions.push(cx + radius * nx, cy + radius * ny, cz + radius * nz);
      normals.push(nx, ny, nz);
    }
  }

  const row = widthSeg + 1;
  for (let y = 0; y < heightSeg; y++) {
    for (let x = 0; x < widthSeg; x++) {
      const a = y * row + x;
      const b = (y + 1) * row + x;
      const c = (y + 1) * row + (x + 1);
      const d = y * row + (x + 1);
      if (y !== 0) indices.push(a, b, d);
      if (y !== heightSeg - 1) indices.push(b, c, d);
    }
  }

  return { positions, normals, indices };
}

function mergePrimitives(parts) {
  const positions = [];
  const normals = [];
  const indices = [];
  for (const part of parts) {
    const offset = positions.length / 3;
    positions.push(...part.positions);
    normals.push(...part.normals);
    for (const idx of part.indices) {
      indices.push(idx + offset);
    }
  }
  return { positions, normals, indices };
}

function computeMinMaxVec3(arr) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < arr.length; i += 3) {
    if (arr[i] < min[0]) min[0] = arr[i];
    if (arr[i + 1] < min[1]) min[1] = arr[i + 1];
    if (arr[i + 2] < min[2]) min[2] = arr[i + 2];
    if (arr[i] > max[0]) max[0] = arr[i];
    if (arr[i + 1] > max[1]) max[1] = arr[i + 1];
    if (arr[i + 2] > max[2]) max[2] = arr[i + 2];
  }
  return { min, max };
}

function buildGlb(primitivesWithMaterials) {
  const materials = [];
  const meshPrimitives = [];
  const bufferViews = [];
  const accessors = [];
  const chunks = [];
  let byteOffset = 0;

  const pushBuffer = (typedArray, target) => {
    const raw = Buffer.from(typedArray.buffer, typedArray.byteOffset, typedArray.byteLength);
    const padLen = (4 - (raw.length % 4)) % 4;
    const padded = padLen > 0 ? Buffer.concat([raw, Buffer.alloc(padLen, 0)]) : raw;
    const viewIndex = bufferViews.length;
    bufferViews.push({
      buffer: 0,
      byteOffset,
      byteLength: raw.length,
      target,
    });
    chunks.push(padded);
    byteOffset += padded.length;
    return viewIndex;
  };

  for (const entry of primitivesWithMaterials) {
    const matIndex = materials.length;
    materials.push({
      name: entry.name,
      pbrMetallicRoughness: {
        baseColorFactor: hexToLinearRgb(entry.color),
        metallicFactor: entry.metallic ?? 0.05,
        roughnessFactor: entry.roughness ?? 0.5,
      },
      ...(entry.emissive ? { emissiveFactor: hexToLinearRgb(entry.emissive).slice(0, 3) } : {}),
    });

    const posArr = new Float32Array(entry.geometry.positions);
    const normArr = new Float32Array(entry.geometry.normals);
    const idxArr = new Uint16Array(entry.geometry.indices);

    const posView = pushBuffer(posArr, 34962);
    const normView = pushBuffer(normArr, 34962);
    const idxView = pushBuffer(idxArr, 34963);

    const { min, max } = computeMinMaxVec3(entry.geometry.positions);
    const posAcc = accessors.length;
    accessors.push({
      bufferView: posView,
      componentType: 5126,
      count: entry.geometry.positions.length / 3,
      type: 'VEC3',
      min,
      max,
    });

    const normAcc = accessors.length;
    accessors.push({
      bufferView: normView,
      componentType: 5126,
      count: entry.geometry.normals.length / 3,
      type: 'VEC3',
    });

    const idxAcc = accessors.length;
    accessors.push({
      bufferView: idxView,
      componentType: 5123,
      count: entry.geometry.indices.length,
      type: 'SCALAR',
    });

    meshPrimitives.push({
      attributes: {
        POSITION: posAcc,
        NORMAL: normAcc,
      },
      indices: idxAcc,
      material: matIndex,
    });
  }

  const gltfJson = {
    asset: { version: '2.0', generator: 'DamCuoiOnline Asset Pipeline v1.0' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0, name: 'RootAsset' }],
    meshes: [{ primitives: meshPrimitives }],
    materials,
    bufferViews,
    accessors,
    buffers: [{ byteLength: byteOffset }],
  };

  const jsonRaw = Buffer.from(JSON.stringify(gltfJson), 'utf8');
  const jsonPad = (4 - (jsonRaw.length % 4)) % 4;
  const jsonBuf = jsonPad > 0 ? Buffer.concat([jsonRaw, Buffer.alloc(jsonPad, 0x20)]) : jsonRaw;
  const binBuf = Buffer.concat(chunks);

  const totalLength = 12 + 8 + jsonBuf.length + 8 + binBuf.length;
  const out = Buffer.alloc(totalLength);

  // Header
  out.writeUInt32LE(0x46546c67, 0); // 'glTF'
  out.writeUInt32LE(2, 4);
  out.writeUInt32LE(totalLength, 8);

  // JSON Chunk
  out.writeUInt32LE(jsonBuf.length, 12);
  out.writeUInt32LE(0x4e4f534a, 16); // 'JSON'
  jsonBuf.copy(out, 20);

  // BIN Chunk
  const binHeaderOffset = 20 + jsonBuf.length;
  out.writeUInt32LE(binBuf.length, binHeaderOffset);
  out.writeUInt32LE(0x004e4942, binHeaderOffset + 4); // 'BIN\0'
  binBuf.copy(out, binHeaderOffset + 8);

  return out;
}

function generateModels() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // 1. 3-Tier Wedding Cake with Roses & Candle
  const cakeRoses = [];
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    cakeRoses.push(createSphere(0.055, 8, 6, [Math.cos(angle) * 0.42, 0.34, Math.sin(angle) * 0.42]));
  }
  const cakeGlb = buildGlb([
    {
      name: 'CreamFrostingBottom',
      color: '#fff1f2',
      roughness: 0.45,
      geometry: mergePrimitives([
        createCylinder(0.46, 0.49, 0.32, 20, [0, 0.16, 0]),
        createCylinder(0.2, 0.22, 0.2, 18, [0, 0.66, 0]),
      ]),
    },
    {
      name: 'RoseFrostingMiddle',
      color: '#fecdd3',
      roughness: 0.45,
      geometry: createCylinder(0.33, 0.35, 0.24, 20, [0, 0.44, 0]),
    },
    {
      name: 'PinkSugarRoses',
      color: '#f43f5e',
      roughness: 0.4,
      geometry: mergePrimitives(cakeRoses),
    },
    {
      name: 'GoldCandleFlame',
      color: '#facc15',
      metallic: 0.2,
      roughness: 0.25,
      emissive: '#fbbf24',
      geometry: mergePrimitives([
        createCylinder(0.025, 0.025, 0.12, 10, [0, 0.81, 0]),
        createSphere(0.065, 10, 8, [0, 0.9, 0]),
      ]),
    },
  ]);

  // 2. Gift Box Stand + Ribbon + Heart Ornament
  const giftBoxGlb = buildGlb([
    {
      name: 'IvoryPedestal',
      color: '#ffe4e6',
      roughness: 0.5,
      geometry: createBox(0.95, 0.9, 0.95, [0, 0.45, 0]),
    },
    {
      name: 'GoldPlatterAndRibbons',
      color: '#d4af37',
      metallic: 0.5,
      roughness: 0.3,
      geometry: mergePrimitives([
        createBox(1.04, 0.06, 1.04, [0, 0.93, 0]),
        createBox(0.62, 0.5, 0.1, [0, 1.2, 0]),
        createBox(0.1, 0.5, 0.52, [0, 1.2, 0]),
      ]),
    },
    {
      name: 'CrimsonGiftAndHeart',
      color: '#e11d48',
      roughness: 0.4,
      geometry: mergePrimitives([
        createBox(0.58, 0.46, 0.48, [0, 1.19, 0]),
        createSphere(0.11, 10, 8, [-0.08, 1.54, 0]),
        createSphere(0.11, 10, 8, [0.08, 1.54, 0]),
        createCylinder(0.16, 0.01, 0.18, 10, [0, 1.47, 0]),
      ]),
    },
  ]);

  // 3. Bridal Bouquet
  const roseCluster = [];
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    roseCluster.push(createSphere(0.13, 10, 8, [Math.cos(angle) * 0.15, 0.27, Math.sin(angle) * 0.15]));
  }
  roseCluster.push(createSphere(0.15, 10, 8, [0, 0.34, 0]));

  const bouquetGlb = buildGlb([
    {
      name: 'SilkWrapCone',
      color: '#ec4899',
      roughness: 0.5,
      geometry: createCylinder(0.24, 0.03, 0.45, 14, [0, 0, 0]),
    },
    {
      name: 'SatinGoldRibbon',
      color: '#fbbf24',
      metallic: 0.35,
      roughness: 0.35,
      geometry: createCylinder(0.14, 0.14, 0.07, 14, [0, 0.16, 0]),
    },
    {
      name: 'PastelRoseBlossoms',
      color: '#fbcfe8',
      roughness: 0.45,
      geometry: mergePrimitives(roseCluster),
    },
  ]);

  // 4. Coconut Gate Crest Plaque (Song Hy Relief)
  const crestGlb = buildGlb([
    {
      name: 'CrimsonLacquerPlaque',
      color: '#dc2626',
      roughness: 0.4,
      geometry: createBox(1.3, 0.54, 0.12, [0, 0, 0]),
    },
    {
      name: 'GoldSongHyFrame',
      color: '#facc15',
      metallic: 0.55,
      roughness: 0.28,
      geometry: mergePrimitives([
        createBox(1.4, 0.06, 0.14, [0, 0.27, 0]),
        createBox(1.4, 0.06, 0.14, [0, -0.27, 0]),
        createBox(0.06, 0.54, 0.14, [-0.67, 0, 0]),
        createBox(0.06, 0.54, 0.14, [0.67, 0, 0]),
        // Stylized double-happiness bars
        createBox(0.04, 0.32, 0.04, [-0.18, 0, 0.08]),
        createBox(0.04, 0.32, 0.04, [0.18, 0, 0.08]),
        createBox(0.18, 0.04, 0.04, [-0.18, 0.07, 0.08]),
        createBox(0.18, 0.04, 0.04, [0.18, 0.07, 0.08]),
        createBox(0.42, 0.04, 0.04, [0, -0.05, 0.08]),
      ]),
    },
  ]);

  const files = [
    ['stage-cake.glb', cakeGlb],
    ['gift-heart-box.glb', giftBoxGlb],
    ['bouquet-flowers.glb', bouquetGlb],
    ['coconut-arch-crest.glb', crestGlb],
  ];

  let totalBytes = 0;
  for (const [name, buf] of files) {
    const outPath = path.join(OUT_DIR, name);
    fs.writeFileSync(outPath, buf);
    totalBytes += buf.length;
    console.log(`Generated ${name}: ${buf.length} bytes (magic=${buf.subarray(0, 4).toString('ascii')})`);
  }
  console.log(`Total .glb assets size: ${(totalBytes / 1024).toFixed(1)} KB (< 500 KB OK)`);
}

generateModels();
