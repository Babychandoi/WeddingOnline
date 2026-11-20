#!/usr/bin/env node
/**
 * Self-hosts the site's Google Fonts so `next build` never needs the network.
 *
 * Why: next/font/google downloads every face at build time. From some networks Google answers
 * with extension-less `/l/font?kit=…` URLs that crash next/font 14 (TypeError reading '1'),
 * which broke Docker deploys at random. This script downloads the Vietnamese + Latin subsets
 * once, into apps/web/public/fonts, and writes apps/web/src/app/fonts.css with the @font-face
 * rules (unicode-range kept, so browsers still fetch only the subset a page uses) and the CSS
 * variables the code already reads (--font-sans, --font-display, --f-*).
 *
 * Re-run after adding or changing a face:  node scripts/fetch-fonts.mjs
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'apps/web/public/fonts');
const CSS_FILE = path.join(ROOT, 'apps/web/src/app/fonts.css');
const SUBSETS = new Set(['vietnamese', 'latin']);
// A modern Chrome: Google then serves woff2 split by unicode-range
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

/** family → weights, and the CSS variables that name it */
const FACES = [
  // Site-wide (layout.tsx / tailwind: font-sans, font-display)
  { family: 'Be Vietnam Pro', weights: [300, 400, 500, 600, 700], vars: ['--font-sans', '--f-be-vietnam'], fallback: 'system-ui, sans-serif' },
  { family: 'Cormorant Garamond', weights: [600, 700], vars: ['--font-display'], fallback: 'Georgia, serif' },
  // Online invitation templates (components/invitation/themes.ts)
  { family: 'Noto Serif Display', weights: [400, 600, 700], vars: ['--f-noto-display'] },
  { family: 'Imperial Script', weights: [400], vars: ['--f-imperial'] },
  { family: 'Great Vibes', weights: [400], vars: ['--f-great-vibes'] },
  { family: 'Dancing Script', weights: [500, 700], vars: ['--f-dancing'] },
  { family: 'Prata', weights: [400], vars: ['--f-prata'] },
  { family: 'Josefin Sans', weights: [300, 400, 600], vars: ['--f-josefin'] },
  { family: 'Taviraj', weights: [400, 600], vars: ['--f-taviraj'] },
  { family: 'Ephesis', weights: [400], vars: ['--f-ephesis'] },
  { family: 'Moon Dance', weights: [400], vars: ['--f-moon-dance'] },
  { family: 'Spectral', weights: [400, 600], vars: ['--f-spectral'] },
  { family: 'EB Garamond', weights: [400, 600], vars: ['--f-garamond'] },
  { family: 'Old Standard TT', weights: [400, 700], vars: ['--f-old-standard'] },
  { family: 'Quicksand', weights: [400, 600], vars: ['--f-quicksand'] },
  { family: 'Archivo', weights: [400, 700, 900], vars: ['--f-archivo'] },
  { family: 'Yeseva One', weights: [400], vars: ['--f-yeseva'] },
  { family: 'Water Brush', weights: [400], vars: ['--f-water-brush'] },
  { family: 'Corinthia', weights: [700], vars: ['--f-corinthia'] },
  { family: 'Pinyon Script', weights: [400], vars: ['--f-pinyon'] },
  { family: 'The Nautigal', weights: [700], vars: ['--f-nautigal'] },
  { family: 'Alex Brush', weights: [400], vars: ['--f-alex-brush'] },
];

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url, as) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'user-agent': UA } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return as === 'text' ? await res.text() : Buffer.from(await res.arrayBuffer());
    } catch (err) {
      if (attempt === 4) throw new Error(`${url}: ${err.message}`);
      await sleep(600 * attempt);
    }
  }
}

fs.mkdirSync(OUT_DIR, { recursive: true });
const faceRules = [];
let files = 0;
let bytes = 0;

for (const face of FACES) {
  const familyParam = `${face.family.replace(/ /g, '+')}:wght@${face.weights.join(';')}`;
  const css = await get(`https://fonts.googleapis.com/css2?family=${familyParam}&display=swap`, 'text');
  const dir = path.join(OUT_DIR, slug(face.family));
  fs.mkdirSync(dir, { recursive: true });
  const blocks = [...css.matchAll(/\/\*\s*([a-z0-9-]+)\s*\*\/\s*@font-face\s*\{([^}]*)\}/g)];
  const kept = blocks.filter(([, subset]) => SUBSETS.has(subset));
  if (kept.length === 0) throw new Error(`${face.family}: no vietnamese/latin blocks`);
  const saved = new Map();
  for (const [, subset, body] of kept) {
    const url = body.match(/url\(([^)]+)\)/)?.[1];
    if (!url) throw new Error(`${face.family}: block without url`);
    let local = saved.get(url);
    if (!local) {
      const buf = await get(url);
      const name = `${slug(face.family)}-${subset}-${crypto.createHash('sha1').update(url).digest('hex').slice(0, 8)}.woff2`;
      fs.writeFileSync(path.join(dir, name), buf);
      local = `/fonts/${slug(face.family)}/${name}`;
      saved.set(url, local);
      files++;
      bytes += buf.length;
    }
    const decl = body
      .replace(/src:[^;]+;/, `src: url(${local}) format('woff2');`)
      .split(';')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => `  ${l};`)
      .join('\n');
    faceRules.push(`/* ${face.family} · ${subset} */\n@font-face {\n${decl}\n}`);
  }
  console.log(`${face.family.padEnd(20)} ${kept.length} blocks, ${saved.size} files`);
}

const vars = FACES.flatMap((f) => f.vars.map((v) => `  ${v}: '${f.family}'${f.fallback ? `, ${f.fallback}` : ''};`));
const header = `/*\n * Self-hosted Google Fonts (Vietnamese + Latin subsets), generated by scripts/fetch-fonts.mjs.\n * Do not edit by hand: change the list in the script and re-run it.\n */\n`;
fs.writeFileSync(CSS_FILE, `${header}\n${faceRules.join('\n\n')}\n\n:root {\n${vars.join('\n')}\n}\n`);
console.log(`\n${files} files, ${(bytes / 1024).toFixed(0)} KB → ${path.relative(ROOT, OUT_DIR)}; CSS → ${path.relative(ROOT, CSS_FILE)}`);
