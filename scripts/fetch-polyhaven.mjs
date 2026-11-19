#!/usr/bin/env node
/**
 * Downloads the real-world (photo-scanned) assets the 3D venues use from Poly Haven
 * (https://polyhaven.com, all CC0) and optimises them for the web:
 *
 *   - models  → GLB, textures resized + WebP, geometry simplified (trees), meshopt-compressed
 *   - textures→ diffuse / normal / roughness WebP for floors and grounds
 *   - HDRIs   → 2k Radiance .hdr skies used as background + lighting
 *
 * Output: apps/web/public/assets/ph/{models,textures,hdri} and CREDITS.md.
 * Re-run any time: `node scripts/fetch-polyhaven.mjs` (skips files already present;
 * pass --force to rebuild). The optimiser tools are not project dependencies (sharp ships
 * native binaries); install them for the run only:
 *
 *   npm i --no-save sharp @gltf-transform/core @gltf-transform/extensions @gltf-transform/functions meshoptimizer
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS, EXTMeshoptCompression } from '@gltf-transform/extensions';
import { dedup, prune, weld, simplify, textureCompress, quantize, resample, flatten, join } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'apps/web/public/assets/ph');
const FORCE = process.argv.includes('--force');
const ONLY = process.argv.find((a) => a.startsWith('--only='))?.slice(7).split(',');
const UA = { 'User-Agent': 'WeddingOnline-asset-fetch/1.0 (CC0 assets, credited in CREDITS.md)' };

/**
 * id → texture size, (for dense scans) the fraction of triangles to keep, and `set` for packs
 * of several variants (grass clumps, shrubs, rocks) whose pieces must stay separate meshes.
 */
export const MODELS = [
  // Lighting
  { id: 'Chandelier_01', tex: 1024 },
  { id: 'Chandelier_02', tex: 1024 },
  { id: 'Chandelier_03', tex: 1024 },
  { id: 'chinese_chandelier', tex: 1024 },
  { id: 'lantern_chandelier_01', tex: 1024 },
  { id: 'Lantern_01', tex: 1024 },
  { id: 'wooden_lantern_01', tex: 1024 },
  { id: 'street_lamp_01', tex: 1024 },
  { id: 'brass_candleholders', tex: 1024 },
  // Plants
  { id: 'potted_plant_01', tex: 1024, keep: 0.5 },
  { id: 'potted_plant_02', tex: 1024 },
  { id: 'potted_plant_04', tex: 1024 },
  { id: 'shrub_02', tex: 1024, set: true },
  { id: 'shrub_03', tex: 1024, set: true },
  { id: 'shrub_04', tex: 1024, set: true },
  { id: 'fern_02', tex: 1024, set: true },
  { id: 'grass_medium_01', tex: 1024, keep: 0.5, set: true },
  { id: 'grass_medium_02', tex: 1024, set: true },
  { id: 'flower_gazania', tex: 1024, keep: 0.5, set: true },
  { id: 'rock_moss_set_01', tex: 1024, set: true },
  { id: 'boulder_01', tex: 1024, keep: 0.5 },
  // Trees (dense photo scans: heavily simplified)
  { id: 'island_tree_01', tex: 1024, keep: 0.06 },
  { id: 'island_tree_02', tex: 1024, keep: 0.08 },
  { id: 'island_tree_03', tex: 1024, keep: 0.05 },
  { id: 'tree_small_02', tex: 1024, keep: 0.04 },
  { id: 'jacaranda_tree', tex: 1024, keep: 0.02 },
  // Decor
  { id: 'standing_picture_frame_02', tex: 1024 },
  { id: 'ceramic_vase_01', tex: 1024 },
  { id: 'ceramic_vase_03', tex: 1024 },
  { id: 'brass_vase_01', tex: 1024 },
  { id: 'painted_wooden_bench', tex: 1024 },
  { id: 'planter_box_01', tex: 1024 },
];

/** Surface kind in the app → Poly Haven texture */
export const TEXTURES = [
  { id: 'grass_ground', kind: 'grass' },
  { id: 'sand_01', kind: 'sand' },
  { id: 'wood_floor_deck', kind: 'wood' },
  { id: 'stone_tiles', kind: 'stone' },
  { id: 'patterned_terracotta_tiling', kind: 'tile' },
  { id: 'marble_01', kind: 'marble' },
  { id: 'snow_02', kind: 'snow' },
];

/** Venue mood → sky photograph */
export const HDRIS = [
  { id: 'kloofendal_48d_partly_cloudy_puresky', mood: 'day' },
  { id: 'qwantani_sunset_puresky', mood: 'sunset' },
  { id: 'qwantani_night_puresky', mood: 'night' },
];

async function json(url) {
  const r = await fetch(url, { headers: UA });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
}

async function download(url, file) {
  if (fs.existsSync(file) && !FORCE) return;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const r = await fetch(url, { headers: UA });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  const buf = Buffer.from(await r.arrayBuffer());
  fs.writeFileSync(file, buf);
}

const want = (id) => !ONLY || ONLY.includes(id);

async function fetchModel({ id, tex, keep, set }) {
  const out = path.join(OUT, 'models', `${id}.glb`);
  if (fs.existsSync(out) && !FORCE) return console.log(`= ${id}`);
  const files = await json(`https://api.polyhaven.com/files/${id}`);
  const g = files.gltf['1k'].gltf;
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), `ph-${id}-`));
  const main = path.join(tmp, path.basename(new URL(g.url).pathname));
  await download(g.url, main);
  await Promise.all(Object.entries(g.include).map(([rel, f]) => download(f.url, path.join(tmp, rel))));

  await MeshoptEncoder.ready;
  await MeshoptSimplifier.ready;
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder });
  const doc = await io.read(main);
  const steps = set ? [dedup(), flatten(), weld()] : [dedup(), flatten(), join(), weld()];
  if (keep && keep < 1) steps.push(simplify({ simplifier: MeshoptSimplifier, ratio: keep, error: 0.01 }));
  steps.push(
    resample(),
    prune(),
    textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [tex, tex], quality: 82 }),
    quantize(),
  );
  await doc.transform(...steps);
  doc.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({ method: EXTMeshoptCompression.EncoderMethod.QUANTIZE });
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await io.write(out, doc);
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`+ ${id}  ${(fs.statSync(out).size / 1e6).toFixed(2)} MB`);
}

async function fetchTexture({ id }) {
  const files = await json(`https://api.polyhaven.com/files/${id}`);
  const maps = { diff: files.Diffuse, nor: files.nor_gl, rough: files.Rough };
  for (const [suffix, entry] of Object.entries(maps)) {
    const out = path.join(OUT, 'textures', `${id}_${suffix}.webp`);
    if (fs.existsSync(out) && !FORCE) continue;
    const src = entry['2k'].jpg ?? entry['2k'].png;
    const r = await fetch(src.url, { headers: UA });
    const buf = Buffer.from(await r.arrayBuffer());
    fs.mkdirSync(path.dirname(out), { recursive: true });
    await sharp(buf).resize(2048, 2048, { fit: 'fill' }).webp({ quality: suffix === 'nor' ? 90 : 82 }).toFile(out);
  }
  console.log(`+ texture ${id}`);
}

async function fetchHdri({ id }) {
  const files = await json(`https://api.polyhaven.com/files/${id}`);
  await download(files.hdri['2k'].hdr.url, path.join(OUT, 'hdri', `${id}_2k.hdr`));
  console.log(`+ hdri ${id}`);
}

async function main() {
  const credits = [];
  for (const t of TEXTURES.filter((x) => want(x.id))) {
    await fetchTexture(t);
    credits.push(`texture ${t.id}`);
  }
  for (const h of HDRIS.filter((x) => want(x.id))) {
    await fetchHdri(h);
    credits.push(`hdri ${h.id}`);
  }
  for (const m of MODELS.filter((x) => want(x.id))) {
    try {
      await fetchModel(m);
      credits.push(`model ${m.id}`);
    } catch (e) {
      console.error(`! ${m.id}: ${e.message}`);
    }
  }
  const all = [...TEXTURES.map((t) => ['Texture', t.id]), ...HDRIS.map((h) => ['HDRI', h.id]), ...MODELS.map((m) => ['Model', m.id])];
  fs.writeFileSync(
    path.join(OUT, 'CREDITS.md'),
    `# Poly Haven assets\n\nAll assets in this folder come from [Poly Haven](https://polyhaven.com) and are released under\n[CC0](https://polyhaven.com/license) (public domain). Optimised for the web by \`scripts/fetch-polyhaven.mjs\`.\n\n| Type | Asset |\n| --- | --- |\n${all
      .map(([type, id]) => `| ${type} | [${id}](https://polyhaven.com/a/${id}) |`)
      .join('\n')}\n`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
