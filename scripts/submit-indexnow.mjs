#!/usr/bin/env node
/**
 * Submit all canonical URLs from sitemap.xml to IndexNow (Bing, Microsoft Copilot, Yandex, Naver).
 * Usage: node scripts/submit-indexnow.mjs [https://poiplegal.online]
 */
const SITE = (process.argv[2] || process.env.NEXT_PUBLIC_APP_URL || 'https://poiplegal.online').replace(/\/+$/, '');
const KEY = 'dco2026indexnow9a7e4b1c8f3d5e2a';
const host = new URL(SITE).host;

async function main() {
  const smRes = await fetch(`${SITE}/sitemap.xml`, {
    headers: { 'User-Agent': 'DamCuoiOnline-IndexNow/1.0' },
  });
  if (!smRes.ok) {
    throw new Error(`Failed to fetch sitemap.xml: HTTP ${smRes.status}`);
  }
  const xml = await smRes.text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
  if (urls.length === 0) {
    throw new Error('No <loc> URLs found in sitemap.xml');
  }

  const payload = {
    host,
    key: KEY,
    keyLocation: `${SITE}/${KEY}.txt`,
    urlList: urls,
  };

  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload),
  });
  const body = await res.text();
  console.log(`IndexNow submit (${urls.length} URLs for ${host}): HTTP ${res.status} ${body || 'OK'}`);
  if (res.status !== 200 && res.status !== 202) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
