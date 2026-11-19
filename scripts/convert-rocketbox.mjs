#!/usr/bin/env node
/**
 * Converts Microsoft Rocketbox avatars (MIT licence, https://github.com/microsoft/Microsoft-Rocketbox)
 * into web-ready GLB files for the wedding hall: realistic, rigged people the guests choose
 * from in the character creator, plus one shared animation set per body type (idle, walk,
 * sit, wave, clap, cheer, drink).
 *
 * Pure Node: three.js's FBXLoader reads the FBX, GLTFExporter writes GLB, ImageMagick turns
 * the TGA textures into PNG, sharp + glTF-Transform attach them as WebP and compress.
 *
 *   node scripts/convert-rocketbox.mjs <path to a Microsoft-Rocketbox checkout or blobless clone>
 *
 * Output: apps/web/public/assets/people/{<id>.glb, <id>.webp (thumbnail), anim_f.glb, anim_m.glb}
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

// Minimal browser shims so three's loaders/exporters run in Node (textures are added later)
globalThis.self = globalThis;
globalThis.window = globalThis;
globalThis.document = {
  createElementNS: () => ({ addEventListener() {}, removeEventListener() {}, style: {} }),
  createElement: () => ({ getContext: () => null, style: {} }),
};
globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((b) => {
      this.result = b;
      this.onloadend?.();
      this.onload?.();
    });
  }
  readAsDataURL(blob) {
    blob.arrayBuffer().then((b) => {
      this.result = `data:${blob.type};base64,${Buffer.from(b).toString('base64')}`;
      this.onloadend?.();
      this.onload?.();
    });
  }
};

const THREE = await import('three');
const { FBXLoader } = await import('three/examples/jsm/loaders/FBXLoader.js');
const { GLTFExporter } = await import('three/examples/jsm/exporters/GLTFExporter.js');
const { NodeIO } = await import('@gltf-transform/core');
const { ALL_EXTENSIONS, EXTMeshoptCompression, EXTTextureWebP } = await import('@gltf-transform/extensions');
const { dedup, prune, weld, quantize, resample, textureCompress } = await import('@gltf-transform/functions');
const { MeshoptEncoder } = await import('meshoptimizer');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'apps/web/public/assets/people');
const REPO = process.argv[2];
const ONLY = process.argv.find((a) => a.startsWith('--only='))?.slice(7).split(',');
const FORCE = process.argv.includes('--force');
const THUMBS_ONLY = process.argv.includes('--thumbs-only');
if (!REPO) {
  console.error('usage: node scripts/convert-rocketbox.mjs <Microsoft-Rocketbox checkout> [--only=id,id] [--force]');
  process.exit(1);
}

/** People offered to guests: dressed for a party or the office, adults only */
export const PEOPLE = [
  ...['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17'].map((n) => `Adults/Female_Adult_${n}`),
  'Adults/Female_Party_01',
  'Adults/Female_Party_02',
  ...['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21'].map((n) => `Adults/Male_Adult_${n}`),
  ...['01', '02', '03', '04'].map((n) => `Professions/Business_Female_${n}`),
  ...['01', '02', '03', '04', '05', '06', '07'].map((n) => `Professions/Business_Male_${n}`),
];

/** Animation clips per body type: our state name → Rocketbox file (folder/stem) */
const CLIPS = {
  idle: ['static', 'idle_neutral_01'],
  walk: ['xy', 'walk_neutral_01'],
  sit: ['static', 'sit_chair_idle_neutral_01'],
  wave: ['static', 'wave_01'],
  clap: ['static', 'claphands_01'],
  cheers: ['static', 'cheer_01'],
  drink: ['static', 'drink_drinking'],
};

/** Read a file from a full checkout, or from a blobless clone via git */
function readRepo(rel) {
  const full = path.join(REPO, rel);
  if (fs.existsSync(full)) return fs.readFileSync(full);
  return execFileSync('git', ['-C', REPO, 'show', `HEAD:${rel}`], { maxBuffer: 1 << 30 });
}

function listRepo(dirRel) {
  const full = path.join(REPO, dirRel);
  if (fs.existsSync(full)) return fs.readdirSync(full);
  return execFileSync('git', ['-C', REPO, 'ls-tree', '--name-only', `HEAD:${dirRel}`]).toString().trim().split('\n');
}

function parseFbx(buf) {
  return new FBXLoader().parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), '');
}

async function exportGlb(input, animations = []) {
  const res = await new GLTFExporter().parseAsync(input, { binary: true, animations, onlyVisible: false });
  return new Uint8Array(res);
}

async function tgaToPng(buf) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rb-tex-'));
  const tga = path.join(dir, 't.tga');
  const png = path.join(dir, 't.png');
  fs.writeFileSync(tga, buf);
  // FBX texture space has V pointing up, glTF's points down: flip the image to match
  execFileSync('convert', [tga, '-flip', png]);
  const out = fs.readFileSync(png);
  fs.rmSync(dir, { recursive: true, force: true });
  return out;
}

async function flipGreen(png) {
  const { data, info } = await sharp(png).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 1; i < data.length; i += info.channels) data[i] = 255 - data[i];
  return sharp(data, { raw: { width: info.width, height: info.height, channels: info.channels } }).png().toBuffer();
}

/** Specular map (bright = shiny) → glTF metallic-roughness texture (roughness in green) */
async function specToRoughness(png) {
  const { data, info } = await sharp(png).greyscale().raw().toBuffer({ resolveWithObject: true });
  const out = Buffer.alloc(info.width * info.height * 3);
  for (let i = 0; i < info.width * info.height; i++) {
    const spec = data[i * info.channels] / 255;
    out[i * 3] = 255; // occlusion: none
    out[i * 3 + 1] = Math.round((0.9 - spec * 0.6) * 255); // roughness
    out[i * 3 + 2] = 0; // metalness: none
  }
  return sharp(out, { raw: { width: info.width, height: info.height, channels: 3 } }).png().toBuffer();
}

/** Head-and-shoulders portrait cut from Rocketbox's 1280×720 full-body preview */
async function writeThumb(rel, id) {
  try {
    const thumb = readRepo(`Assets/Avatars/${rel}/${path.basename(rel)}.png`);
    const meta = await sharp(thumb).metadata();
    const side = Math.round(meta.height * 0.42);
    await sharp(thumb)
      .extract({ left: Math.round(meta.width / 2 - side / 2), top: Math.round(meta.height * 0.02), width: side, height: side })
      .resize(256, 256)
      .flatten({ background: '#f6ece6' })
      .webp({ quality: 82 })
      .toFile(path.join(OUT, `${id}.webp`));
  } catch {
    console.warn(`  (no thumbnail for ${id})`);
  }
}

async function convertPerson(rel) {
  const id = path.basename(rel).toLowerCase();
  if (THUMBS_ONLY) return writeThumb(rel, id);
  const outFile = path.join(OUT, `${id}.glb`);
  if (fs.existsSync(outFile) && !FORCE) return console.log(`= ${id}`);

  const fbx = parseFbx(readRepo(`Assets/Avatars/${rel}/Export/${path.basename(rel)}.fbx`));
  // Rocketbox works in centimetres: bake the scale into the root
  fbx.scale.setScalar(0.01);
  const matNames = new Set();
  fbx.traverse((o) => {
    if (!o.isMesh) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    const clean = mats.map((m) => {
      matNames.add(m.name);
      return new THREE.MeshStandardMaterial({ name: m.name, color: 0xffffff, roughness: 0.7 });
    });
    o.material = Array.isArray(o.material) ? clean : clean[0];
  });
  const glb = await exportGlb(fbx);

  await MeshoptEncoder.ready;
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder });
  const doc = await io.readBinary(glb);
  const texDir = `Assets/Avatars/${rel}/Textures`;
  const texFiles = listRepo(texDir);
  const findTex = (prefix, kind) => texFiles.find((f) => f.toLowerCase() === `${prefix}_${kind}.tga`.toLowerCase());

  for (const mat of doc.getRoot().listMaterials()) {
    const prefix = mat.getName(); // e.g. f001_body, f001_head, f001_opacity
    const color = findTex(prefix, 'color');
    if (color) {
      const png = await tgaToPng(readRepo(`${texDir}/${color}`));
      const meta = await sharp(png).metadata();
      const tex = doc.createTexture(`${prefix}_color`).setImage(new Uint8Array(png)).setMimeType('image/png');
      mat.setBaseColorTexture(tex);
      if (prefix.endsWith('opacity') || meta.hasAlpha) {
        // Hair, lashes and brows are alpha-cut cards
        mat.setAlphaMode('MASK').setAlphaCutoff(0.45).setDoubleSided(true);
      }
    }
    const normal = findTex(prefix, 'normal');
    if (normal) {
      const png = await tgaToPng(readRepo(`${texDir}/${normal}`));
      // 3ds Max normal maps are Y-down (DirectX): flip green for glTF
      const flipped = await flipGreen(png);
      mat.setNormalTexture(doc.createTexture(`${prefix}_normal`).setImage(new Uint8Array(flipped)).setMimeType('image/png'));
    }
    const spec = findTex(prefix, 'specular');
    if (spec) {
      const rough = await specToRoughness(await tgaToPng(readRepo(`${texDir}/${spec}`)));
      mat.setMetallicRoughnessTexture(doc.createTexture(`${prefix}_rough`).setImage(new Uint8Array(rough)).setMimeType('image/png'));
      mat.setRoughnessFactor(1).setMetallicFactor(0);
    } else {
      mat.setRoughnessFactor(0.65).setMetallicFactor(0);
    }
  }

  await doc.transform(
    dedup(),
    weld(),
    prune(),
    textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [1024, 1024], quality: 82, slots: /baseColor/ }),
    textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [512, 512], quality: 85, slots: /^(?!baseColor)/ }),
    quantize(),
  );
  doc.createExtension(EXTTextureWebP).setRequired(true);
  doc.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({ method: EXTMeshoptCompression.EncoderMethod.QUANTIZE });
  fs.mkdirSync(OUT, { recursive: true });
  await io.write(outFile, doc);

  await writeThumb(rel, id);
  console.log(`+ ${id}  ${(fs.statSync(outFile).size / 1e6).toFixed(2)} MB  [${[...matNames].join(', ')}]`);
}

/** Remove the horizontal drift from a walk cycle so it plays in place (the game moves the body) */
function inPlace(clip) {
  const track = clip.tracks.find((t) => t.name === 'Bip01.position');
  if (!track) return;
  const v = track.values;
  const n = v.length / 3;
  // The forward axis is the one that drifts the most between first and last key
  const drift = [0, 1, 2].map((a) => Math.abs(v[(n - 1) * 3 + a] - v[a]));
  const vertical = drift.indexOf(Math.min(...drift));
  for (let a = 0; a < 3; a++) {
    if (a === vertical) continue;
    const start = v[a];
    for (let i = 0; i < n; i++) v[i * 3 + a] = start;
  }
}

async function convertAnimations(prefix) {
  const outFile = path.join(OUT, `anim_${prefix}.glb`);
  if (fs.existsSync(outFile) && !FORCE) return console.log(`= anim_${prefix}`);
  let rig = null;
  const clips = [];
  for (const [name, [folder, stem]] of Object.entries(CLIPS)) {
    const file = `Assets/Animations/all_animations_max_motextr_${folder}/${prefix}_${stem}.max.fbx`;
    let fbx;
    try {
      fbx = parseFbx(readRepo(file));
    } catch {
      console.warn(`  (missing ${file})`);
      continue;
    }
    if (!rig) {
      rig = fbx;
      rig.scale.setScalar(0.01);
    }
    const clip = fbx.animations[0];
    clip.name = name;
    // Keep rotations (and the root's height); drop scale and helper tracks
    clip.tracks = clip.tracks.filter((t) => !t.name.endsWith('.scale') && !t.name.includes('Footsteps') && (t.name.endsWith('.quaternion') || t.name === 'Bip01.position'));
    if (name === 'walk') inPlace(clip);
    clips.push(clip);
  }
  fs.mkdirSync(OUT, { recursive: true });
  const glb = await exportGlb(rig, clips);
  await MeshoptEncoder.ready;
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder });
  const doc = await io.readBinary(glb);
  await doc.transform(resample({ tolerance: 1e-3 }), prune({ keepLeaves: true }), quantize());
  doc.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({ method: EXTMeshoptCompression.EncoderMethod.QUANTIZE });
  await io.write(outFile, doc);
  console.log(`+ anim_${prefix}  ${(fs.statSync(outFile).size / 1e6).toFixed(2)} MB  clips: ${clips.map((c) => c.name).join(', ')}`);
}

const origWarn = console.warn;
console.warn = (...a) => (String(a[0]).startsWith('THREE.FBXLoader') || String(a[0]).startsWith('FBXLoader') ? undefined : origWarn(...a));

for (const prefix of ['f', 'm']) if (!THUMBS_ONLY && (!ONLY || ONLY.includes(`anim_${prefix}`))) await convertAnimations(prefix);
for (const rel of PEOPLE) {
  const id = path.basename(rel).toLowerCase();
  if (ONLY && !ONLY.includes(id)) continue;
  try {
    await convertPerson(rel);
  } catch (e) {
    console.error(`! ${id}: ${e.message}`);
  }
}

let licence = '';
try {
  licence = readRepo('LICENSE.md').toString();
} catch {
  licence = 'MIT License — see https://github.com/microsoft/Microsoft-Rocketbox/blob/master/LICENSE';
}
fs.writeFileSync(
  path.join(OUT, 'CREDITS.md'),
  `# People\n\nRealistic rigged people and their animations come from the Microsoft Rocketbox library\n(https://github.com/microsoft/Microsoft-Rocketbox), converted to GLB by \`scripts/convert-rocketbox.mjs\`.\n\n## Licence\n\n\`\`\`\n${licence.trim()}\n\`\`\`\n`,
);
