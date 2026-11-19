import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootEnvPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../.env');
if (fs.existsSync(rootEnvPath)) {
  for (const raw of fs.readFileSync(rootEnvPath, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = val;
    }
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@dco/shared', '@dco/database', 'three'],
  images: {
    unoptimized: true,
  },
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma'],
  },
};

export default nextConfig;
